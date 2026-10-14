import type { RenderContext, ViewerConfig } from "../core/types";
import { defineDocsViewer, DocsViewerElement, TAG } from "../core/element";

export interface DocsViewerParams extends ViewerConfig {
  /** Called once the document's renderer has mounted. */
  onReady?: (context: RenderContext) => void;
  /** Called when the viewer cannot render the document. */
  onError?: (error: unknown) => void;
}

/** Return value of the `docsViewer` action — structurally a Svelte `Action`. */
export interface DocsViewerAction {
  update(params: DocsViewerParams): void;
  destroy(): void;
}

/**
 * Svelte action that mounts `<gnt-docs-viewer>` into the element it is applied
 * to. It ships as plain TypeScript, so no Svelte component compilation is needed:
 *
 *   <div use:docsViewer={{ source: "/report.pdf", onReady }}></div>
 *
 * Every `ViewerConfig` field is accepted; `onReady`/`onError` receive the same
 * payloads as the Web Component's `gnt-ready` / `gnt-error` events.
 */
export function docsViewer(
  node: HTMLElement,
  initial: DocsViewerParams = {},
): DocsViewerAction {
  defineDocsViewer();

  let params = initial;
  const element = document.createElement(TAG) as DocsViewerElement;
  element.style.display = "block";
  element.style.width = "100%";
  element.style.height = "100%";

  const handleReady = (event: Event) =>
    params.onReady?.((event as CustomEvent<RenderContext>).detail);
  const handleError = (event: Event) =>
    params.onError?.((event as CustomEvent<{ error: unknown }>).detail.error);

  element.addEventListener("gnt-ready", handleReady);
  element.addEventListener("gnt-error", handleError);
  node.appendChild(element);

  const apply = (): void => {
    const { onReady: _onReady, onError: _onError, ...config } = params;
    element.config = config;
  };
  apply();

  return {
    update(next: DocsViewerParams = {}) {
      params = next;
      apply();
    },
    destroy() {
      element.removeEventListener("gnt-ready", handleReady);
      element.removeEventListener("gnt-error", handleError);
      element.remove();
    },
  };
}

export default docsViewer;
