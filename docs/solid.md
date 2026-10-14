---
title: "Solid"
description: "Use the Solid wrapper, which accepts config as props."
---

# Solid

```
import { DocsViewer } from "@gntrees/docs-viewer/solid";

export function App() {
  return <DocsViewer source="/report.pdf" onReady={(ctx) => console.log(ctx)} />;
}
```

The Solid wrapper accepts config as props (plus `class`).
