---
title: "Svelte"
description: "Mount the viewer from Svelte with an action — no component compilation needed."
---

# Svelte

```
<script>
  import { docsViewer } from "@gntrees/docs-viewer/svelte";
  const config = { source: "/report.pdf" };
</script>

<div style="height: 80vh" use:docsViewer={{ ...config, onReady: (ctx) => console.log(ctx) }}></div>
```

The Svelte entry exports a `docsViewer` action (`use:docsViewer`) that takes every `ViewerConfig` field plus `onReady` / `onError`.
