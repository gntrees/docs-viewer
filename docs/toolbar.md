---
title: "Toolbar"
description: "There is no built-in toolbar — drive the viewer from your own UI via its methods."
---

# Toolbar

There is no built-in toolbar — the viewer is chrome-less and the renderers add no controls. Build your own UI and call the element's methods:

| Method | Action |
| --- | --- |
| download() | Download the current document. |
| print() | Print (uses the rendered iframe when available). |
| toggleFullscreen() | Toggle fullscreen on the element. |
| reload() | Re-render with the current config. |

Combine with the `gnt-ready` / `gnt-error` / `gnt-config-change` events.
