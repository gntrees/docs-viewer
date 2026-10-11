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
          ["name", "string", "from URL", "Display name; its extension is a last-resort detection hint (Content-Type wins)."],
          ["type", "string", "auto", "Force a MIME type/extension, or `auto` to detect it. Detection prefers the Content-Type; the URL extension is only a last resort."],
          ["loader", "auto | blob | direct", "auto", "See Loading & CORS."],
          ["engine", "auto | iframe | native | panzoom | shiki | microsoft-docs-viewer | google-docs-viewer", "auto", "Engine preference; auto uses the recommended order with fallback. Query alias: engine."],
          ["preflight", "true | false | auto", "auto", "Probe before rendering (CORS HEAD). An explicit value wins; `auto` probes only when the type needs detecting (`type` auto/unset). A 404/410 fails fast."],
          ["code.theme", "string", "github-light/dark", "Shiki theme for the shiki engine."],
          ["code.lang", "string", "from extension", "Force a Shiki language id for the shiki engine."],
          ["image.fullscreen", "boolean", "true", "Click the image to open it fullscreen (panzoom engine)."],
        ],
      },
      {
        type: "p",
        text: "Complex config can be passed as base64url JSON via `?config=`:",
      },
      { type: "code", code: "?config=eyJlbmdpbmUiOiJzaGlraSJ9&file=/report.pdf" },
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
          ["image", "Panzoom", "Inline zoom/pan/rotate/flip viewer with an inline-SVG toolbar (engine: panzoom) → native <img>. Click opens fullscreen (image.fullscreen)."],
          ["text", "Shiki", "shiki (highlight) → google-docs-viewer. Fetches the bytes (needs CORS)."],
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
          "video → `google-docs-viewer` → download",
        ],
      },
      {
        type: "p",
        text: "**Images** use Panzoom (engine `panzoom`) inline: a flat solid background, wheel-zoom/pinch, drag-to-pan, rotate, flip and a small toolbar built from inline SVG (zoom in/out, 1:1, rotate both ways, flip both ways, fit, fullscreen) — no background-image sprites. Click-to-fullscreen is on by default (`image.fullscreen`, the only configurable option). If Panzoom cannot load, `auto` falls back to the native `<img>`.",
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
        text: "docx/xlsx/pptx (and more) are rendered by a third-party viewer in an iframe, so the file must be reachable at a **public absolute URL**. `localhost`, `blob:` URLs and anything behind auth will not work (expose them via a tunnel or proxy).",
      },
      {
        type: "p",
        text: "The two remote viewers are ordinary **engines** — select one explicitly, or let `auto` fall back from Microsoft to Google:",
      },
      {
        type: "list",
        items: [
          "`microsoft-docs-viewer` (default): view.officeapps.live.com — explicit \"no training\" terms, occasional 404s.",
          "`google-docs-viewer`: wider coverage (images, video, text, Office, PDF, …), 25 MB limit, unclear terms — avoid for personal data.",
          "Fallback between them is timeout-based, since cross-provider failures cannot be detected directly.",
          "Endpoints are fixed (view.officeapps.live.com / docs.google.com); register a custom renderer to proxy or self-host.",
        ],
      },
      {
        type: "p",
        text: "**Detection limits:** a remote viewer is a cross-origin iframe, so the client cannot read its status or body — an error page still fires `load`. The available signals are a **preflight** probe (`preflight`, default `auto`: it runs when the type needs detecting, and an explicit `true`/`false` always wins) and the fallback **timeout**. Detection prefers the probe's `Content-Type`; the URL extension is only a last resort. A proxy is needed for full reliability.",
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
        text: "**@gntrees/docs-viewer** is a framework-agnostic document viewer: a Web Component (`<gnt-docs-viewer>`) that renders PDF, Office, images, video and code, choosing a renderer automatically and falling back when one fails. Use it from plain HTML, React, Vue or Solid — or mount it straight from a URL with a single `?file=…` parameter.",
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
