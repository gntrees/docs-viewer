/**
 * @gntrees/docs-viewer — framework-agnostic document viewer.
 *
 * Importing this module registers the `<gnt-docs-viewer>` custom element as a
 * side effect, so plain HTML/JS users only need:
 *
 *   import "@gntrees/docs-viewer";
 *   // <gnt-docs-viewer source="/files/report.pdf"></gnt-docs-viewer>
 */
export type {
  BuiltinEngine,
  CodeViewerConfig,
  DetectedFile,
  Engine,
  FileKind,
  ImageViewerConfig,
  LoaderMode,
  MarkupViewerConfig,
  RenderContext,
  Renderer,
  RendererInstance,
  ResolvedConfig,
  Theme,
  ViewerConfig,
  VideoViewerConfig,
} from "../core/types";

export {
  DEFAULT_CONFIG,
  DEFAULT_GOOGLE_ENDPOINT,
  DEFAULT_OFFICE_ENDPOINT,
  parseQuery,
  resolveConfig,
  toPreflight,
  toTheme,
} from "../core/config";

export {
  detect,
  extFromName,
  fileNameFromUrl,
  kindFromExt,
  kindFromMime,
  normalizeContentType,
  normalizeExt,
} from "../core/detect";

export { loadDocument } from "../core/loader";
export type { LoadedDocument } from "../core/loader";

export { preflight, probe } from "../core/preflight";
export type { PreflightResult, ProbeResult } from "../core/preflight";

export { RendererRegistry } from "../core/registry";
export { BASE_CSS, ensureStyles, STYLE_ID } from "../core/styles";

export {
  createDefaultRegistry,
  googleDocsViewerRenderer,
  googleViewerUrl,
  hlsRenderer,
  imageRenderer,
  MARKUP_MAX_CHARS,
  markupRenderer,
  mediaRenderer,
  microsoftDocsViewerRenderer,
  microsoftViewerUrl,
  panzoomRenderer,
  pdfRenderer,
  REMOTE_FALLBACK_TIMEOUT_MS,
  shikiLangForExt,
  shikiRenderer,
  shikiTheme,
  unsupportedRenderer,
} from "../renderer";

export {
  defineDocsViewer,
  DocsViewerElement,
  mountFromQuery,
  mountViewer,
  TAG,
} from "../core/element";

import { ensureStyles } from "../core/styles";
import { defineDocsViewer } from "../core/element";

// Inject the viewer styles at import time (before any element mounts) so hosts
// that place `<gnt-docs-viewer>` directly in markup never see an unstyled flash.
if (typeof document !== "undefined") ensureStyles(document);

defineDocsViewer();
