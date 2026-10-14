---
title: "Plain JS"
description: "Use the Web Component from vanilla JavaScript with attributes or the config property."
---

# Plain JS

Set attributes for simple cases, or assign the `config` property:

```
import { mountViewer, mountFromQuery } from "@gntrees/docs-viewer";

mountViewer("#host", { source: "/report.pdf" });

// Or read everything from the URL (?file=/report.pdf&engine=iframe):
mountFromQuery("#host");
```

The element emits `gnt-ready`, `gnt-error` and `gnt-config-change` events.
