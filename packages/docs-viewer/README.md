# @gntrees/docs-viewer

A framework-agnostic document viewer shipped as a Web Component
(`<gnt-docs-viewer>`). One core, consumable from plain JS/HTML, React, Preact,
Vue, Svelte or Solid — plus a `standalone` entry that renders straight from URL
query params.

- **Plain JS / HTML** — `<script type="module">` + a tag.
- **React / Preact / Vue / Svelte / Solid** — thin wrappers over the same custom element.
- **URL mode** — `?file=…&engine=iframe`.
- **Many formats** — PDF, images, video/audio (incl. HLS), code/text, CSV tables,
  HTML/Markdown, fonts and ZIP/RAR/TAR archives, plus Office via a remote viewer.
- **No framework in the core** — the core is vanilla TypeScript with zero UI
  dependencies. Framework libs are optional peer dependencies.
- **No Tailwind in the library** — styles are injected once and themed with CSS
  custom properties.

## Install

```sh
bun add @gntrees/docs-viewer
# or: npm i @gntrees/docs-viewer
```

Framework bindings pull the framework only if you import them:

```sh
bun add react react-dom          # for @gntrees/docs-viewer/react
bun add preact                   # for @gntrees/docs-viewer/preact
bun add vue                      # for @gntrees/docs-viewer/vue
bun add svelte                   # for @gntrees/docs-viewer/svelte
bun add solid-js                 # for @gntrees/docs-viewer/solid
```

## Usage

### Plain JS / HTML

```html
<script type="module">
  import "@gntrees/docs-viewer";
</script>

<gnt-docs-viewer source="/docs/report.pdf"></gnt-docs-viewer>
```

Or imperatively:

```js
import { mountViewer, mountFromQuery } from "@gntrees/docs-viewer";

mountViewer("#host", { source: "/docs/report.pdf" });
// or straight from the URL: /page.html?file=/docs/report.pdf
mountFromQuery("#host");
```

### React

```tsx
import { DocsViewer } from "@gntrees/docs-viewer/react";

export function App() {
  return (
    <DocsViewer
      source="/docs/report.pdf"
      style={{ height: "80vh" }}
      onReady={(ctx) => console.log("ready", ctx)}
      onError={(err) => console.error(err)}
    />
  );
}
```

### Preact

```tsx
import { DocsViewer } from "@gntrees/docs-viewer/preact";

export function App() {
  return (
    <DocsViewer
      source="/docs/report.pdf"
      style={{ height: "80vh" }}
      onReady={(ctx) => console.log("ready", ctx)}
      onError={(err) => console.error(err)}
    />
  );
}
```

### Vue

```vue
<script setup>
import { DocsViewer } from "@gntrees/docs-viewer/vue";
const config = { source: "/docs/report.pdf" };
</script>

<template>
  <DocsViewer :config="config" style="height: 80vh" @ready="onReady" @error="onError" />
</template>
```

### Svelte

The Svelte entry exports an [action](https://svelte.dev/docs/svelte/use) — no
component compilation, just `use:docsViewer`:

```svelte
<script>
  import { docsViewer } from "@gntrees/docs-viewer/svelte";
  const config = { source: "/docs/report.pdf" };
</script>

<div style="height: 80vh" use:docsViewer={{ ...config, onReady: (ctx) => console.log(ctx) }}></div>
```

### Solid

```tsx
import { DocsViewer } from "@gntrees/docs-viewer/solid";

export function App() {
  return <DocsViewer source="/docs/report.pdf" onReady={(ctx) => console.log(ctx)} />;
}
```

### URL mode (standalone)

```html
<div data-gnt-viewer style="height: 100vh"></div>
<script type="module">
  import "@gntrees/docs-viewer/standalone";
</script>
```

Then open `/index.html?file=/docs/report.pdf`. The `standalone` entry mounts into
`[data-gnt-viewer]`, then `#app`, then the page body.

## Configuration

Sources are merged in this order (later wins):
**defaults → HTML attributes → `config` property**. In URL mode:
**defaults → `?config=` JSON → simple query params**.

| Field | Type | Default | Notes |
|---|---|---|---|
| `source` | `string` | — | Document URL. Query aliases: `file`, `url`, `src`. |
| `name` | `string` | from URL | Display name; its extension is a last-resort detection hint (Content-Type wins). Advanced (`?config=`). |
| `entry` | `string` | — | Deep-link one member of an archive: the archive at `source` opens with its path restored to `entry`, and the member is previewed below it. A `/`-separated path that may chain **through nested archives** (`inner.zip/doc.pdf`). Advanced (`?config=`). |
| `entryBase` | `string` | current page | Absolute base URL the archive uses for its member deep-links. Advanced (`?config=`); normally unnecessary. |
| `type` | `string` | `auto` | Lock detection: a kind alias (`pdf`, `image`, `video`, `audio`, `text`, `code`, `table`, `markup`, `html`, `markdown`, `font`, `archive`, `office`, `word`, `excel`, `powerpoint`), a MIME (`application/pdf`) or family (`image/*`), or a bare extension (`docx`). `auto` detects from the Content-Type; the URL extension is only a last resort. Query alias: `type`. |
| `engine` | `auto \| iframe \| native \| panzoom \| shiki \| hls \| table \| markup \| font \| archive \| microsoft-docs-viewer \| google-docs-viewer` | `auto` | `auto` uses the recommended order with fallback; any other value is **exclusive** (see *Engine & fallback*). Query alias: `engine`. |
| `loader` | `auto \| direct \| blob` | `auto` | `direct` streams the file over HTTP range requests (no CORS needed); `blob` fetches the whole file first (needs CORS). Query alias: `loader`. |
| `credentials` | `omit \| same-origin \| include` | `same-origin` | Request credentials mode, used when `loader: blob`. Query alias: `credentials`. |
| `preflight` | `true \| false \| auto` | `true` | CORS `HEAD` probe before rendering. `true` always probes absolute `http(s)` URLs (a definitive 404/410 fails fast); `false` never probes; `auto` probes only when the type needs detecting. Streaming media is never probed, and a slow probe is abandoned (treated as unknown). Query alias: `preflight`. |
| `theme` | `auto \| light \| dark` | `auto` | Colour theme. `auto` follows `prefers-color-scheme`; `light`/`dark` pin `data-theme` on the host. Query alias: `theme`. |
| `code.theme` | `string` | `github-light`/`github-dark` | Shiki theme for the `shiki` engine. |
| `code.lang` | `string` | from extension | Force a Shiki language id. Query alias: `lang`. |
| `image.fullscreen` | `boolean` | `true` | Click-to-fullscreen and the toolbar's fullscreen button (`panzoom` engine). |
| `video.controls` | `boolean` | `true` | Show the browser's native controls (`native` engine). |
| `video.autoplay` | `boolean` | `false` | Autoplay on load (browsers require muted media). |
| `video.muted` | `boolean` | `true` when autoplay | Start muted. |
| `video.loop` | `boolean` | `false` | Loop playback. |
| `video.poster` | `string` | — | Poster image URL (video only). |
| `video.info` | `boolean` | `true` | Show the format/duration/seek/buffer info line (`native` & `hls` engines). |
| `markup.sandbox` | `boolean` | `true` | Render HTML/Markdown in a sandboxed `<iframe>` (no scripts, no same-origin). Set `false` to render inline (trusted sources only). |
| `markup.baseUrl` | `string` | source directory | Base URL for relative links/images inside the rendered document. |
| `markup.gfm` | `boolean` | `true` | Enable GitHub-Flavored Markdown. |

Complex config can be passed in a link as base64url JSON:

```
?config=eyJlbmdpbmUiOiJzaGlraSJ9&file=/docs/report.pdf
```

## Loading & CORS

- `direct` (default) hands the original URL to the renderer. **No CORS needed.**
  This is the only mode compatible with the fixed-endpoint Office/Google viewers.
- `blob` fetches the bytes and hands over a `blob:` URL. Requires CORS on the
  file host; useful when the source URL is short-lived or must not leak to a
  third party.

## Renderers

| Kind | Renderer | Notes |
|---|---|---|
| `pdf` | `<iframe>` | Native browser PDF viewer (`engine: "iframe"`). |
| `image` | Panzoom | Inline zoom/pan/rotate/flip viewer with an inline-SVG toolbar (`engine: "panzoom"`) → native `<img>`. Click opens fullscreen (`image.fullscreen`). |
| `video` | Native `<video>` | HTML5 player (`engine: "native"`) → `google-docs-viewer`. |
| `audio` | Native `<audio>` | HTML5 audio (`engine: "native"`). |
| `video (.m3u8)` | hls.js | HLS streaming, segment by segment (`engine: "hls"`) → `native` → `google-docs-viewer`. |
| `text` | Shiki | `shiki` (syntax highlight) → `google-docs-viewer`. Fetches the bytes (needs CORS). |
| `table` | Built-in `<table>` | CSV/TSV/TAB via a built-in RFC 4180 parser (`engine: "table"`) → `shiki` → download. Fetches the bytes (needs CORS). Excel stays `office`. |
| `markup` | Rendered + Shiki (source) | HTML and Markdown (`engine: "markup"`); the displayed document by default, with the content bar's toggle switching to the Shiki-highlighted source. Sandboxed by default (`markup.sandbox`). Falls back to `shiki` → `google-docs-viewer` → download. |
| `font` | Specimen | `FontFace` specimen with the real Family/Subfamily and unitsPerEm (`engine: "font"`) → `google-docs-viewer` → download. |
| `archive` | Browser | Google-Drive-style ZIP/RAR/TAR browser (`engine: "archive"`), with folders, nested archives and member deep-links → `google-docs-viewer` → download. |
| `office` | `<iframe>` (remote) | `microsoft-docs-viewer` (default) → `google-docs-viewer`. |
| other | fallback | Message + download link. |

### Engine & fallback

`engine: "auto"` (the default) is the only mode that falls back: matching
renderers are ordered by priority and the viewer moves to the next one whenever
one fails. It prefers the zero-dependency native engines and keeps the richer
engines as fallbacks:

| Kind | auto order |
|---|---|
| pdf | `iframe` → `google-docs-viewer` → download |
| image | `panzoom` → `native` → `google-docs-viewer` → download |
| office | `microsoft-docs-viewer` → `google-docs-viewer` → download |
| text | `shiki` → `google-docs-viewer` → download |
| table | `table` → `shiki` → `google-docs-viewer` → download |
| markup | `markup` → `shiki` → `google-docs-viewer` → download |
| font | `font` → `google-docs-viewer` → download |
| archive | `archive` → `google-docs-viewer` → download |
| video | `native` → `google-docs-viewer` → download |
| audio | `native` → download |
| `.m3u8` | `hls` → `native` → `google-docs-viewer` → download |

Selecting a specific engine is **exclusive** — only that engine is used, and if
it cannot render the document the viewer reports an error (no fallback):

```html
<gnt-docs-viewer source="/report.pdf" engine="iframe"></gnt-docs-viewer>
```

`shiki` powers the `shiki` engine — syntax highlighting for every `text`-kind
document (plain text *and* source code, 200+ languages). It is a regular
dependency, loaded lazily (code-split by your bundler) and, on failure, `auto`
falls back to the remote viewers. Control it with `code.theme` / `code.lang`; the
theme follows `prefers-color-scheme` (`github-light` / `github-dark`) by default.

`panzoom` powers the `panzoom` engine — an inline [Panzoom](https://github.com/timmywil/panzoom)
image viewer (wheel-zoom, drag-to-pan, no external UI) loaded lazily the same
way. Its toolbar is built from inline SVG (no background-image sprites) and sits
on a flat solid background: zoom in/out, 1:1, rotate, fit, download and
fullscreen. Rotation is applied to the image while Panzoom transforms a wrapper,
so panning stays aligned to the screen at any rotation. The only configurable
option is click-to-fullscreen (`image.fullscreen`, default `true`). If it cannot
load, `auto` falls back to the native `<img>`.

`hls` powers the `hls` engine for `.m3u8` playlists, using [hls.js](https://github.com/video-dev/hls.js)
(loaded lazily) for adaptive streaming; it falls back to the native `<video>`
and then the remote viewers. Video and audio use the browser's own `<video>` /
`<audio>` element (`native` engine), and large files stream over HTTP range
requests rather than downloading in full.

### Office & remote viewers

These are rendered by a **third-party viewer** in an iframe, so the file must be
reachable at a **public absolute URL**. `localhost`, `blob:` URLs and anything
behind auth will not work (expose them via a tunnel or a proxy if needed).

The two remote viewers are ordinary **engines** — there is no separate
`provider` setting:

- **`microsoft-docs-viewer`** (default): `view.officeapps.live.com`. Microsoft
  publishes explicit "no training" terms; occasionally returns intermittent 404s.
- **`google-docs-viewer`**: wider coverage (images, video, text, Office, PDF, …),
  25 MB limit. Google does **not** publish clear terms, so avoid it for personal
  data.

`auto` tries Microsoft first and falls back to Google; fallback is
**timeout-based**, since cross-provider failures cannot be detected directly.
The endpoints are fixed (`view.officeapps.live.com` / `docs.google.com`);
register a custom renderer if you need to proxy or self-host.

**Detection limits.** A remote viewer is a cross-origin iframe, so the client
cannot read its status or body: an error page still fires `load`. The signals
available are (a) a **preflight** `HEAD` check (`preflight`, default on, run for
every file: a definitive 404/410 fails fast) and (b) the fallback **timeout**.
Use a proxy if you need full reliability.

```html
<gnt-docs-viewer source="/report.docx" engine="google-docs-viewer"></gnt-docs-viewer>
```

### Custom renderer

```js
import { DocsViewerElement } from "@gntrees/docs-viewer";

DocsViewerElement.registry.register({
  id: "my-pdf",
  priority: 100,
  match: (ctx) => ctx.kind === "pdf",
  mount(container, ctx) {
    // ...render into container...
    return {
      // Optional: apply config changes without a remount.
      update(next) { /* … */ },
      destroy() { /* cleanup */ },
    };
  },
});
```

## Toolbar

The viewer is chrome-less — the renderers add no controls, and the `panzoom` image
engine ships only its own small inline-SVG toolbar (zoom in/out, 1:1, rotate, fit,
download, fullscreen) on a solid background. Build your own UI and drive the
element:

| Method | Action |
|---|---|
| `download()` | Download the current document. |
| `print()` | Print (uses the rendered iframe when available). |
| `toggleFullscreen()` | Toggle fullscreen on the element. |
| `reload()` | Re-render with the current config. |

Combine with the `gnt-ready` / `gnt-error` / `gnt-config-change` events. The
plain `<img>` and iframe engines remain natively interactive (browser zoom/pan).

## Theming

Override CSS variables on the host (or any ancestor):

```css
gnt-docs-viewer {
  --gnt-bg: #0b0b0c;
  --gnt-fg: #fafafa;
  --gnt-radius: 10px;
  --gnt-min-height: 500px;
}
```

## Events

| Event | Detail |
|---|---|
| `gnt-ready` | The `RenderContext` that was mounted. |
| `gnt-error` | `{ error }`. |
| `gnt-config-change` | The resolved config after each update. |

## Development

```sh
bun install
bun run --filter @gntrees/docs-viewer build      # build dist/
bun run --filter @gntrees/docs-viewer typecheck  # tsc --noEmit
bun run --filter @gntrees/docs-viewer test       # vitest (happy-dom)

# serve the repo root, then open:
#   /examples/html/?file=/packages/docs-viewer/README.md
bun run example:serve
```

## Not yet implemented

- Client-side Office rendering (currently iframe-based).
