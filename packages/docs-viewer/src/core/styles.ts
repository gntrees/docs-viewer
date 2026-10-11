export const STYLE_ID = "gnt-docs-viewer-styles";

/**
 * Base styles for the viewer, injected once per document. All visual values are
 * CSS custom properties so hosts can theme the viewer without overriding rules.
 */
export const BASE_CSS = `
.gnt-dv-host {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  min-height: var(--gnt-min-height, 360px);
  overflow: hidden;
  background: var(--gnt-bg, #f5f5f5);
  color: var(--gnt-fg, #18181b);
  font-family: var(--gnt-font, system-ui, -apple-system, "Segoe UI", sans-serif);
  font-size: var(--gnt-font-size, 14px);
  --gnt-scrollbar-thumb: rgba(24, 24, 27, 0.32);
  --gnt-scrollbar-thumb-hover: rgba(24, 24, 27, 0.55);
}
.gnt-dv-host[data-theme="dark"] {
  --gnt-bg: #18181b;
  --gnt-fg: #fafafa;
  --gnt-border: #3f3f46;
  --gnt-muted: #a1a1aa;
  --gnt-th-bg: #27272a;
  --gnt-row-alt: rgba(255, 255, 255, 0.04);
  --gnt-row-hover: rgba(255, 255, 255, 0.06);
  --gnt-accent: #a1a1aa;
  --gnt-link: #60a5fa;
  --gnt-scrollbar-thumb: rgba(255, 255, 255, 0.42);
  --gnt-scrollbar-thumb-hover: rgba(255, 255, 255, 0.7);
}
@media (prefers-color-scheme: dark) {
  .gnt-dv-host:not([data-theme="light"]):not([data-theme="dark"]) {
    --gnt-bg: #18181b;
    --gnt-fg: #fafafa;
    --gnt-border: #3f3f46;
    --gnt-muted: #a1a1aa;
    --gnt-th-bg: #27272a;
    --gnt-row-alt: rgba(255, 255, 255, 0.04);
    --gnt-row-hover: rgba(255, 255, 255, 0.06);
    --gnt-accent: #a1a1aa;
    --gnt-link: #60a5fa;
    --gnt-scrollbar-thumb: rgba(255, 255, 255, 0.42);
    --gnt-scrollbar-thumb-hover: rgba(255, 255, 255, 0.7);
  }
}
/* Scrollbars: theme-aware, readable (especially in dark mode) and always
   visible when the content overflows — never the macOS overlay kind that fades
   out. Styling ::-webkit-scrollbar opts Chromium/Safari out of overlay
   scrollbars, so the standard properties are applied to Firefox only (detected
   via -moz-appearance) to keep Chromium on the ::-webkit rules. */
@supports (-moz-appearance: none) {
  .gnt-dv-viewport,
  .gnt-dv-code-body,
  .gnt-dv-table-body,
  .gnt-dv-font-body,
  .gnt-dv-archive-wrap {
    scrollbar-width: thin;
    scrollbar-color: var(--gnt-scrollbar-thumb) transparent;
  }
}
.gnt-dv-host ::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}
.gnt-dv-host ::-webkit-scrollbar-thumb {
  background-color: var(--gnt-scrollbar-thumb);
  border: 3px solid transparent;
  background-clip: padding-box;
  border-radius: 999px;
}
.gnt-dv-host ::-webkit-scrollbar-thumb:hover {
  background-color: var(--gnt-scrollbar-thumb-hover);
}
.gnt-dv-host ::-webkit-scrollbar-track,
.gnt-dv-host ::-webkit-scrollbar-corner {
  background: transparent;
}
.gnt-dv-viewport {
  position: absolute;
  inset: 0;
  overflow: auto;
}
.gnt-dv-frame,
.gnt-dv-media {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
.gnt-dv-media { object-fit: contain; }
video.gnt-dv-media { background: #000; }
audio.gnt-dv-media {
  position: absolute;
  inset: 0;
  margin: auto;
  height: 54px;
  width: min(560px, 88%);
}
.gnt-dv-media-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--gnt-bg, #f5f5f5);
}
.gnt-dv-media-body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
/* In-flow detail line inside the content bar (format/duration/seek/buffer). */
.gnt-dv-media-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-family: var(--gnt-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 11px;
  line-height: 1.4;
  color: var(--gnt-muted, #52525b);
}
.gnt-dv-media-info-line {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.gnt-dv-media-info-action {
  appearance: none;
  flex: none;
  padding: 2px 8px;
  border: 1px solid var(--gnt-border, #e4e4e7);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}
.gnt-dv-media-info-action:hover { background: var(--gnt-row-hover, rgba(0, 0, 0, 0.06)); }
.gnt-dv-media-info-action:disabled {
  opacity: 0.6;
  cursor: default;
}
.gnt-dv-text {
  margin: 0;
  padding: 16px;
  min-height: 100%;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--gnt-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 13px;
  line-height: 1.5;
}

/* Content bar shared by the text/code, table and media renderers. */
.gnt-dv-bar {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--gnt-border, #e4e4e7);
  background: var(--gnt-bg, #f5f5f5);
}
.gnt-dv-bar-main {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.gnt-dv-bar-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--gnt-fg, #18181b);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}
a.gnt-dv-bar-name:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}
.gnt-dv-bar-grow { flex: 1 1 auto; }
.gnt-dv-bar-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--gnt-muted, #52525b);
  cursor: pointer;
}
.gnt-dv-bar-btn:hover:not(:disabled) {
  background: var(--gnt-row-hover, rgba(0, 0, 0, 0.06));
  color: var(--gnt-fg, #18181b);
}
.gnt-dv-bar-btn:disabled { opacity: 0.4; cursor: default; }
.gnt-dv-bar-btn[data-copied="true"] { color: var(--gnt-success, #16a34a); }
.gnt-dv-bar-btn svg { width: 16px; height: 16px; display: block; }
.gnt-dv-bar-info:empty { display: none; }

/* Shiki code renderer (engine: "shiki") — a content bar above a scroller. */
.gnt-dv-code {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.gnt-dv-code-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}
/* Wrapper around the highlighted output. Host page CSS adds overflow to the
   pre, so instead of scrolling inside the pre this wrapper is sized to its
   content and the surrounding body scrolls both axes (vertical + horizontal). */
.gnt-dv-code-scroll {
  display: flex;
  flex-direction: column;
  width: max-content;
  min-width: 100%;
  min-height: 100%;
}
.gnt-dv-code pre,
.gnt-dv-code-block pre {
  flex: 1 0 auto;
  margin: 0;
  padding: 16px;
  min-height: 100%;
  font-family: var(--gnt-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 13px;
  line-height: 1.5;
  tab-size: 2;
  /* Reset host-page pre styling (light DOM leaks in): no border, no radius,
     and no scroll of its own — the wrapper scrolls instead. */
  border: 0;
  border-radius: 0;
  overflow: visible;
}
.gnt-dv-code code,
.gnt-dv-code-block code {
  background: none;
  padding: 0;
  border-radius: 0;
}

/* Table renderer (engine: "table") — native grid with a sticky header. */
.gnt-dv-table {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--gnt-bg, #f5f5f5);
}
.gnt-dv-table-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.gnt-dv-table-grid {
  border-collapse: collapse;
  width: max-content;
  min-width: 100%;
  font-size: 13px;
}
.gnt-dv-table-grid th,
.gnt-dv-table-grid td {
  padding: 6px 10px;
  border: 1px solid var(--gnt-border, #e4e4e7);
  white-space: nowrap;
  text-align: left;
}
.gnt-dv-table-grid thead th {
  position: sticky;
  top: -1px; /* tuck under the collapsed top border so the header sits flush */
  z-index: 1;
  background: var(--gnt-th-bg, #f4f4f5);
  font-weight: 600;
}
.gnt-dv-table-grid tbody tr:nth-child(even) {
  background: var(--gnt-row-alt, rgba(0, 0, 0, 0.03));
}
.gnt-dv-table-grid td.gnt-dv-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.gnt-dv-table-note {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--gnt-bar-bg, rgba(24, 24, 27, 0.86));
  color: var(--gnt-bar-fg, #fafafa);
  font-size: 12px;
}
.gnt-dv-table-action {
  appearance: none;
  padding: 3px 10px;
  border: 0;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.18);
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.gnt-dv-table-action:hover {
  background: rgba(255, 255, 255, 0.32);
}

/* Panzoom image renderer (engine: "panzoom") — no vendor CSS, a flat solid
   background and a small toolbar built from inline SVG (no background images). */
.gnt-dv-panzoom {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--gnt-bg, #f5f5f5);
}
.gnt-dv-panzoom-stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}
.gnt-dv-panzoom-stage:active {
  cursor: grabbing;
}
.gnt-dv-panzoom-img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  cursor: grab;
  user-select: none;
  -webkit-user-drag: none;
}
.gnt-dv-panzoom-img:active {
  cursor: grabbing;
}
.gnt-dv-panzoom-bar {
  position: absolute;
  left: 50%;
  bottom: 12px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  background: var(--gnt-bar-bg, rgba(24, 24, 27, 0.86));
  color: var(--gnt-bar-fg, #fafafa);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  transform: translateX(-50%);
  cursor: default;
}
.gnt-dv-panzoom-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}
.gnt-dv-panzoom-btn:hover {
  background: var(--gnt-bar-hover, rgba(255, 255, 255, 0.16));
}
.gnt-dv-panzoom-btn[hidden] {
  display: none;
}
.gnt-dv-panzoom-btn:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 1px;
}
.gnt-dv-panzoom-btn svg {
  width: 18px;
  height: 18px;
  display: block;
}

/* Font renderer (engine: "font") */
.gnt-dv-font {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--gnt-bg, #f5f5f5);
}
/* The metadata line sits above the specimen (in-flow) so it never covers it. */
.gnt-dv-font-info {
  flex: none;
  padding: 8px 12px;
  border-bottom: 1px solid var(--gnt-border, #e4e4e7);
  color: var(--gnt-muted, #52525b);
  font-family: var(--gnt-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 11px;
}
.gnt-dv-font-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
}
.gnt-dv-font-hero {
  margin: 0 0 16px;
  font-size: 40px;
  line-height: 1.2;
  word-break: break-word;
}
.gnt-dv-font-ladder {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 12px 0;
}
.gnt-dv-font-row { display: flex; align-items: baseline; gap: 10px; }
.gnt-dv-font-label {
  flex: none;
  width: 46px;
  color: var(--gnt-muted, #52525b);
  font-family: var(--gnt-mono, ui-monospace, monospace);
  font-size: 11px;
}
.gnt-dv-font-glyphs {
  margin: 16px 0 0;
  font-size: 20px;
  line-height: 1.8;
  word-break: break-word;
}

/* Archive renderer (engine: "archive") — Drive-like browser. */
.gnt-dv-archive {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--gnt-bg, #f5f5f5);
}
.gnt-dv-archive-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--gnt-border, #e4e4e7);
}
.gnt-dv-archive-back {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 28px;
  height: 28px;
  margin-right: 2px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--gnt-muted, #52525b);
  cursor: pointer;
}
.gnt-dv-archive-back:hover {
  background: var(--gnt-row-hover, rgba(0, 0, 0, 0.06));
  color: var(--gnt-fg, #18181b);
}
.gnt-dv-archive-back:disabled {
  opacity: 0.35;
  cursor: default;
  background: none;
  color: var(--gnt-muted, #52525b);
}
.gnt-dv-archive-back svg { width: 18px; height: 18px; display: block; }
.gnt-dv-archive-crumbs {
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
}
.gnt-dv-archive-crumb {
  appearance: none;
  border: 0;
  background: none;
  color: var(--gnt-muted, #52525b);
  font: inherit;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 8px;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}
button.gnt-dv-archive-crumb { cursor: pointer; }
button.gnt-dv-archive-crumb:hover {
  background: var(--gnt-row-hover, rgba(0, 0, 0, 0.06));
  color: var(--gnt-fg, #18181b);
}
.gnt-dv-archive-crumb[data-active="true"] { color: var(--gnt-fg, #18181b); font-weight: 600; }
.gnt-dv-archive-sep {
  color: var(--gnt-muted, #71717a);
  opacity: 0.5;
  padding: 0 2px;
  user-select: none;
}
.gnt-dv-archive-copy {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--gnt-muted, #52525b);
  cursor: pointer;
}
.gnt-dv-archive-copy:hover {
  background: var(--gnt-row-hover, rgba(0, 0, 0, 0.06));
  color: var(--gnt-fg, #18181b);
}
.gnt-dv-archive-copy[data-copied="true"] { color: var(--gnt-success, #16a34a); }
.gnt-dv-archive-copy svg { width: 15px; height: 15px; display: block; }
.gnt-dv-archive-sub {
  flex: none;
  color: var(--gnt-muted, #71717a);
  font-size: 12px;
  white-space: nowrap;
}
.gnt-dv-archive-search {
  flex: 0 1 200px;
  min-width: 90px;
  margin-left: auto;
  padding: 5px 10px;
  border: 1px solid var(--gnt-border, #e4e4e7);
  border-radius: 8px;
  background: var(--gnt-input-bg, transparent);
  color: inherit;
  font: inherit;
  font-size: 13px;
}
.gnt-dv-archive-search:focus-visible {
  outline: 2px solid var(--gnt-accent, #a1a1aa);
  outline-offset: 1px;
}
.gnt-dv-archive-wrap { flex: 1; overflow: auto; }
.gnt-dv-archive-name { display: inline-flex; align-items: center; gap: 10px; min-width: 0; }
.gnt-dv-archive-icon {
  flex: none;
  display: inline-flex;
  color: var(--gnt-muted, #71717a);
}
.gnt-dv-archive-icon svg { width: 18px; height: 18px; display: block; }
.gnt-dv-archive-dir .gnt-dv-archive-icon { color: var(--gnt-accent, #52525b); }
.gnt-dv-archive-hint { margin: 16px; color: var(--gnt-muted, #52525b); }
.gnt-dv-archive-error { margin: 16px; color: var(--gnt-danger, #dc2626); }
/* The clickable name: never blue, underlined only on hover/focus. */
.gnt-dv-archive-link,
.gnt-dv-archive-link:link,
.gnt-dv-archive-link:visited {
  appearance: none;
  border: 0;
  padding: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}
.gnt-dv-archive-link:hover,
.gnt-dv-archive-link:focus-visible {
  text-decoration: underline;
  text-underline-offset: 2px;
}
.gnt-dv-archive-link:focus-visible { outline: none; }
.gnt-dv-archive-dir td { color: var(--gnt-fg, inherit); }
.gnt-dv-archive-file .gnt-dv-archive-link { font-weight: 600; }
.gnt-dv-archive-empty {
  text-align: center !important;
  color: var(--gnt-muted, #71717a);
  padding: 28px 12px !important;
}
.gnt-dv-archive-actions {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.gnt-dv-archive-action {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--gnt-muted, #52525b);
  cursor: pointer;
}
.gnt-dv-archive-action:hover {
  background: var(--gnt-row-hover, rgba(0, 0, 0, 0.06));
  color: var(--gnt-fg, #18181b);
}
.gnt-dv-archive-action svg { width: 17px; height: 17px; display: block; }
.gnt-dv-archive-preview {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
.gnt-dv-archive-gate {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  padding: 24px;
  color: var(--gnt-muted, #52525b);
  text-align: center;
}
.gnt-dv-archive-gate-text { margin: 0; font-size: 13px; }
.gnt-dv-archive-gate-button {
  appearance: none;
  padding: 6px 14px;
  border: 1px solid var(--gnt-border, #e4e4e7);
  border-radius: 8px;
  background: var(--gnt-input-bg, transparent);
  color: inherit;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.gnt-dv-archive-gate-button:hover { background: var(--gnt-row-hover, rgba(0, 0, 0, 0.06)); }

/* Archive table: modern, Drive-like — hairline separators, no grid, row hover.
   Scoped to the archive's own table class so these rules never leak into a nested
   viewer's table, which also lives under the archive element. */
.gnt-dv-archive-grid { width: 100%; }
.gnt-dv-archive-grid th,
.gnt-dv-archive-grid td {
  border: 0;
  border-bottom: 1px solid var(--gnt-border, #e4e4e7);
  padding: 10px 12px;
}
.gnt-dv-archive-grid thead th {
  color: var(--gnt-muted, #52525b);
  font-size: 12px;
  font-weight: 500;
  padding-top: 8px;
  padding-bottom: 8px;
}
.gnt-dv-archive-sort {
  appearance: none;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.gnt-dv-archive-sort:hover { color: var(--gnt-fg, #18181b); }
.gnt-dv-archive-sort-arrow {
  display: inline-flex;
  opacity: 0.4; /* semi-transparent sort toggle */
  transition: opacity 120ms ease;
}
.gnt-dv-archive-sort-arrow svg { width: 12px; height: 12px; display: block; }
.gnt-dv-archive-grid thead th:hover .gnt-dv-archive-sort-arrow { opacity: 0.8; }
.gnt-dv-archive-sort[data-active="true"] .gnt-dv-archive-sort-arrow { opacity: 1; }
.gnt-dv-archive-grid tbody tr { cursor: default; }
.gnt-dv-archive-grid tbody tr:hover { background: var(--gnt-row-hover, rgba(0, 0, 0, 0.04)); }

.gnt-dv-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  color: var(--gnt-muted, #52525b);
  text-align: center;
}
.gnt-dv-status {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  background: var(--gnt-bg, #f5f5f5);
  color: var(--gnt-fg, #18181b);
}
.gnt-dv-status[hidden] { display: none; }
.gnt-dv-status[data-state="error"] { color: var(--gnt-danger, #dc2626); }



`;

/** Inject the base stylesheet into `doc` if it is not already present. */
export function ensureStyles(doc: Document = document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = BASE_CSS;
  doc.head.appendChild(style);
}
