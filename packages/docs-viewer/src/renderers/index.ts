import { RendererRegistry } from "../core/registry";
import { imageRenderer } from "./image";
import { panzoomRenderer } from "./panzoom";
import { pdfRenderer } from "./pdf";
import { googleDocsViewerRenderer, microsoftDocsViewerRenderer } from "./remote";
import { shikiRenderer } from "./shiki";
import { unsupportedRenderer } from "./unsupported";

export { imageRenderer } from "./image";
export { panzoomRenderer } from "./panzoom";
export { pdfRenderer } from "./pdf";
export {
  googleDocsViewerRenderer,
  googleViewerUrl,
  microsoftDocsViewerRenderer,
  microsoftViewerUrl,
  REMOTE_FALLBACK_TIMEOUT_MS,
} from "./remote";
export { shikiLangForExt, shikiRenderer, shikiTheme } from "./shiki";
export { unsupportedRenderer } from "./unsupported";

/**
 * Registry pre-populated with the built-in renderers.
 *
 * Candidates are ordered by priority: native engines come first (`iframe` for
 * PDFs, `panzoom` for images, `shiki` for text/code), then the remote viewers
 * (`microsoft-docs-viewer` → `google-docs-viewer`), then the fallback.
 *
 * `engine: "auto"` uses this full order and falls back on failure; selecting a
 * specific engine makes it exclusive (no fallback).
 */
export function createDefaultRegistry(): RendererRegistry {
  return new RendererRegistry()
    .register(pdfRenderer)
    .register(panzoomRenderer)
    .register(imageRenderer)
    .register(shikiRenderer)
    .register(microsoftDocsViewerRenderer)
    .register(googleDocsViewerRenderer)
    .register(unsupportedRenderer);
}
