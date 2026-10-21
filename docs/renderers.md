---
title: "Renderers"
description: "How each file kind is rendered, code language coverage and the loading/CORS modes."
---

# Renderers

| Kind | Renderer | Notes |
| --- | --- | --- |
| pdf | <iframe> | Native browser PDF viewer (engine: iframe). |
| image | Panzoom | Inline zoom/pan/rotate/flip viewer with an inline-SVG toolbar (engine: panzoom) → native <img>. Click opens fullscreen (image.fullscreen). Formats a browser cannot decode (PSD, DXF, AI, EPS/PS, XPS) end at the Google viewer. |
| video | Native <video> | HTML5 player (engine: native) → google-docs-viewer. Plays directly; no third-party viewer needed. |
| audio | Native <audio> | HTML5 audio (engine: native). |
| video (.m3u8) | hls.js | HLS streaming, segment by segment (engine: hls) → native → google-docs-viewer. |
| text | Shiki | shiki (highlight) → google-docs-viewer. Fetches the bytes (needs CORS). |
| table | DIY <table> | CSV/TSV/TAB via a built-in RFC 4180 parser (engine: table) → shiki → download. Sticky header, numeric columns right-aligned; caps at 1000 rows with a "Load all" button. Fetches the bytes (needs CORS). Excel stays `office`. |
| markup | DIY (rendered) + Shiki (source) | HTML (.html/.htm) and Markdown (.md/.markdown/.mdx), engine: markup. Shows the rendered document by default (Markdown via a lazily-loaded `marked`; HTML as-is, with its own styles left untouched so it renders exactly as authored) and the content bar's toggle switches to the Shiki-highlighted source. Untrusted markup is isolated in a sandboxed `<iframe>` (markup.sandbox) so it can never run scripts or leak styles into the host page. Fetches the bytes (needs CORS). Falls back to shiki → google-docs-viewer → download. |
| font | DIY specimen | (engine: font) → google-docs-viewer → download. Renders a specimen (sample, size ladder, glyphs) via `FontFace`, and reads the real Family/Subfamily + unitsPerEm from the font tables (TTF/OTF/WOFF free; WOFF2 via a lazily-loaded Brotli decoder). |
| archive | DIY browser | (engine: archive) → google-docs-viewer → download. A Google-Drive-style browser for ZIP (built-in parser), RAR (lazily-loaded decoder) and TAR / .tar.gz (built-in parser): the archive opens as a single file that extracts on click, then a single breadcrumb header, a filter and a sortable table. Folders and nested archives extend the same breadcrumb; opening a file renders a nested viewer **below the path**, so nothing leaves the page. A member can still be deep-linked (`?file=<archive>&entry=<path>`, which the open-in-new-page action points at the host's `/view/` route) and downloaded. Office members (docx/xlsx/pptx) cannot be previewed inline — their remote viewers need a public URL — so they offer a download instead. TAR members are stored, so only gzip is decompressed. |
| office | <iframe> (remote) | docx/xlsx/pptx/odt via Office or Google viewer. |
| other | fallback | Message + download link. |

**Code languages:** the `shiki` engine highlights any of Shiki's 200+ languages — full list at https://shiki.style/languages. Detection is by file extension (py, go, rs, rb, java, php, swift, …), and you can force one with `code.lang`. The playground's Language dropdown is a curated subset with public samples.

**Loading & CORS:** `direct` (default) hands the original URL to the renderer — no CORS needed and the only mode compatible with the fixed-endpoint remote viewers. `blob` fetches the bytes (requires CORS) and is useful when the source URL is short-lived.
