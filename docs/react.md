---
title: "React"
description: "Drop the React wrapper into a component tree with props and event callbacks."
---

# React

```
import { DocsViewer } from "@gntrees/docs-viewer/react";

export function App() {
  return (
    <DocsViewer
      source="/report.pdf"
      style={{ height: "80vh" }}
      onReady={(ctx) => console.log("ready", ctx)}
      onError={(err) => console.error(err)}
    />
  );
}
```
