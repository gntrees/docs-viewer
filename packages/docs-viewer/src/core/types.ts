/**
 * Public types for the framework-agnostic document viewer.
 *
 * The same shape is used by props, HTML attributes and URL query parameters,
 * so anything you can express in code you can also express in a link.
 */

/**
 * How the document bytes reach the viewer.
 * - `direct`: hand the original URL straight to the renderer (no CORS needed).
 * - `blob`: fetch the bytes and hand the renderer a `blob:` URL (needs CORS).
 * - `auto`: `direct`, except where a renderer explicitly needs bytes.
 */
export type LoaderMode = "auto" | "blob" | "direct";

/**
 * Built-in renderer engines. The two remote viewers are engines too — there is
 * no separate "provider" concept.
 */
export type BuiltinEngine =
  | "auto"
  | "iframe"
  | "native"
  | "panzoom"
  | "shiki"
  | "microsoft-docs-viewer"
  | "google-docs-viewer";

/**
 * Engine preference. `"auto"` tries the recommended renderers in priority order
 * and falls back on failure; any other value is a *preference* tried first, with
 * the remaining renderers still available as fallbacks. Custom renderers may use
 * their own engine names.
 */
export type Engine = BuiltinEngine | (string & {});

export type FileKind =
  | "pdf"
  | "image"
  | "text"
  | "office"
  | "video"
  | "audio"
  | "unknown";

/** Options for the Shiki code renderer (engine `"shiki"`). */
export interface CodeViewerConfig {
  /** Shiki theme id. Defaults to `github-light`/`github-dark` based on `prefers-color-scheme`. */
  theme?: string;
  /** Force a Shiki language id; otherwise inferred from the file extension. */
  lang?: string;
}

/**
 * Options for the image renderer (engine `"panzoom"`).
 *
 * The viewer is chrome-less apart from its own small toolbar; only the
 * click-to-fullscreen behaviour can be turned off.
 */
export interface ImageViewerConfig {
  /** Click the image to open it fullscreen. Defaults to `true`. */
  fullscreen?: boolean;
}

/** Everything a consumer may pass in. All fields are optional. */
export interface ViewerConfig {
  /** URL of the document to display. */
  source?: string;
  /** Display name / filename. Also used for extension detection and downloads. */
  name?: string;
  /**
   * Force the detected type:
   * - a MIME type (`application/pdf`) or a bare extension (`pdf`) forces that type;
   * - `"auto"` (the default when unset) detects it — from the preflight response
   *   `Content-Type` first, falling back to the URL extension.
   *
   * An extension is only trusted as a last resort, since a URL can lie.
   */
  type?: string;
  loader?: LoaderMode;
  /** Credentials mode used when `loader` is `blob`. */
  credentials?: RequestCredentials;
  /** Engine preference; `"auto"` picks the recommended renderer with fallback. */
  engine?: Engine;
  /**
   * When to probe the file (CORS `HEAD`) before rendering. A definitive 404/410
   * fails fast; CORS-blocked or network errors are treated as "unknown" and
   * rendering proceeds. The probe also exposes the response `Content-Type`, which
   * is used for detection.
   *
   * - `true` — always probe absolute `http(s)` URLs;
   * - `false` — never probe (detect from `type` / the extension only);
   * - `"auto"` (default) — probe only when it can change the outcome, i.e. when
   *   `type` is `"auto"`/unset. A known `type` is used directly, with no probe.
   *
   * An explicitly configured value always wins.
   */
  preflight?: boolean | "auto";
  code?: CodeViewerConfig;
  image?: ImageViewerConfig;
}

/** Config after defaults have been applied. */
export interface ResolvedConfig {
  source?: string;
  name?: string;
  type?: string;
  loader: LoaderMode;
  credentials: RequestCredentials;
  engine: Engine;
  preflight: boolean | "auto";
  code: CodeViewerConfig;
  image: ImageViewerConfig;
}

export interface DetectedFile {
  kind: FileKind;
  mime: string;
  ext: string;
}

/** Everything a renderer needs to draw a document. */
export interface RenderContext {
  /** URL the renderer should point at (may be a `blob:` URL). */
  displayUrl: string;
  /** The URL originally supplied by the consumer. */
  source?: string;
  name: string;
  mime: string;
  ext: string;
  kind: FileKind;
  config: ResolvedConfig;
  /** Call when the renderer fails, so the viewer can fall back to the next renderer. */
  fail?: (error: unknown) => void;
}

export interface RendererInstance {
  /** Called when the config changes without a full remount. Optional. */
  update?(ctx: RenderContext): void | Promise<void>;
  destroy(): void;
}

/**
 * A renderer owns one document format. Register custom ones with
 * `DocsViewerElement.registry.register()` or by passing a registry.
 */
export interface Renderer {
  id: string;
  /** Public engine name used by the `engine` config (e.g. "iframe", "shiki"). */
  engine?: string;
  /**
   * Set for renderers that fetch the file server-side (remote viewers). The
   * element then forces `loader: "direct"` so they receive the original URL.
   */
  requiresPublicUrl?: boolean;
  /** Higher is tried first when several renderers match the same context. */
  priority?: number;
  match(ctx: RenderContext): boolean;
  mount(container: HTMLElement, ctx: RenderContext): RendererInstance;
}
