import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { RenderContext, ViewerConfig } from "../core/types";
import { defineDocsViewer, DocsViewerElement, TAG } from "../core/element";

export interface DocsViewerProps extends ViewerConfig {
  className?: string;
  style?: CSSProperties;
  onReady?: (context: RenderContext) => void;
  onError?: (error: unknown) => void;
}

/**
 * React wrapper around `<gnt-docs-viewer>`.
 *
 * The custom element is created imperatively so it works regardless of how the
 * host app is rendered (SSR, StrictMode double-invoke, etc.).
 */
export function DocsViewer(props: DocsViewerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const elementRef = useRef<DocsViewerElement | null>(null);
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    defineDocsViewer();
    const element = document.createElement(TAG) as DocsViewerElement;
    element.style.display = "block";
    element.style.width = "100%";
    element.style.height = "100%";

    const handleReady = (event: Event) =>
      latest.current.onReady?.((event as CustomEvent<RenderContext>).detail);
    const handleError = (event: Event) =>
      latest.current.onError?.((event as CustomEvent<{ error: unknown }>).detail.error);

    element.addEventListener("gnt-ready", handleReady);
    element.addEventListener("gnt-error", handleError);
    host.appendChild(element);
    elementRef.current = element;

    return () => {
      element.removeEventListener("gnt-ready", handleReady);
      element.removeEventListener("gnt-error", handleError);
      element.remove();
      elementRef.current = null;
    };
  }, []);

  const { onReady: _onReady, onError: _onError, className, style, ...config } = props;
  const serialized = JSON.stringify(config);

  useEffect(() => {
    if (elementRef.current) elementRef.current.config = JSON.parse(serialized) as ViewerConfig;
  }, [serialized]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ width: "100%", height: "100%", ...style }}
    />
  );
}

export default DocsViewer;
