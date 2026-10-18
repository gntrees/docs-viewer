import { lazyRenderer, RendererRegistry } from "../core/registry";
import type { Renderer } from "../types/types";
import { archiveMeta } from "./archive.meta";
import { fontMeta } from "./font.meta";
import { hlsMeta } from "./hls.meta";
import { imageRenderer } from "./image";
import { MARKUP_MAX_CHARS, markupRenderer } from "./markup";
import { mediaMeta } from "./media.meta";
import { panzoomMeta } from "./panzoom.meta";
import { pdfRenderer } from "./pdf";
import {
  googleDocsViewerRenderer,
  googleViewerUrl,
  microsoftDocsViewerRenderer,
  microsoftViewerUrl,
  REMOTE_FALLBACK_TIMEOUT_MS,
} from "./remote";
import { highlightCode, shikiLangForExt, shikiRenderer, shikiTheme } from "./shiki";
import { parseDelimited, parseTable, sniffDelimiter, TABLE_MAX_ROWS, tableRenderer } from "./table";
import { unsupportedRenderer } from "./unsupported";

export {
  googleDocsViewerRenderer,
  googleViewerUrl,
  highlightCode,
  imageRenderer,
  MARKUP_MAX_CHARS,
  markupRenderer,
  microsoftDocsViewerRenderer,
  microsoftViewerUrl,
  parseDelimited,
  parseTable,
  pdfRenderer,
  REMOTE_FALLBACK_TIMEOUT_MS,
  shikiLangForExt,
  shikiRenderer,
  shikiTheme,
  sniffDelimiter,
  TABLE_MAX_ROWS,
  tableRenderer,
  unsupportedRenderer,
};

/**
 * The five engines heavy enough to be worth deferring: each one is a whole DOM
 * surface (archive browser, media chrome, panzoom toolbar, font specimen, hls.js
 * wrapper) that a given document never needs.
 *
 * They are declared as *values of this module* rather than re-exported from their
 * own files: `entry/index.ts` re-exports these names, so a plain re-export would
 * keep the module in the entry chunk and leave nothing to defer. The metadata comes
 * from each renderer's `*.meta.ts`, so it cannot drift from the implementation.
 */
export const archiveRenderer: Renderer = lazyRenderer({
  ...archiveMeta,
  load: async () => (await import("./archive")).archiveRenderer,
});

export const fontRenderer: Renderer = lazyRenderer({
  ...fontMeta,
  load: async () => (await import("./font")).fontRenderer,
});

export const hlsRenderer: Renderer = lazyRenderer({
  ...hlsMeta,
  load: async () => (await import("./hls")).hlsRenderer,
});

export const mediaRenderer: Renderer = lazyRenderer({
  ...mediaMeta,
  load: async () => (await import("./media")).mediaRenderer,
});

export const panzoomRenderer: Renderer = lazyRenderer({
  ...panzoomMeta,
  load: async () => (await import("./panzoom")).panzoomRenderer,
});

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
