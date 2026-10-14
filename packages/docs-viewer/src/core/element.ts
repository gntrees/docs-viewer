import { extractArchiveEntry } from "./archive/archive";
import { parseQuery, resolveConfig, toPreflight } from "./config";
import { detect, fileNameFromUrl, kindFromMime, normalizeContentType } from "./detect";
import { loadDocument, type LoadedDocument } from "./loader";
import { probe } from "./preflight";
import { RendererRegistry } from "./registry";
import { ensureStyles } from "./styles";
import { TAG } from "./tag";
import type {
  DetectedFile,
  RenderContext,
  Renderer,
  RendererInstance,
  ResolvedConfig,
  ViewerConfig,
} from "./types";
import { createDefaultRegistry } from "../renderer";

export { TAG };

const OBSERVED_ATTRIBUTES = [
  "source",
  "file",
  "url",
  "name",
  "type",
  "loader",
  "preflight",
  "theme",
] as const;

type Status = "loading" | "ready" | "error" | "empty";

/**
 * Resolve the `HTMLElement` base at module load so the package can be imported
 * in non-DOM environments (SSR, Node, unit tests) without throwing. The class
 * is inert until `customElements` registers it in a browser.
 */
const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement !== "undefined" ? HTMLElement : (class {} as unknown as typeof HTMLElement);

/**
 * `<gnt-docs-viewer>` — a framework-agnostic document viewer.
 *
 * Configure it with HTML attributes for simple cases, or assign the `config`
 * property (used by the React/Vue/Solid wrappers) for the full surface.
 */
export class DocsViewerElement extends HTMLElementBase {
  /** Shared renderer registry. Register custom renderers here to enable them everywhere. */
  static registry: RendererRegistry = createDefaultRegistry();

  static get observedAttributes(): string[] {
    return [...OBSERVED_ATTRIBUTES];
  }

  #props: ViewerConfig = {};
  #registryOverride: RendererRegistry | null = null;
  #viewportEl: HTMLElement;
  #statusEl: HTMLElement;
  #instance: RendererInstance | null = null;
  #revoke: (() => void) | null = null;
  #controller: AbortController | null = null;
  #runId = 0;
  #connected = false;
  #config: ResolvedConfig | null = null;
  #displayUrl: string | null = null;
  #candidates: Renderer[] = [];
  #candidateIndex = 0;
  #currentRendererId: string | null = null;
  #activeContext: RenderContext | null = null;
  #lastError: unknown = null;

  constructor() {
    super();
    this.#viewportEl = document.createElement("div");
    this.#viewportEl.className = "gnt-dv-viewport";
    this.#statusEl = document.createElement("div");
    this.#statusEl.className = "gnt-dv-status";
  }

  // -- public API ----------------------------------------------------------

  get config(): ViewerConfig {
    return this.#props;
  }
  set config(value: ViewerConfig) {
    this.#props = { ...value };
    this.#apply();
  }

  get source(): string | undefined {
    return this.#props.source;
  }
  set source(value: string | undefined) {
    this.#props = { ...this.#props, source: value ?? undefined };
    this.#apply();
  }

  get registry(): RendererRegistry {
    return this.#registryOverride ?? (this.constructor as typeof DocsViewerElement).registry;
  }
  set registry(value: RendererRegistry) {
    this.#registryOverride = value;
    this.#apply();
  }

  /** The config after defaults and attribute merging. */
  get resolvedConfig(): ResolvedConfig | null {
    return this.#config;
  }

  /** Re-run loading/rendering with the current config. */
  reload(): void {
    if (this.#config) void this.#load(this.#config);
  }

  download(): void {
    const config = this.#config;
    const href = this.#displayUrl ?? config?.source;
    if (!href) return;
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = config?.name ?? fileNameFromUrl(config?.source);
    anchor.rel = "noopener";
    this.ownerDocument.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  print(): void {
    const frame = this.#viewportEl.querySelector("iframe");
    try {
      const frameWindow = frame?.contentWindow;
      if (frameWindow) {
        frameWindow.focus();
        frameWindow.print();
        return;
      }
    } catch {
      // Cross-origin frames throw; fall back to printing the host page.
    }
    window.print();
  }

  async toggleFullscreen(): Promise<void> {
    try {
      if (this.ownerDocument.fullscreenElement === this) {
        await this.ownerDocument.exitFullscreen();
      } else {
        await this.requestFullscreen();
      }
    } catch {
      // Fullscreen can be rejected (e.g. not user-initiated); ignore.
    }
  }

  // -- lifecycle -----------------------------------------------------------

  connectedCallback(): void {
    if (this.#connected) return;
    this.#connected = true;
    ensureStyles(this.ownerDocument);
    this.#viewportEl.replaceChildren();
    this.append(this.#viewportEl, this.#statusEl);
    this.#apply();
  }

  disconnectedCallback(): void {
    this.#teardown();
    this.#connected = false;
  }

  attributeChangedCallback(): void {
    if (this.#connected) this.#apply();
  }

  // -- internals -----------------------------------------------------------

  #readAttributes(): ViewerConfig {
    const get = (name: string): string | undefined => this.getAttribute(name) ?? undefined;
    const props: ViewerConfig = {};

    const source = get("source") ?? get("file") ?? get("url");
    if (source) props.source = source;

    const name = get("name");
    if (name) props.name = name;

    const type = get("type");
    if (type) props.type = type;

    const loader = get("loader");
    if (loader) props.loader = loader as ViewerConfig["loader"];

    const preflight = get("preflight");
    if (preflight !== undefined) props.preflight = toPreflight(preflight);

    const theme = get("theme");
    if (theme) props.theme = theme as ViewerConfig["theme"];

    return props;
  }

  #apply(): void {
    if (!this.#connected) return;

    const config = resolveConfig(this.#readAttributes(), this.#props);
    this.#config = config;

    this.classList.add("gnt-dv-host");

    // `auto` follows `prefers-color-scheme`; a set theme pins `data-theme`.
    if (config.theme !== "auto") this.setAttribute("data-theme", config.theme);
    else this.removeAttribute("data-theme");

    this.dispatchEvent(new CustomEvent("gnt-config-change", { detail: config }));

    // A change that cannot affect loading (theme, `image.fullscreen`, `video.*`, …)
    // is applied in place when the mounted renderer supports it, so the document is
    // not re-fetched and re-detected for a purely cosmetic update.
    if (this.#updateInPlace(config)) return;
    void this.#load(config);
  }

  /**
   * Apply a config change to the mounted renderer without reloading the document.
   * Only safe when nothing that feeds loading/detection changed; returns `false`
   * to fall through to a full reload.
   */
  #updateInPlace(config: ResolvedConfig): boolean {
    const active = this.#activeContext;
    const instance = this.#instance;
    if (!active || !instance?.update) return false;
    if (this.#loadSignature(active.config) !== this.#loadSignature(config)) return false;

    const next: RenderContext = {
      ...active,
      config,
      fail: (error) => this.#handleCandidateFailure(this.#runId, error),
    };
    try {
      const result = instance.update(next);
      if (result instanceof Promise) {
        void result.catch((error) => this.#handleCandidateFailure(this.#runId, error));
      }
    } catch {
      return false;
    }
    this.#activeContext = next;
    this.dispatchEvent(new CustomEvent("gnt-ready", { detail: next }));
    return true;
  }

  /** Config fields whose change requires re-fetching/re-detecting the document. */
  #loadSignature(config: ResolvedConfig): string {
    return JSON.stringify([
      config.source,
      config.name,
      config.type,
      config.entry,
      config.loader,
      config.credentials,
      config.preflight,
      config.engine,
    ]);
  }

  async #load(config: ResolvedConfig): Promise<void> {
    const runId = ++this.#runId;
    this.#controller?.abort();
    this.#controller = new AbortController();
    this.#destroyRenderer();
    this.#releaseDocument();

    if (!config.source) {
      this.#setStatus("empty", "No document source provided. Pass ?file=… in the URL or set the `source` attribute.");
      return;
    }

    // Derive the display name from the source URL so detection works when only
    // `source` is provided (the common case).
    let name = config.name ?? fileNameFromUrl(config.source);

    // An explicit `type` (MIME or extension) is authoritative; `"auto"`/unset
    // means "detect it" (from the preflight Content-Type, then the extension).
    const typeOverride = config.type && config.type !== "auto" ? config.type : undefined;
    const wantsAutoDetect = !config.type || config.type === "auto";

    // `entry` previews one member of an archive. When the source *is* an archive we
    // leave the entry to the archive renderer, so the page keeps the archive's path
    // (breadcrumb) chrome. For any other source we extract the member and render its
    // bytes directly (a blob), detecting by the entry name.
    let preloaded: LoadedDocument | null = null;
    if (config.entry && detect(name, typeOverride).kind !== "archive") {
      const response = await fetch(config.source, { signal: this.#controller.signal });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim());
      const { bytes, name: entryName } = await extractArchiveEntry(
        await response.arrayBuffer(),
        config.entry,
      );
      if (runId !== this.#runId) return;
      // Carry the member's MIME type so a PDF (etc.) renders inside an iframe.
      const objectUrl = URL.createObjectURL(
        new Blob([bytes as BlobPart], { type: detect(entryName, undefined).mime }),
      );
      preloaded = { displayUrl: objectUrl, revoke: () => URL.revokeObjectURL(objectUrl) };
      name = entryName;
    }

    const isAbsolute = /^https?:/i.test(config.source);

    // Streaming media (video/audio, incl. HLS) is played by the browser's native
    // element, so a reachability probe only adds latency — and some media hosts
    // stall on HEAD. Skip the probe for those kinds.
    const guess = detect(name, typeOverride);
    const streams = guess.kind === "video" || guess.kind === "audio";

    // Preflight resolution:
    //   - `false` never probes;
    //   - `"auto"` probes only when the type needs detecting;
    //   - `true` (the default) always probes absolute URLs, so a missing file
    //     fails fast with a clear message even when `type` is locked.
    const shouldProbe =
      isAbsolute &&
      !streams &&
      (config.preflight === true || (config.preflight === "auto" && wantsAutoDetect));

    this.#setStatus("loading");

    try {
      let detected: DetectedFile;
      if (preloaded) {
        // An extracted entry is already bytes; detect from the entry name only.
        detected = detect(name, typeOverride);
      } else if (shouldProbe) {
        // A definitive 404/410 fails fast; CORS-blocked hosts report "unknown"
        // and rendering proceeds, falling back to the extension.
        const result = await probe(config.source, this.#controller.signal);
        if (runId !== this.#runId) return;
        if (result.status === "fail") throw new Error(`"${name}" is not reachable.`);

        // The response Content-Type is authoritative over the extension.
        const contentType = normalizeContentType(result.contentType);
        detected =
          contentType && kindFromMime(contentType) !== "unknown"
            ? detect(name, typeOverride, contentType)
            : detect(name, typeOverride);
      } else {
        // No probe: use the explicit type, or the extension as a last resort.
        detected = detect(name, typeOverride);
      }

      // Remote viewers fetch the file server-side, so they need the original URL —
      // never a blob: URL. Probe the engine order and force `direct` if the winning
      // renderer requires a publicly reachable URL.
      const predicted: RenderContext = {
        displayUrl: preloaded?.displayUrl ?? config.source ?? "",
        source: config.source,
        name,
        mime: detected.mime,
        ext: detected.ext,
        kind: detected.kind,
        config,
      };
      const firstRenderer = this.#selectCandidates(
        this.registry.candidates(predicted),
        config.engine,
      )[0];
      const effective: ResolvedConfig = firstRenderer?.requiresPublicUrl
        ? { ...config, loader: "direct" }
        : config;

      const loaded = preloaded ?? (await loadDocument(effective, this.#controller.signal));
      if (runId !== this.#runId) {
        loaded.revoke?.();
        return;
      }
      this.#revoke = loaded.revoke ?? null;
      this.#displayUrl = loaded.displayUrl;

      const context: RenderContext = {
        displayUrl: loaded.displayUrl,
        source: preloaded ? undefined : effective.source,
        name,
        mime: detected.mime,
        ext: detected.ext,
        kind: detected.kind,
        config: effective,
        fail: (error) => this.#handleCandidateFailure(runId, error),
      };

      this.#viewportEl.replaceChildren();

      this.#activeContext = context;
      this.#candidates = this.#selectCandidates(
        this.registry.candidates(context),
        effective.engine,
      );
      this.#candidateIndex = 0;
      this.#lastError = null;

      if (this.#candidates.length === 0) {
        throw new Error(
          effective.engine === "auto"
            ? "No renderer is registered for this document."
            : `No renderer is available for engine "${effective.engine}".`,
        );
      }

      if (!this.#mountNextCandidate(runId)) {
        throw this.#lastError ?? new Error("All renderers failed to preview this document.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (runId !== this.#runId) return;
      this.#reportFailure(runId, error);
    }
  }

  #setStatus(state: Status, message?: string): void {
    this.dataset.state = state;
    this.#statusEl.dataset.state = state;
    if (state === "ready") {
      this.#statusEl.hidden = true;
      this.#statusEl.textContent = "";
      return;
    }
    this.#statusEl.hidden = false;
    this.#statusEl.textContent = state === "loading" ? "Loading…" : message ?? "";
  }

  /**
   * Choose the renderers to try. `"auto"` keeps the full priority-ordered list
   * (with fallbacks); a specific engine is exclusive — only renderers with that
   * engine name are used, and a failure is reported instead of falling back.
   */
  #selectCandidates(candidates: Renderer[], engine: string): Renderer[] {
    if (!engine || engine === "auto") return candidates;
    return candidates.filter((renderer) => renderer.engine === engine);
  }

  /** Mount the current candidate, advancing past any that throw synchronously. */
  #mountNextCandidate(runId: number): boolean {
    const context = this.#activeContext;
    if (!context) return false;

    while (this.#candidateIndex < this.#candidates.length) {
      const renderer = this.#candidates[this.#candidateIndex];
      if (!renderer) {
        this.#candidateIndex += 1;
        continue;
      }
      this.#currentRendererId = renderer.id;
      try {
        const instance = renderer.mount(this.#viewportEl, context);
        if (runId !== this.#runId) {
          instance.destroy();
          return false;
        }
        this.#instance = instance;
        this.#setStatus("ready");
        this.dispatchEvent(new CustomEvent("gnt-ready", { detail: context }));
        return true;
      } catch (error) {
        this.#lastError = error;
        this.#candidateIndex += 1;
      }
    }
    return false;
  }

  /** A mounted renderer reported an asynchronous failure: fall back to the next one. */
  #handleCandidateFailure(runId: number, error: unknown): void {
    if (runId !== this.#runId) return;
    const active = this.#candidates[this.#candidateIndex];
    if (!active || active.id !== this.#currentRendererId) return;

    this.#lastError = error;
    this.#destroyRenderer();
    this.#viewportEl.replaceChildren();
    this.#candidateIndex += 1;

    if (!this.#mountNextCandidate(runId)) {
      this.#reportFailure(runId, this.#lastError);
    }
  }

  #reportFailure(runId: number, error: unknown): void {
    if (runId !== this.#runId) return;
    const message = error instanceof Error ? error.message : String(error);
    this.#setStatus("error", `Failed to load document: ${message}`);
    this.dispatchEvent(new CustomEvent("gnt-error", { detail: { error } }));
  }

  #destroyRenderer(): void {
    this.#instance?.destroy();
    this.#instance = null;
    this.#currentRendererId = null;
  }

  #releaseDocument(): void {
    this.#revoke?.();
    this.#revoke = null;
    this.#displayUrl = null;
  }

  #teardown(): void {
    this.#runId += 1;
    this.#controller?.abort();
    this.#controller = null;
    this.#destroyRenderer();
    this.#releaseDocument();
    this.#candidates = [];
    this.#candidateIndex = 0;
    this.#activeContext = null;
  }
}

/** Register the custom element. Safe to call multiple times. */
export function defineDocsViewer(tag: string = TAG): void {
  if (typeof customElements === "undefined") return;
  if (!customElements.get(tag)) customElements.define(tag, DocsViewerElement);
}

/**
 * Imperatively create a viewer inside `target`. Handy in plain JS and as the
 * building block for the framework wrappers.
 */
export function mountViewer(
  target: HTMLElement | string,
  config: ViewerConfig,
): DocsViewerElement {
  defineDocsViewer();
  const container =
    typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (!container) throw new Error(`mountViewer: target not found: ${String(target)}`);

  const viewer = document.createElement(TAG) as DocsViewerElement;
  viewer.style.display = "block";
  viewer.style.width = "100%";
  viewer.style.height = "100%";
  container.appendChild(viewer);
  viewer.config = config;
  return viewer;
}

/** Build a config from a query string, then mount a viewer. */
export function mountFromQuery(
  target: HTMLElement | string,
  search: string = window.location.search,
): DocsViewerElement {
  return mountViewer(target, parseQuery(search));
}
