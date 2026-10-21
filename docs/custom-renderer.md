---
title: "Custom renderer"
description: "Register your own renderer for a file kind or format."
---

# Custom renderer

```
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

Renderers are matched by priority; thrown errors inside `match` are ignored.
