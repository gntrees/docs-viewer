import { readFontMeta, type FontMeta } from "../core/truetype";
import type { Renderer } from "../types/types";
import { fontMeta } from "./font.meta";

/**
 * Font renderer (`engine: "font"`).
 *
 * Loads the font with the `FontFace` API and draws a specimen (sample sentence,
 * a size ladder and a glyph grid). It also reads the real Family/Subfamily and
 * `unitsPerEm` from the font tables when it can — best-effort, never blocking the
 * specimen. Failures call `ctx.fail()`, so `auto` falls back to the Google viewer.
 */

const SAMPLE = "The quick brown fox jumps over the lazy dog";
const SIZES = [12, 16, 20, 24, 32, 48];
const GLYPHS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 .,;:!?@#$%&*()[]{}+-=_/\\<>\"'`~^|";

function buildSpecimen(family: string): DocumentFragment {
  const fragment = document.createDocumentFragment();

  const hero = document.createElement("p");
  hero.className = "gnt-dv-font-hero";
  hero.style.fontFamily = `"${family}"`;
  hero.textContent = SAMPLE;
  fragment.appendChild(hero);

  const ladder = document.createElement("div");
  ladder.className = "gnt-dv-font-ladder";
  for (const size of SIZES) {
    const row = document.createElement("div");
    row.className = "gnt-dv-font-row";
    const label = document.createElement("span");
    label.className = "gnt-dv-font-label";
    label.textContent = `${size}px`;
    const sample = document.createElement("span");
    sample.style.fontFamily = `"${family}"`;
    sample.style.fontSize = `${size}px`;
    sample.textContent = "Ag 123 — The quick brown fox";
    row.append(label, sample);
    ladder.appendChild(row);
  }
  fragment.appendChild(ladder);

  const glyphs = document.createElement("p");
  glyphs.className = "gnt-dv-font-glyphs";
  glyphs.style.fontFamily = `"${family}"`;
  glyphs.textContent = GLYPHS;
  fragment.appendChild(glyphs);

  return fragment;
}

/** Best-effort metadata read; ignores any failure. */
async function loadMeta(url: string, signal: AbortSignal): Promise<FontMeta | null> {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) return null;
    return await readFontMeta(await response.arrayBuffer());
  } catch {
    return null;
  }
}

export const fontRenderer: Renderer = {
  ...fontMeta,
  mount(container, ctx) {
    const root = document.createElement("div");
    root.className = "gnt-dv-font";
    container.appendChild(root);

    const info = document.createElement("div");
    info.className = "gnt-dv-font-info";
    const infoLine = document.createElement("span");
    infoLine.textContent = `${ctx.mime || ctx.ext || "font"} · loading…`;
    info.appendChild(infoLine);
    root.appendChild(info);

    const body = document.createElement("div");
    body.className = "gnt-dv-font-body";
    body.textContent = "Loading…";
    root.appendChild(body);

    const family = `gnt-font-${Math.random().toString(36).slice(2, 10)}`;
    const controller = new AbortController();
    let disposed = false;
    let meta: FontMeta | null = null;

    const renderInfo = (): void => {
      const parts = [ctx.mime || ctx.ext || "font"];
      if (meta?.family) parts.push(meta.family);
      if (meta?.subfamily) parts.push(meta.subfamily);
      if (meta?.unitsPerEm) parts.push(`${meta.unitsPerEm} upem`);
      if (!meta) parts.push("metadata unavailable");
      infoLine.textContent = parts.join("  ·  ");
    };

    void (async () => {
      try {
        const face = new FontFace(family, `url("${ctx.displayUrl}")`);
        await face.load();
        if (disposed) return;
        document.fonts.add(face);

        body.replaceChildren(buildSpecimen(family));
        renderInfo();

        meta = await loadMeta(ctx.displayUrl, controller.signal);
        if (!disposed) renderInfo();
      } catch (error) {
        if (disposed) return;
        ctx.fail?.(error instanceof Error ? error : new Error(String(error)));
      }
    })();

    return {
      destroy() {
        disposed = true;
        controller.abort();
        root.remove();
      },
    };
  },
};
