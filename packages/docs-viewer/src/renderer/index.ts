import { RendererRegistry } from "../core/registry";
import { archiveRenderer } from "./archive";
import { fontRenderer } from "./font";
import { hlsRenderer } from "./hls";
import { imageRenderer } from "./image";
import { markupRenderer } from "./markup";
import { mediaRenderer } from "./media";
import { panzoomRenderer } from "./panzoom";
import { pdfRenderer } from "./pdf";
import { googleDocsViewerRenderer, microsoftDocsViewerRenderer } from "./remote";
import { shikiRenderer } from "./shiki";
import { tableRenderer } from "./table";
import { unsupportedRenderer } from "./unsupported";

export { archiveRenderer } from "./archive";
export { fontRenderer } from "./font";
export { hlsRenderer } from "./hls";
export { imageRenderer } from "./image";
export { MARKUP_MAX_CHARS, markupRenderer } from "./markup";
export { mediaRenderer } from "./media";
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
export { parseDelimited, parseTable, sniffDelimiter, TABLE_MAX_ROWS, tableRenderer } from "./table";
export { unsupportedRenderer } from "./unsupported";

/**
 * Registry pre-populated with the built-in renderers.
 *
 * Candidates are ordered by priority: native engines come first (`iframe` for
 * PDFs, `panzoom` for images, `shiki` for text/code, `native` for video/audio,
 * `hls` for `.m3u8`), then the remote viewers (`microsoft-docs-viewer` →
 * `google-docs-viewer`), then the fallback.
 *
 * `engine: "auto"` uses this full order and falls back on failure; selecting a
 * specific engine makes it exclusive (no fallback).
 */
export function createDefaultRegistry(): RendererRegistry {
  return new RendererRegistry()
    .register(pdfRenderer)
    .register(panzoomRenderer)
    .register(hlsRenderer)
    .register(mediaRenderer)
    .register(imageRenderer)
    .register(shikiRenderer)
    .register(tableRenderer)
    .register(markupRenderer)
    .register(fontRenderer)
    .register(archiveRenderer)
    .register(microsoftDocsViewerRenderer)
    .register(googleDocsViewerRenderer)
    .register(unsupportedRenderer);
}
