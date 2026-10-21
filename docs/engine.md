---
title: "Engine & fallback"
description: "How auto picks a renderer with fallback, and how forcing a specific engine disables it."
---

# Engine & fallback

`engine: "auto"` is the only mode that falls back: matching renderers are ordered by priority and the viewer moves to the next one whenever one fails.

**auto (recommended)** prefers the zero-dependency native engine and keeps the richer engines as fallbacks:

- pdf → `iframe` → `google-docs-viewer` → download
- image → `panzoom` → `native` → `google-docs-viewer` → download
- office → `microsoft-docs-viewer` → `google-docs-viewer` → download
- text → `shiki` → `google-docs-viewer` → download
- table → `table` → `shiki` → `google-docs-viewer` → download
- markup → `markup` → `shiki` → `google-docs-viewer` → download
- font → `font` → `google-docs-viewer` → download
- archive → `archive` → `google-docs-viewer` → download
- video → `native` → `google-docs-viewer` → download
- audio → `native` → download
- `.m3u8` → `hls` → `native` → `google-docs-viewer` → download

**Images** use Panzoom (engine `panzoom`) inline: a flat solid background, wheel-zoom/pinch, drag-to-pan, rotate, flip and a small toolbar built from inline SVG (zoom in/out, 1:1, rotate both ways, flip both ways, fit, fullscreen) — no background-image sprites. Click-to-fullscreen and the toolbar's fullscreen button are on by default (`image.fullscreen`). If Panzoom cannot load, `auto` falls back to the native `<img>`.

**Video & audio** play through the browser directly — `<video controls>` / `<audio controls>` (engine `native`), configured with `video.*`. If the browser cannot decode the codec, `auto` falls back to the Google viewer for video.

**Large media** streams progressively via HTTP range requests (`Accept-Ranges: bytes`) — it is not downloaded in full first. A host that ignores ranges (answers a `Range` request with `200`) forces a full download *and* breaks seeking, so pick one that returns `206`. For adaptive streaming, point the viewer at an HLS playlist (`engine: hls`, `.m3u8`) — segments load on demand. The `native` and `hls` renderers also show a small info line (format, duration, resolution, seekability, buffered %) that you can turn off with `video.info: false`; when a file is not seekable, the info line offers a one-click **Load fully**.

**Need more than that?** For tiled deep-zoom imagery (IIIF/DZI) register a dedicated renderer — e.g. OpenSeadragon — or use PhotoSwipe for an overlay lightbox UX.

Selecting a specific engine is **exclusive** — only that engine is used; if it cannot render the document the viewer emits an error (no fallback):

```
<gnt-docs-viewer source="/report.pdf" engine="iframe"></gnt-docs-viewer>
```
