export type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "code"; code: string }
  | { type: "list"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] };

export interface DocSection {
  id: string;
  title: string;
  /** One-line summary, used in the overview's link list and each file's frontmatter. */
  description?: string;
  blocks: Block[];
}

export const sections: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting started",
    description: "Install the package and mount your first viewer in plain HTML.",
    blocks: [
      {
        type: "p",
        text: "gntrees docs-viewer ships one vanilla TypeScript core as a Web Component (`<gnt-docs-viewer>`), framework wrappers, and a `standalone` entry that renders from URL query parameters. The core has no UI dependencies and no Tailwind requirement.",
      },
      { type: "code", code: "bun add @gntrees/docs-viewer" },
      {
        type: "p",
        text: "Plain HTML/JS — importing the package registers the custom element:",
      },
      {
        type: "code",
        code: `import "@gntrees/docs-viewer";

// <gnt-docs-viewer source="/report.pdf"></gnt-docs-viewer>`,
      },
    ],
  },
  {
    id: "plain-js",
    title: "Plain JS",
    description: "Use the Web Component from vanilla JavaScript with attributes or the config property.",
    blocks: [
      { type: "p", text: "Set attributes for simple cases, or assign the `config` property:" },
      {
        type: "code",
        code: `import { mountViewer, mountFromQuery } from "@gntrees/docs-viewer";

mountViewer("#host", { source: "/report.pdf" });

// Or read everything from the URL (?file=/report.pdf&engine=iframe):
mountFromQuery("#host");`,
      },
      {
        type: "p",
        text: "The element emits `gnt-ready`, `gnt-error` and `gnt-config-change` events.",
      },
    ],
  },
  {
    id: "react",
    title: "React",
    description: "Drop the React wrapper into a component tree with props and event callbacks.",
    blocks: [
      {
        type: "code",
        code: `import { DocsViewer } from "@gntrees/docs-viewer/react";

export function App() {
  return (
    <DocsViewer
      source="/report.pdf"
      style={{ height: "80vh" }}
      onReady={(ctx) => console.log("ready", ctx)}
      onError={(err) => console.error(err)}
    />
  );
}`,
      },
    ],
  },
  {
    id: "preact",
    title: "Preact",
    description: "Use the Preact wrapper with the same props API as the React wrapper.",
    blocks: [
      {
        type: "code",
        code: `import { DocsViewer } from "@gntrees/docs-viewer/preact";

export function App() {
  return (
    <DocsViewer
      source="/report.pdf"
      style={{ height: "80vh" }}
      onReady={(ctx) => console.log("ready", ctx)}
      onError={(err) => console.error(err)}
    />
  );
}`,
      },
      {
        type: "p",
        text: "The Preact wrapper mirrors the React one: config as props, `class` for styling and `onReady` / `onError` callbacks.",
      },
    ],
  },
  {
    id: "vue",
    title: "Vue",
    description: "Use the Vue wrapper with a single config object and ready/error events.",
    blocks: [
      {
        type: "code",
        code: `<script setup>
import { DocsViewer } from "@gntrees/docs-viewer/vue";
const config = { source: "/report.pdf" };
</script>

<template>
  <DocsViewer :config="config" style="height: 80vh" @ready="onReady" />
</template>`,
      },
      { type: "p", text: "The Vue wrapper takes a single `config` object and emits `ready` / `error`." },
    ],
  },
  {
    id: "solid",
    title: "Solid",
    description: "Use the Solid wrapper, which accepts config as props.",
    blocks: [
      {
        type: "code",
        code: `import { DocsViewer } from "@gntrees/docs-viewer/solid";

export function App() {
  return <DocsViewer source="/report.pdf" onReady={(ctx) => console.log(ctx)} />;
}`,
      },
      { type: "p", text: "The Solid wrapper accepts config as props (plus `class`)." },
    ],
  },
  {
    id: "svelte",
    title: "Svelte",
    description: "Mount the viewer from Svelte with an action — no component compilation needed.",
    blocks: [
      {
        type: "code",
        code: `<script>
  import { docsViewer } from "@gntrees/docs-viewer/svelte";
  const config = { source: "/report.pdf" };
</script>

<div style="height: 80vh" use:docsViewer={{ ...config, onReady: (ctx) => console.log(ctx) }}></div>`,
      },
      {
        type: "p",
        text: "The Svelte entry exports a `docsViewer` action (`use:docsViewer`) that takes every `ViewerConfig` field plus `onReady` / `onError`.",
      },
    ],
  },
  {
    id: "url-mode",
    title: "URL mode",
    description: "Render a document straight from URL query parameters, with no application code.",
    blocks: [
      {
        type: "p",
        text: "Mount straight from query parameters — no application code required:",
      },
      {
        type: "code",
        code: `<div data-gnt-viewer style="height: 100vh"></div>
<script type="module">
  import "@gntrees/docs-viewer/standalone";
</script>

<!-- then open: /page.html?file=/report.pdf&engine=google-docs-viewer -->`,
      },
      {
        type: "p",
        text: "The standalone entry mounts into `[data-gnt-viewer]`, then `#app`, then the page body.",
      },
    ],
  },
  {
    id: "configuration",
    title: "Configuration",
    description: "Every configuration field, its default, the merge order and the ?config= JSON escape hatch.",
    blocks: [
      {
        type: "p",
        text: "Sources merge in this order (later wins): **defaults → HTML attributes → `config` property**. In URL mode: **defaults → `?config=` JSON → simple query params**.",
      },
      {
        type: "table",
        head: ["Field", "Type", "Default", "Notes"],
        rows: [
          ["source", "string", "—", "Document URL. Query aliases: file, url, src."],
          ["name", "string", "from URL", "Display name; its extension is a last-resort detection hint (Content-Type wins). Usually derived from the URL; override it via the advanced `?config=` blob."],
          ["entry", "string", "—", "Deep-link one member of an archive: the archive at `source` opens with its path (breadcrumb) restored to `entry`, and the member is previewed below it. `entry` is a `/`-separated path that may chain **through nested archives** (`inner.zip/doc.pdf`). Used by the archive's own open-in-new-page action. Advanced (`?config=`)."],
          ["entryBase", "string", "current page", "Absolute base URL the archive uses for its member deep-links (defaults to the current page). Advanced (`?config=`); normally unnecessary."],
          ["type", "string", "auto", "Lock detection. Accepts a kind alias (pdf, image, video, audio, text, code, table, markup, html, markdown, font, archive, office, word, excel, powerpoint), a MIME (`application/pdf`) or family (`image/*`), or a bare extension (`docx`). `auto` detects from the Content-Type; the URL extension is only a last resort. Query alias: type."],
          ["engine", "auto | iframe | native | panzoom | shiki | hls | markup | microsoft-docs-viewer | google-docs-viewer", "auto", "Engine preference; auto uses the recommended order with fallback. Query alias: engine."],
          ["loader", "auto | direct | blob", "auto", "How bytes reach the renderer: `direct` streams the file over HTTP range requests (no CORS needed); `blob` fetches the whole file first (needs CORS). Query alias: loader."],
          ["credentials", "omit | same-origin | include", "same-origin", "Request credentials mode, used when `loader: blob`. Query alias: credentials."],
          ["preflight", "true | false | auto", "true", "Probe before rendering (CORS HEAD). `true` (default) always probes absolute `http(s)` URLs, so a missing file fails fast with a clear message even when `type` is locked. `false` never probes. `auto` probes only when the type needs detecting (`type` auto/unset). A 404/410 fails fast. Streaming media (video/audio/HLS) is never probed, and a probe that does not answer within a few seconds is abandoned (treated as unknown). Query alias: preflight."],
          ["theme", "auto | light | dark", "auto", "Viewer colour theme. `auto` follows the OS/browser preference (`prefers-color-scheme`); `light`/`dark` force it (set as `data-theme` on the host). Also honours a `theme` HTML attribute. Query alias: theme."],
          ["code.theme", "string", "github-light/dark", "Shiki theme for the shiki engine."],
          ["code.lang", "string", "from extension", "Force a Shiki language id for the shiki engine. Query alias: lang."],
          ["image.fullscreen", "boolean", "true", "Fullscreen on click and the toolbar's fullscreen button (panzoom engine)."],
          ["video.controls", "boolean", "true", "Show the browser's native video/audio controls (native engine)."],
          ["video.autoplay", "boolean", "false", "Autoplay on load; browsers require muted media for this."],
          ["video.muted", "boolean", "true when autoplay", "Start muted."],
          ["video.loop", "boolean", "false", "Loop playback."],
          ["video.poster", "string", "—", "Poster image URL (video only)."],
          ["video.info", "boolean", "true", "Show a small format/duration/seek/buffer info line over the media (native & hls engines)."],
          ["markup.sandbox", "boolean", "true", "Render HTML/Markdown inside a sandboxed `<iframe>` (no scripts, no same-origin) so untrusted markup can never run code or reach the host page. Set `false` to render inline (best-effort sanitised — trusted sources only)."],
          ["markup.baseUrl", "string", "source directory", "Base URL used to resolve relative links and images inside the rendered document."],
          ["markup.gfm", "boolean", "true", "Enable GitHub-Flavored Markdown (tables, strikethrough, task lists, …)."],
        ],
      },
      {
        type: "p",
        text: "**Advanced.** `loader` (`direct` | `blob`) controls how bytes reach the renderer: `direct` streams the file over HTTP range requests, while `blob` fetches the whole file first (needs CORS) — useful for short-lived or sensitive URLs. `credentials` only applies with `loader: blob`. You rarely need either: the media renderers offer a one-click **Load fully** when a host is not seekable.",
      },
      {
        type: "p",
        text: "Universal knobs live in the query string so links stay readable: `?file=/report.pdf&type=image&engine=panzoom&theme=dark&loader=blob&credentials=include&preflight=true`. Advanced keys (`name`/`entry`/`entryBase`) and the type-specific config (`code`/`image`/`video`/`markup`) are emitted as a base64url `?config=` blob, and only when they differ from the defaults. Simple query params always win over the blob, and the document URL stays in `?file=` rather than being duplicated inside it.",
      },
      {
        type: "p",
        text: "Complex config can be passed as base64url JSON via `?config=`, mixed freely with the scalar params:",
      },
      { type: "code", code: "?file=/report.pdf&type=code&config=eyJjb2RlIjp7ImxhbmciOiJydXN0In19" },
    ],
  },
  {
    id: "renderers",
    title: "Renderers",
    description: "How each file kind is rendered, code language coverage and the loading/CORS modes.",
    blocks: [
      {
        type: "table",
        head: ["Kind", "Renderer", "Notes"],
        rows: [
          ["pdf", "<iframe>", "Native browser PDF viewer (engine: iframe)."],
          ["image", "Panzoom", "Inline zoom/pan/rotate/flip viewer with an inline-SVG toolbar (engine: panzoom) → native <img>. Click opens fullscreen (image.fullscreen). Formats a browser cannot decode (PSD, DXF, AI, EPS/PS, XPS) end at the Google viewer."],
          ["video", "Native <video>", "HTML5 player (engine: native) → google-docs-viewer. Plays directly; no third-party viewer needed."],
          ["audio", "Native <audio>", "HTML5 audio (engine: native)."],
          ["video (.m3u8)", "hls.js", "HLS streaming, segment by segment (engine: hls) → native → google-docs-viewer."],
          ["text", "Shiki", "shiki (highlight) → google-docs-viewer. Fetches the bytes (needs CORS)."],
          ["table", "DIY <table>", "CSV/TSV/TAB via a built-in RFC 4180 parser (engine: table) → shiki → download. Sticky header, numeric columns right-aligned; caps at 1000 rows with a \"Load all\" button. Fetches the bytes (needs CORS). Excel stays `office`."],
          ["markup", "DIY (rendered) + Shiki (source)", "HTML (.html/.htm) and Markdown (.md/.markdown/.mdx), engine: markup. Shows the rendered document by default (Markdown via a lazily-loaded `marked`; HTML as-is, with its own styles left untouched so it renders exactly as authored) and the content bar's toggle switches to the Shiki-highlighted source. Untrusted markup is isolated in a sandboxed `<iframe>` (markup.sandbox) so it can never run scripts or leak styles into the host page. Fetches the bytes (needs CORS). Falls back to shiki → google-docs-viewer → download."],
          ["font", "DIY specimen", "(engine: font) → google-docs-viewer → download. Renders a specimen (sample, size ladder, glyphs) via `FontFace`, and reads the real Family/Subfamily + unitsPerEm from the font tables (TTF/OTF/WOFF free; WOFF2 via a lazily-loaded Brotli decoder)."],
          ["archive", "DIY browser", "(engine: archive) → google-docs-viewer → download. A Google-Drive-style browser for ZIP (built-in parser), RAR (lazily-loaded decoder) and TAR / .tar.gz (built-in parser): the archive opens as a single file that extracts on click, then a single breadcrumb header, a filter and a sortable table. Folders and nested archives extend the same breadcrumb; opening a file renders a nested viewer **below the path**, so nothing leaves the page. A member can still be deep-linked (`?file=<archive>&entry=<path>`, which the open-in-new-page action points at the host's `/view/` route) and downloaded. Office members (docx/xlsx/pptx) cannot be previewed inline — their remote viewers need a public URL — so they offer a download instead. TAR members are stored, so only gzip is decompressed."],
          ["office", "<iframe> (remote)", "docx/xlsx/pptx/odt via Office or Google viewer."],
          ["other", "fallback", "Message + download link."],
        ],
      },
      {
        type: "p",
        text: "**Code languages:** the `shiki` engine highlights any of Shiki's 200+ languages — full list at https://shiki.style/languages. Detection is by file extension (py, go, rs, rb, java, php, swift, …), and you can force one with `code.lang`. The playground's Language dropdown is a curated subset with public samples.",
      },
      {
        type: "p",
        text: "**Loading & CORS:** `direct` (default) hands the original URL to the renderer — no CORS needed and the only mode compatible with the fixed-endpoint remote viewers. `blob` fetches the bytes (requires CORS) and is useful when the source URL is short-lived.",
      },
    ],
  },
  {
    id: "engine",
    title: "Engine & fallback",
    description: "How auto picks a renderer with fallback, and how forcing a specific engine disables it.",
    blocks: [
      {
        type: "p",
        text: "`engine: \"auto\"` is the only mode that falls back: matching renderers are ordered by priority and the viewer moves to the next one whenever one fails.",
      },
      { type: "p", text: "**auto (recommended)** prefers the zero-dependency native engine and keeps the richer engines as fallbacks:" },
      {
        type: "list",
        items: [
          "pdf → `iframe` → `google-docs-viewer` → download",
          "image → `panzoom` → `native` → `google-docs-viewer` → download",
          "office → `microsoft-docs-viewer` → `google-docs-viewer` → download",
          "text → `shiki` → `google-docs-viewer` → download",
          "table → `table` → `shiki` → `google-docs-viewer` → download",
          "markup → `markup` → `shiki` → `google-docs-viewer` → download",
          "font → `font` → `google-docs-viewer` → download",
          "archive → `archive` → `google-docs-viewer` → download",
          "video → `native` → `google-docs-viewer` → download",
          "audio → `native` → download",
          "`.m3u8` → `hls` → `native` → `google-docs-viewer` → download",
        ],
      },
      {
        type: "p",
        text: "**Images** use Panzoom (engine `panzoom`) inline: a flat solid background, wheel-zoom/pinch, drag-to-pan, rotate, flip and a small toolbar built from inline SVG (zoom in/out, 1:1, rotate both ways, flip both ways, fit, fullscreen) — no background-image sprites. Click-to-fullscreen and the toolbar's fullscreen button are on by default (`image.fullscreen`). If Panzoom cannot load, `auto` falls back to the native `<img>`.",
      },
      {
        type: "p",
        text: "**Video & audio** play through the browser directly — `<video controls>` / `<audio controls>` (engine `native`), configured with `video.*`. If the browser cannot decode the codec, `auto` falls back to the Google viewer for video.",
      },
      {
        type: "p",
        text: "**Large media** streams progressively via HTTP range requests (`Accept-Ranges: bytes`) — it is not downloaded in full first. A host that ignores ranges (answers a `Range` request with `200`) forces a full download *and* breaks seeking, so pick one that returns `206`. For adaptive streaming, point the viewer at an HLS playlist (`engine: hls`, `.m3u8`) — segments load on demand. The `native` and `hls` renderers also show a small info line (format, duration, resolution, seekability, buffered %) that you can turn off with `video.info: false`; when a file is not seekable, the info line offers a one-click **Load fully**.",
      },
      {
        type: "p",
        text: "**Need more than that?** For tiled deep-zoom imagery (IIIF/DZI) register a dedicated renderer — e.g. OpenSeadragon — or use PhotoSwipe for an overlay lightbox UX.",
      },
      { type: "p", text: "Selecting a specific engine is **exclusive** — only that engine is used; if it cannot render the document the viewer emits an error (no fallback):" },
      { type: "code", code: '<gnt-docs-viewer source="/report.pdf" engine="iframe"></gnt-docs-viewer>' },
    ],
  },
  {
    id: "toolbar",
    title: "Toolbar",
    description: "There is no built-in toolbar — drive the viewer from your own UI via its methods.",
    blocks: [
      {
        type: "p",
        text: "There is no built-in toolbar — the viewer is chrome-less and the renderers add no controls. Build your own UI and call the element's methods:",
      },
      {
        type: "table",
        head: ["Method", "Action"],
        rows: [
          ["download()", "Download the current document."],
          ["print()", "Print (uses the rendered iframe when available)."],
          ["toggleFullscreen()", "Toggle fullscreen on the element."],
          ["reload()", "Re-render with the current config."],
        ],
      },
      { type: "p", text: "Combine with the `gnt-ready` / `gnt-error` / `gnt-config-change` events." },
    ],
  },
  {
    id: "office",
    title: "Office & remote viewers",
    description: "Preview docx/xlsx/pptx through third-party viewers, and their detection limits.",
    blocks: [
      {
        type: "p",
        text: "docx/xlsx/pptx (and more) are rendered by a third-party viewer in an iframe, so the file must be reachable at a **public absolute URL**. `localhost`, `blob:` URLs and anything behind auth will not work (expose them via a tunnel or proxy). Non-`http(s)` sources are skipped for the remote engines entirely, so they fall straight through to the download fallback.",
      },
      {
        type: "p",
        text: "The two remote viewers are ordinary **engines** — select one explicitly, or let `auto` fall back from Microsoft to Google:",
      },
      {
        type: "list",
        items: [
          "`microsoft-docs-viewer` (default): view.officeapps.live.com — explicit \"no training\" terms, occasional 404s.",
          "`google-docs-viewer`: widest coverage — images (incl. PSD, DXF, AI, EPS/PS, XPS), video, text, Office, PDF, fonts (TTF), archives (zip/rar) — 25 MB limit, unclear terms; avoid for personal data.",
          "Fallback between them is timeout-based, since cross-provider failures cannot be detected directly.",
          "Endpoints are fixed (view.officeapps.live.com / docs.google.com); register a custom renderer to proxy or self-host.",
        ],
      },
      {
        type: "p",
        text: "**Detection limits:** a remote viewer is a cross-origin iframe, so the client cannot read its status or body — an error page still fires `load`. The available signals are a **preflight** probe (`preflight`, default `true`: it probes absolute URLs and an explicit `false`/`auto` always wins) and the fallback **timeout**. Detection prefers the probe's `Content-Type`; the URL extension is only a last resort. A proxy is needed for full reliability.",
      },
      {
        type: "code",
        code: '<gnt-docs-viewer source="/report.docx" engine="google-docs-viewer"></gnt-docs-viewer>',
      },
    ],
  },
  {
    id: "custom-renderer",
    title: "Custom renderer",
    description: "Register your own renderer for a file kind or format.",
    blocks: [
      {
        type: "code",
        code: `import { DocsViewerElement } from "@gntrees/docs-viewer";

DocsViewerElement.registry.register({
  id: "my-pdf",
  priority: 100,
  match: (ctx) => ctx.kind === "pdf",
  mount(container, ctx) {
    // ...render into container...
    return { destroy() { /* cleanup */ } };
  },
});`,
      },
      {
        type: "p",
        text: "Renderers are matched by priority; thrown errors inside `match` are ignored.",
      },
    ],
  },
  {
    id: "theming",
    title: "Theming",
    description: "Customize the viewer with CSS custom properties.",
    blocks: [
      { type: "p", text: "Override CSS custom properties on the host or any ancestor:" },
      {
        type: "code",
        code: `gnt-docs-viewer {
  --gnt-bg: #0b0b0c;
  --gnt-fg: #fafafa;
  --gnt-radius: 10px;
  --gnt-min-height: 500px;
}`,
      },
    ],
  },
  {
    id: "events",
    title: "Events",
    description: "Listen to gnt-ready, gnt-error and gnt-config-change.",
    blocks: [
      {
        type: "table",
        head: ["Event", "Detail"],
        rows: [
          ["gnt-ready", "The RenderContext that was mounted."],
          ["gnt-error", "{ error }."],
          ["gnt-config-change", "The resolved config after each update."],
        ],
      },
    ],
  },
];

/**
 * Build the synthetic "Overview" section. It is generated from the real sections
 * so its reference links (and their filenames) can never drift out of sync when a
 * section is renamed or added.
 */
export function buildOverview(docs: DocSection[], origin = ""): DocSection {
  const base = origin.replace(/\/+$/, "");
  const href = (path: string): string => `${base}${path}`;

  return {
    id: "overview",
    title: "Overview",
    description: "A map of the documentation — every section is a standalone markdown file.",
    blocks: [
      {
        type: "p",
        text: "**@gntrees/docs-viewer** is a framework-agnostic document viewer: a Web Component (`<gnt-docs-viewer>`) that renders PDF, Office, images, video and code, choosing a renderer automatically and falling back when one fails. Use it from plain HTML, React, Preact, Vue, Svelte or Solid — or mount it straight from a URL with a single `?file=…` parameter.",
      },
      {
        type: "p",
        text: "This page is the entry point for the reference. Each entry links to its section; click ⤓ to download that section as a standalone markdown file.",
      },
      {
        type: "list",
        items: docs.map((doc) => {
          const label = `[${doc.title}](${href(`/docs/#${doc.id}`)})`;
          const summary = doc.description ? ` — ${doc.description}` : "";
          return `${label}${summary} [⤓](${href(`/docs/${doc.id}.md`)})`;
        }),
      },
      {
        type: "p",
        text: `Prefer a single file? [Download](${href("/docs/docs.md")}) — the whole reference in one markdown file.`,
      },
    ],
  };
}
