import { parseQuery } from "./core/config";
import type { ViewerConfig } from "./core/types";
import { defineDocsViewer, DocsViewerElement, TAG } from "./element";

export interface StandaloneOptions {
  /** Element or selector to mount into. Falls back to `[data-gnt-viewer]`, `#app`, then the body. */
  target?: HTMLElement | string;
  /** Override the query string. Defaults to `window.location.search`. */
  search?: string;
  /** Auto-mount on import. Defaults to `true`. */
  auto?: boolean;
}

function resolveTarget(target?: HTMLElement | string): HTMLElement {
  if (target instanceof HTMLElement) return target;

  if (typeof target === "string") {
    const found = document.querySelector<HTMLElement>(target);
    if (found) return found;
  }

  const marked = document.querySelector<HTMLElement>("[data-gnt-viewer]");
  if (marked) return marked;

  const app = document.querySelector<HTMLElement>("#app");
  if (app) return app;

  const full = document.createElement("div");
  full.style.cssText = "position:fixed;inset:0";
  document.body.appendChild(full);
  return full;
}

/**
 * Mount a viewer driven entirely by URL query parameters, e.g.
 *
 *   /index.html?file=/docs/report.pdf&engine=google-docs-viewer
 */
export function runStandalone(options: StandaloneOptions = {}): DocsViewerElement {
  defineDocsViewer();

  const config: ViewerConfig = parseQuery(options.search ?? window.location.search);
  const container = resolveTarget(options.target);
  if (!container.style.height) container.style.height = "100%";

  const viewer = document.createElement(TAG) as DocsViewerElement;
  viewer.style.cssText = "display:block;width:100%;height:100%";
  container.appendChild(viewer);
  viewer.config = config;
  return viewer;
}

/** Mount once the DOM is ready (or immediately if it already is). */
export function autoRunStandalone(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const start = () => runStandalone();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}

autoRunStandalone();
