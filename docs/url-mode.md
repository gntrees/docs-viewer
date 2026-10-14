---
title: "URL mode"
description: "Render a document straight from URL query parameters, with no application code."
---

# URL mode

Mount straight from query parameters — no application code required:

```
<div data-gnt-viewer style="height: 100vh"></div>
<script type="module">
  import "@gntrees/docs-viewer/standalone";
</script>

<!-- then open: /page.html?file=/report.pdf&engine=google-docs-viewer -->
```

The standalone entry mounts into `[data-gnt-viewer]`, then `#app`, then the page body.
