---
title: "Office & remote viewers"
description: "Preview docx/xlsx/pptx through third-party viewers, and their detection limits."
---

# Office & remote viewers

docx/xlsx/pptx (and more) are rendered by a third-party viewer in an iframe, so the file must be reachable at a **public absolute URL**. `localhost`, `blob:` URLs and anything behind auth will not work (expose them via a tunnel or proxy). Non-`http(s)` sources are skipped for the remote engines entirely, so they fall straight through to the download fallback.

The two remote viewers are ordinary **engines** — select one explicitly, or let `auto` fall back from Microsoft to Google:

- `microsoft-docs-viewer` (default): view.officeapps.live.com — explicit "no training" terms, occasional 404s.
- `google-docs-viewer`: widest coverage — images (incl. PSD, DXF, AI, EPS/PS, XPS), video, text, Office, PDF, fonts (TTF), archives (zip/rar) — 25 MB limit, unclear terms; avoid for personal data.
- Fallback between them is timeout-based, since cross-provider failures cannot be detected directly.
- Endpoints are fixed (view.officeapps.live.com / docs.google.com); register a custom renderer to proxy or self-host.

**Detection limits:** a remote viewer is a cross-origin iframe, so the client cannot read its status or body — an error page still fires `load`. The available signals are a **preflight** probe (`preflight`, default `true`: it probes absolute URLs and an explicit `false`/`auto` always wins) and the fallback **timeout**. Detection prefers the probe's `Content-Type`; the URL extension is only a last resort. A proxy is needed for full reliability.

```
<gnt-docs-viewer source="/report.docx" engine="google-docs-viewer"></gnt-docs-viewer>
```
