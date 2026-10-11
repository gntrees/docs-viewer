# @gntrees/docs-viewer

A framework-agnostic document viewer shipped as a Web Component
(`<gnt-docs-viewer>`). One core, consumable from plain JS/HTML, React, Vue or
Solid — plus a `standalone` entry that renders straight from URL query params.

- **Plain JS / HTML** — `<script type="module">` + a tag.
- **React / Vue / Solid** — thin wrappers over the same custom element.
- **URL mode** — `?file=…&engine=iframe`.
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
bun add vue                      # for @gntrees/docs-viewer/vue
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

Then open `/index.html?file=/docs/report.pdf`. The `standalone` entry
mounts into `[data-gnt-viewer]`, then `#app`, then the page body.

## Configuration

Sources are merged in this order (later wins):
**defaults → HTML attributes → `config` property**. In URL mode:
**defaults → `?config=` JSON → simple query params**.

| Field | Type | Default | Notes |
|---|---|---|---|
| `source` | `string` | — | Document URL. Query aliases: `file`, `url`, `src`. |
| `name` | `string` | from URL | Display name + extension detection + download name. |
| `type` | `string` | auto | Force a MIME type or extension, e.g. `pdf`. |
| `loader` | `auto \| blob \| direct` | `auto` | See *Loading & CORS* below. |
| `credentials` | `RequestCredentials` | `same-origin` | Used when `loader` is `blob`. |
| `engine` | `auto \| iframe \| native \| panzoom \| shiki \| microsoft-docs-viewer \| google-docs-viewer` | `auto` | Engine preference; `auto` uses the recommended order with fallback. Query alias: `engine`. |
| `preflight` | `boolean` | `true` | CORS `HEAD` reachability check before rendering; a 404/410 fails fast. |
| `code.theme` | `string` | `github-light`/`github-dark` | Shiki theme for the `shiki` engine. |
| `code.lang` | `string` | from extension | Force a Shiki language id for the `shiki` engine. |
| `image.fullscreen` | `boolean` | `true` | Click the image to open it fullscreen (`panzoom` engine). |

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
| `image` | Panzoom | Inline zoom/pan viewer with an inline-SVG toolbar (`engine: "panzoom"`) → native `<img>`. Click opens fullscreen (`image.fullscreen`). |
| `text` | Shiki | `shiki` (syntax highlight) → `google-docs-viewer`. Fetches the bytes (needs CORS). |
| `office` | `<iframe>` (remote) | `microsoft-docs-viewer` (default) → `google-docs-viewer`. |
| other | fallback | Message + download link. |

### Engine & fallback

`engine: "auto"` (the default) is the only mode that falls back: matching
renderers are ordered by priority and the viewer moves to the next one whenever
one fails.

`auto` (the default) prefers the zero-dependency native engine and keeps the
richer engines as fallbacks:

| Kind | auto order |
|---|---|
| pdf | `iframe` → `google-docs-viewer` → download |
| image | `panzoom` → `native` → `google-docs-viewer` → download |
| office | `microsoft-docs-viewer` → `google-docs-viewer` → download |
| text | `shiki` → `google-docs-viewer` → download |
| video | `google-docs-viewer` → download |

Selecting a specific engine is **exclusive** — only that engine is used, and if
it cannot render the document the viewer reports an error (no fallback):

```html
<gnt-docs-viewer source="/report.pdf" engine="iframe"></gnt-docs-viewer>
```

`shiki` powers the `shiki` engine — syntax highlighting for every `text`-kind
document (plain text *and* source code). It is a regular dependency, loaded
lazily (code-split by your bundler) and, on failure, `auto` falls back to the
remote viewers. Control it with `code.theme` / `code.lang`; the theme follows
`prefers-color-scheme` (`github-light` / `github-dark`) by default.

`panzoom` powers the `panzoom` engine — an inline [Panzoom](https://github.com/timmywil/panzoom)
image viewer (wheel-zoom, drag-to-pan, no external UI) loaded lazily the same
way. Its toolbar is built from inline SVG (no background-image sprites) and sits
on a flat solid background: zoom in/out, 1:1, rotate, fit, download and
fullscreen. Rotation is applied to the image while Panzoom transforms a wrapper,
so panning stays aligned to the screen at any rotation. The only configurable
option is click-to-fullscreen (`image.fullscreen`, default `true`). If it cannot
load, `auto` falls back to the native `<img>`.

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
    return { destroy() { /* cleanup */ } };
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
