<script lang="ts">
  import type { ViewerConfig } from "@gntrees/docs-viewer";
  import { docsViewer } from "@gntrees/docs-viewer/svelte";
  import { onDestroy, onMount } from "svelte";
  import { mountPlayground } from "../shared/playground";
  import { initialConfig } from "../shared/samples";

  let config = $state<ViewerConfig>(initialConfig());
  let cleanup: (() => void) | undefined;

  // The shared controls live in plain HTML; every change reassigns `config`, which
  // makes the compiler call the action's `update()` with the new params.
  onMount(() => {
    cleanup = mountPlayground((next) => {
      config = next;
    });
  });

  onDestroy(() => cleanup?.());
</script>

<div class="viewer" use:docsViewer={config}></div>
