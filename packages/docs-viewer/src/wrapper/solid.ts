import { createEffect, onCleanup, onMount } from "solid-js";
import type { RenderContext, ViewerConfig } from "../core/types";
import { defineDocsViewer, DocsViewerElement, TAG } from "../core/element";

export interface DocsViewerProps extends ViewerConfig {
  class?: string;
  onReady?: (context: RenderContext) => void;
  onError?: (error: unknown) => void;
}

/**
 * Solid wrapper around `<gnt-docs-viewer>`.
 *
 * Returns a plain DOM node (no JSX) so the package compiles without a Solid JSX
 * transform. Pass `class` for styling; all other props are forwarded as config.
 */
export function DocsViewer(props: DocsViewerProps): HTMLElement {
  const host = document.createElement("div");
  host.style.width = "100%";
  host.style.height = "100%";
  if (typeof props.class === "string") host.className = props.class;

  let element: DocsViewerElement | null = null;

  onMount(() => {
    defineDocsViewer();
    element = document.createElement(TAG) as DocsViewerElement;
    element.style.display = "block";
    element.style.width = "100%";
    element.style.height = "100%";
    element.addEventListener("gnt-ready", (event) =>
      props.onReady?.((event as CustomEvent<RenderContext>).detail),
    );
    element.addEventListener("gnt-error", (event) =>
      props.onError?.((event as CustomEvent<{ error: unknown }>).detail.error),
    );
    host.appendChild(element);
  });

  createEffect(() => {
    if (!element) return;
    const { onReady: _onReady, onError: _onError, class: _class, ...config } = props;
    element.config = config;
  });

  onCleanup(() => {
    element?.remove();
    element = null;
  });

  return host;
}

export default DocsViewer;
