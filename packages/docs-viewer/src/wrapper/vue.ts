import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { RenderContext, ViewerConfig } from "../types/types";
import { defineDocsViewer, DocsViewerElement, TAG } from "../core/element";

/**
 * Vue 3 wrapper around `<gnt-docs-viewer>`.
 *
 * Pass a single `config` object (all `ViewerConfig` fields). Emits `ready` and
 * `error`. Implemented with `h()` so no custom-element compiler config is needed.
 */
export const DocsViewer = defineComponent({
  name: "DocsViewer",
  props: {
    config: {
      type: Object as () => ViewerConfig,
      default: () => ({}),
    },
  },
  emits: {
    ready: (_context: RenderContext) => true,
    error: (_error: unknown) => true,
  },
  setup(props, { emit }) {
    const host = ref<HTMLDivElement | null>(null);
    let element: DocsViewerElement | null = null;

    const handleReady = (event: Event) =>
      emit("ready", (event as CustomEvent<RenderContext>).detail);
    const handleError = (event: Event) =>
      emit("error", (event as CustomEvent<{ error: unknown }>).detail.error);

    onMounted(() => {
      defineDocsViewer();
      element = document.createElement(TAG) as DocsViewerElement;
      element.style.display = "block";
      element.style.width = "100%";
      element.style.height = "100%";
      element.addEventListener("gnt-ready", handleReady);
      element.addEventListener("gnt-error", handleError);
      host.value?.appendChild(element);
      element.config = props.config ?? {};
    });

    watch(
      () => props.config,
      (value) => {
        if (element) element.config = value ?? {};
      },
      { deep: true },
    );

    onBeforeUnmount(() => {
      element?.removeEventListener("gnt-ready", handleReady);
      element?.removeEventListener("gnt-error", handleError);
      element?.remove();
      element = null;
    });

    return () => h("div", { ref: host, style: { width: "100%", height: "100%" } });
  },
});

export default DocsViewer;
