---
title: "Vue"
description: "Use the Vue wrapper with a single config object and ready/error events."
---

# Vue

```
<script setup>
import { DocsViewer } from "@gntrees/docs-viewer/vue";
const config = { source: "/report.pdf" };
</script>

<template>
  <DocsViewer :config="config" style="height: 80vh" @ready="onReady" />
</template>
```

The Vue wrapper takes a single `config` object and emits `ready` / `error`.
