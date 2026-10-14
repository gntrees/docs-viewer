---
title: "Getting started"
description: "Install the package and mount your first viewer in plain HTML."
---

# Getting started

gntrees docs-viewer ships one vanilla TypeScript core as a Web Component (`<gnt-docs-viewer>`), framework wrappers, and a `standalone` entry that renders from URL query parameters. The core has no UI dependencies and no Tailwind requirement.

```
bun add @gntrees/docs-viewer
```

Plain HTML/JS — importing the package registers the custom element:

```
import "@gntrees/docs-viewer";

// <gnt-docs-viewer source="/report.pdf"></gnt-docs-viewer>
```
