<script setup lang="ts">
import type { ViewerConfig } from "@gntrees/docs-viewer";
import { DocsViewer } from "@gntrees/docs-viewer/vue";
import { onMounted, ref } from "vue";
import { mountPlayground } from "../shared/playground";
import { initialConfig } from "../shared/samples";

const config = ref<ViewerConfig>(initialConfig());

// The shared controls live in plain HTML; every change replaces `config`, and the
// wrapper's `watch` re-applies it to the element.
onMounted(() => {
  mountPlayground((next) => {
    config.value = next;
  });
});
</script>

<template>
  <DocsViewer :config="config" />
</template>
