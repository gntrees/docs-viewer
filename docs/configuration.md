---
title: "Configuration"
description: "Every configuration field, its default, the merge order and the ?config= JSON escape hatch."
---

# Configuration

Sources merge in this order (later wins): **defaults → HTML attributes → `config` property**. In URL mode: **defaults → `?config=` JSON → simple query params**.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| source | string | — | Document URL. Query aliases: file, url, src. |
| name | string | from URL | Display name; its extension is a last-resort detection hint (Content-Type wins). Usually derived from the URL; override it via the advanced `?config=` blob. |
| entry | string | — | Deep-link one member of an archive: the archive at `source` opens with its path (breadcrumb) restored to `entry`, and the member is previewed below it. `entry` is a `/`-separated path that may chain **through nested archives** (`inner.zip/doc.pdf`). Used by the archive's own open-in-new-page action. Advanced (`?config=`). |
| entryBase | string | current page | Absolute base URL the archive uses for its member deep-links (defaults to the current page). Advanced (`?config=`); normally unnecessary. |
| type | string | auto | Lock detection. Accepts a kind alias (pdf, image, video, audio, text, code, table, markup, html, markdown, font, archive, office, word, excel, powerpoint), a MIME (`application/pdf`) or family (`image/*`), or a bare extension (`docx`). `auto` detects from the Content-Type; the URL extension is only a last resort. Query alias: type. |
| engine | auto | iframe | native | panzoom | shiki | hls | markup | microsoft-docs-viewer | google-docs-viewer | auto | Engine preference; auto uses the recommended order with fallback. Query alias: engine. |
| loader | auto | direct | blob | auto | How bytes reach the renderer: `direct` streams the file over HTTP range requests (no CORS needed); `blob` fetches the whole file first (needs CORS). Query alias: loader. |
| credentials | omit | same-origin | include | same-origin | Request credentials mode, used when `loader: blob`. Query alias: credentials. |
| preflight | true | false | auto | true | Probe before rendering (CORS HEAD). `true` (default) always probes absolute `http(s)` URLs, so a missing file fails fast with a clear message even when `type` is locked. `false` never probes. `auto` probes only when the type needs detecting (`type` auto/unset). A 404/410 fails fast. Streaming media (video/audio/HLS) is never probed, and a probe that does not answer within a few seconds is abandoned (treated as unknown). Query alias: preflight. |
| theme | auto | light | dark | auto | Viewer colour theme. `auto` follows the OS/browser preference (`prefers-color-scheme`); `light`/`dark` force it (set as `data-theme` on the host). Also honours a `theme` HTML attribute. Query alias: theme. |
| code.theme | string | github-light/dark | Shiki theme for the shiki engine. |
| code.lang | string | from extension | Force a Shiki language id for the shiki engine. Query alias: lang. |
| image.fullscreen | boolean | true | Fullscreen on click and the toolbar's fullscreen button (panzoom engine). |
| video.controls | boolean | true | Show the browser's native video/audio controls (native engine). |
| video.autoplay | boolean | false | Autoplay on load; browsers require muted media for this. |
| video.muted | boolean | true when autoplay | Start muted. |
| video.loop | boolean | false | Loop playback. |
| video.poster | string | — | Poster image URL (video only). |
| video.info | boolean | true | Show a small format/duration/seek/buffer info line over the media (native & hls engines). |
| markup.sandbox | boolean | true | Render HTML/Markdown inside a sandboxed `<iframe>` (no scripts, no same-origin) so untrusted markup can never run code or reach the host page. Set `false` to render inline (best-effort sanitised — trusted sources only). |
| markup.baseUrl | string | source directory | Base URL used to resolve relative links and images inside the rendered document. |
| markup.gfm | boolean | true | Enable GitHub-Flavored Markdown (tables, strikethrough, task lists, …). |

**Advanced.** `loader` (`direct` | `blob`) controls how bytes reach the renderer: `direct` streams the file over HTTP range requests, while `blob` fetches the whole file first (needs CORS) — useful for short-lived or sensitive URLs. `credentials` only applies with `loader: blob`. You rarely need either: the media renderers offer a one-click **Load fully** when a host is not seekable.

Universal knobs live in the query string so links stay readable: `?file=/report.pdf&type=image&engine=panzoom&theme=dark&loader=blob&credentials=include&preflight=true`. Advanced keys (`name`/`entry`/`entryBase`) and the type-specific config (`code`/`image`/`video`/`markup`) are emitted as a base64url `?config=` blob, and only when they differ from the defaults. Simple query params always win over the blob, and the document URL stays in `?file=` rather than being duplicated inside it.

Complex config can be passed as base64url JSON via `?config=`, mixed freely with the scalar params:

```
?file=/report.pdf&type=code&config=eyJjb2RlIjp7ImxhbmciOiJydXN0In19
```
