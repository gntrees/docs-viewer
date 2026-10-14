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
  | "native" // native <img> / <video> / <audio>
  | "panzoom"
  | "shiki"
  | "hls"
  | "markup"
  | "microsoft-docs-viewer"
  | "google-docs-viewer";

/**
 * Engine selection. `"auto"` (the default) tries every matching renderer in
 * priority order and falls back to the next one on failure. Any other value is
 * **exclusive**: only renderers whose `engine` matches are used, and a failure is
 * reported instead of falling back to the next renderer. Custom renderers may use
 * their own engine names.
 */
export type Engine = BuiltinEngine | (string & {});

export type FileKind =
  | "pdf"
  | "image"
  | "text"
  | "table"
  | "markup"
  | "office"
  | "video"
  | "audio"
  | "font"
  | "archive"
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
  /**
   * Enable fullscreen: click the image to open it, and show the toolbar's
   * fullscreen button. Defaults to `true`.
   */
  fullscreen?: boolean;
}

/** Native `video`/`audio` playback options for the `native` engine. */
export interface VideoViewerConfig {
  /** Show the browser's native controls. Defaults to `true`. */
  controls?: boolean;
  /**
   * Start playback automatically. Browsers only allow this for muted media, so
   * `muted` defaults to `true` whenever `autoplay` is on unless set explicitly.
   */
  autoplay?: boolean;
  /** Start muted. Defaults to `true` when `autoplay` is set, otherwise `false`. */
  muted?: boolean;
  /** Loop playback. Defaults to `false`. */
  loop?: boolean;
  /** Poster image URL (video only). */
  poster?: string;
  /**
   * Show a small info line with format, duration, resolution, seekability and
   * buffered progress. Defaults to `true`.
   */
  info?: boolean;
}

/**
 * Options for the markup renderer (engine `"markup"`) — HTML and Markdown.
 *
 * The rendered document is shown by default, with the content bar's toggle
 * switching to the raw source (Shiki-highlighted). Untrusted markup is isolated
 * in a sandboxed `<iframe>` so it can never run scripts or reach the host page.
 */
export interface MarkupViewerConfig {
  /**
   * Render inside a sandboxed `<iframe>` (default `true`). The frame has no
   * `allow-scripts`/`allow-same-origin`, so scripts never run and the document
   * cannot touch the host page. Set `false` to render inline in the viewer
   * instead (best-effort sanitised — only for trusted sources).
   */
  sandbox?: boolean;
  /**
   * Base URL used to resolve relative links and images inside the document.
   * Defaults to the directory of `source`.
   */
  baseUrl?: string;
  /** Enable GitHub-Flavored Markdown (tables, strikethrough, …). Default `true`. */
  gfm?: boolean;
}

/** Viewer colour theme. `auto` follows the OS/browser preference. */
export type Theme = "auto" | "light" | "dark";

/** Everything a consumer may pass in. All fields are optional. */
export interface ViewerConfig {
  /** URL of the document to display. */
  source?: string;
  /** Display name / filename. Also used for extension detection and downloads. */
  name?: string;
  /**
   * Preview one member of an archive (ZIP/RAR). When set, the viewer fetches the
   * archive at `source` and extracts `entry` before detection/rendering. Query
   * alias: entry.
   */
  entry?: string;
  /**
   * Absolute URL used to open archive members in a new page. Defaults to the
   * current page — correct when the viewer *is* the page. An embedded viewer (a
   * playground, a docs site) points it at its dedicated viewer route.
   */
  entryBase?: string;
  /**
   * Force the detected type:
   * - a **kind alias** (`pdf`, `image`, `video`, `audio`, `text`, `code`, `table`,
   *   `font`, `archive`, `office`, `word`, `excel`, `powerpoint`) locks the whole kind;
   * - a **MIME type** (`application/pdf`) or **MIME family** (`image/*`) locks
   *   that MIME / family;
   * - a bare **extension** (`pdf`, `docx`) locks via the extension table;
   * - `"auto"` (the default when unset) detects it — from the preflight response
   *   `Content-Type` first, falling back to the URL extension.
   *
   * An extension is only trusted as a last resort, since a URL can lie.
   */
  type?: string;
  /** How bytes reach the renderer. Query alias: loader. */
  loader?: LoaderMode;
  /** Credentials mode used when `loader` is `blob`. Query alias: credentials. */
  credentials?: RequestCredentials;
  /** Engine preference; `"auto"` picks the recommended renderer with fallback. */
  engine?: Engine;
  /**
   * When to probe the file (CORS `HEAD`) before rendering. A definitive 404/410
   * fails fast; CORS-blocked or network errors are treated as "unknown" and
   * rendering proceeds. The probe also exposes the response `Content-Type`, which
   * is used for detection.
   *
   * - `true` (default) — always probe absolute `http(s)` URLs, so a missing file
   *   fails fast with a clear message even when `type` is locked;
   * - `false` — never probe (detect from `type` / the extension only);
   * - `"auto"` — probe only when it can change the outcome, i.e. when `type` is
   *   `"auto"`/unset. A known `type` is used directly, with no probe.
   *
   * An explicitly configured value always wins.
   */
  preflight?: boolean | "auto";
  /**
   * Colour theme. `"auto"` (default) follows the OS/browser preference via
   * `prefers-color-scheme`; `"light"`/`"dark"` force it. Applied as `data-theme`
   * on the host. Query alias: theme.
   */
  theme?: Theme;
  code?: CodeViewerConfig;
  image?: ImageViewerConfig;
  /** Native `video`/`audio` playback options (engine `native`). */
  video?: VideoViewerConfig;
  /** HTML / Markdown rendering options (engine `markup`). */
  markup?: MarkupViewerConfig;
}

/** Config after defaults have been applied. */
export interface ResolvedConfig {
  source?: string;
  name?: string;
  entry?: string;
  entryBase?: string;
  type?: string;
  loader: LoaderMode;
  credentials: RequestCredentials;
  engine: Engine;
  preflight: boolean | "auto";
  theme: Theme;
  code: CodeViewerConfig;
  image: ImageViewerConfig;
  video: VideoViewerConfig;
  markup: MarkupViewerConfig;
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
  /**
   * Apply a config change in place, instead of a full remount. Optional: the
   * element only calls it when the resolved document is unchanged (same source,
   * type, loader and detection) and this renderer is still the first candidate.
   * When a renderer omits it, the element destroys and re-mounts it instead.
   */
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
