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
}
.gnt-dv-host[data-theme="dark"] {
  --gnt-bg: #18181b;
  --gnt-fg: #fafafa;
  --gnt-border: #3f3f46;
  --gnt-muted: #a1a1aa;
}
@media (prefers-color-scheme: dark) {
  .gnt-dv-host:not([data-theme="light"]):not([data-theme="dark"]) {
    --gnt-bg: #18181b;
    --gnt-fg: #fafafa;
    --gnt-border: #3f3f46;
    --gnt-muted: #a1a1aa;
  }
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

/* Shiki code renderer (engine: "shiki") */
.gnt-dv-code {
  position: absolute;
  inset: 0;
  overflow: auto;
}
.gnt-dv-code pre {
  margin: 0;
  padding: 16px;
  min-height: 100%;
  font-family: var(--gnt-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 13px;
  line-height: 1.5;
  tab-size: 2;
}
.gnt-dv-code code {
  background: none;
  padding: 0;
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
.gnt-dv-panzoom-btn:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 1px;
}
.gnt-dv-panzoom-btn svg {
  width: 18px;
  height: 18px;
  display: block;
}
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
