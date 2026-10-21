---
title: "Preact"
description: "Use the Preact wrapper with the same props API as the React wrapper."
---

# Preact

```
import { DocsViewer } from "@gntrees/docs-viewer/preact";

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

The Preact wrapper mirrors the React one: config as props, `class` for styling and `onReady` / `onError` callbacks.
