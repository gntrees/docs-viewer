import type { Renderer } from "../types/types";
import { panzoomMeta } from "./panzoom.meta";

/**
 * Image renderer backed by [Panzoom](https://github.com/timmywil/panzoom)
 * (`engine: "panzoom"`).
 *
 * Panzoom (MIT, ~3 kB) handles pan + zoom via CSS transforms and brings no UI of
 * its own, so this renderer ships its own small toolbar built from inline SVG —
 * no background-image sprites, so the whole viewer stays flat/solid. It is loaded
 * lazily and, if it cannot be loaded, reports failure so `auto` falls back to the
 * native `<img>`.
 *
 * Rotation is applied to the `<img>` (inner) while Panzoom transforms a wrapper
 * (outer). Because the individual `rotate` property composes *outside* `transform`,
 * this keeps panning aligned to the screen at any rotation.
 *
 * Flip horizontal/vertical is applied with `transform: scale(...)` on the same
 * `<img>`; since `rotate` composes outside `transform`, the mirror happens in the
 * image's own (rotated) frame, which is what a flip button should do.
 *
 * Fullscreen is configurable via `image.fullscreen` (default `true`): it enables
 * both click-to-fullscreen on the stage and the toolbar's fullscreen button.
 */

/** The subset of the Panzoom API this renderer uses. */
interface PanzoomInstance {
  zoomIn(options?: { animate?: boolean }): void;
  zoomOut(options?: { animate?: boolean }): void;
  zoom(scale: number, options?: { animate?: boolean }): void;
  reset(options?: { animate?: boolean }): void;
  zoomWithWheel(event: WheelEvent): void;
  destroy(): void;
}

interface PanzoomModule {
  default: (element: HTMLElement, options?: Record<string, unknown>) => PanzoomInstance;
}

let panzoomPromise: Promise<PanzoomModule> | null = null;

function loadPanzoom(): Promise<PanzoomModule> {
  if (!panzoomPromise) {
    panzoomPromise = import("@panzoom/panzoom").then(
      (mod) => mod as unknown as PanzoomModule,
      (error) => {
        panzoomPromise = null;
        throw new Error(
          `@panzoom/panzoom could not be loaded. Install it with "bun add @panzoom/panzoom". (${String(error)})`,
        );
      },
    );
  }
  return panzoomPromise;
}

/** Inline SVG icons (stroke uses `currentColor`) — never background images. */
const ICONS = {
  zoomOut:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M8 11h6"/></svg>',
  zoomIn:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M11 8v6M8 11h6"/></svg>',
  rotateLeft:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
  rotateRight:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',
  reset:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',
  flipH:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><path d="M12 2v2"/><path d="M12 8v2"/><path d="M12 14v2"/><path d="M12 20v2"/></svg>',
  flipV:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/><path d="M4 12H2"/><path d="M10 12H8"/><path d="M16 12h-2"/><path d="M22 12h-2"/></svg>',
  fullscreen:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/></svg>',
  fullscreenExit:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>',
} as const;

function makeButton(label: string, content: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "gnt-dv-panzoom-btn";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.innerHTML = content;
  return button;
}

export const panzoomRenderer: Renderer = {
  ...panzoomMeta,
  mount(container, ctx) {
    const root = document.createElement("div");
    root.className = "gnt-dv-panzoom";
    container.appendChild(root);

    // Panzoom transforms the stage (outer); rotation is applied to the image
    // (inner) so panning stays screen-aligned.
    const stage = document.createElement("div");
    stage.className = "gnt-dv-panzoom-stage";
    root.appendChild(stage);

    const img = document.createElement("img");
    img.className = "gnt-dv-panzoom-img";
    img.alt = ctx.name;
    img.decoding = "async";
    img.src = ctx.displayUrl;
    stage.appendChild(img);

    // Mirror the intrinsic size onto the element so the box is stable once decoded
    // (and after a source change) rather than reflowing on every load.
    img.addEventListener("load", () => {
      if (img.naturalWidth > 0) {
        img.width = img.naturalWidth;
        img.height = img.naturalHeight;
      }
    });

    const bar = document.createElement("div");
    bar.className = "gnt-dv-panzoom-bar";
    bar.setAttribute("role", "toolbar");
    const zoomOutBtn = makeButton("Zoom out", ICONS.zoomOut);
    const zoomInBtn = makeButton("Zoom in", ICONS.zoomIn);
    const oneToOneBtn = makeButton("Actual size (1:1)", '<span aria-hidden="true">1:1</span>');
    const rotateLeftBtn = makeButton("Rotate left", ICONS.rotateLeft);
    const rotateRightBtn = makeButton("Rotate right", ICONS.rotateRight);
    const flipHBtn = makeButton("Flip horizontal", ICONS.flipH);
    const flipVBtn = makeButton("Flip vertical", ICONS.flipV);
    const resetBtn = makeButton("Fit to view", ICONS.reset);
    const fullscreenBtn = makeButton("Fullscreen", ICONS.fullscreen);
    bar.append(
      zoomOutBtn,
      zoomInBtn,
      oneToOneBtn,
      rotateLeftBtn,
      rotateRightBtn,
      flipHBtn,
      flipVBtn,
      resetBtn,
      fullscreenBtn,
    );
    root.appendChild(bar);

    let disposed = false;
    let currentUrl = ctx.displayUrl;
    let instance: PanzoomInstance | null = null;
    let removeWheel: (() => void) | null = null;
    let fullscreenEnabled = ctx.config.image.fullscreen !== false;
    fullscreenBtn.hidden = !fullscreenEnabled;
    let rotation = 0;
    let flipH = false;
    let flipV = false;
    let downX = 0;
    let downY = 0;

    const fail = (error: unknown): void => {
      if (!disposed) ctx.fail?.(error instanceof Error ? error : new Error(String(error)));
    };

    // Formats such as TIFF/HEIC are not decodable everywhere — report failure so
    // `auto` can fall back to the next renderer.
    img.addEventListener("error", () => {
      if (!disposed) fail(new Error(`The browser could not display "${ctx.name}".`));
    });

    const applyTransform = (): void => {
      img.style.rotate = rotation ? `${rotation}deg` : "";
      img.style.transform =
        flipH || flipV ? `scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})` : "";
    };

    const isFullscreen = (): boolean => Boolean(root.ownerDocument.fullscreenElement);
    const toggleFullscreen = (): void => {
      const doc = root.ownerDocument;
      if (doc.fullscreenElement) {
        void doc.exitFullscreen?.();
      } else if (typeof root.requestFullscreen === "function") {
        void root.requestFullscreen();
      }
    };

    const syncFullscreenButton = (): void => {
      const active = isFullscreen();
      fullscreenBtn.innerHTML = active ? ICONS.fullscreenExit : ICONS.fullscreen;
      const label = active ? "Exit fullscreen" : "Fullscreen";
      fullscreenBtn.title = label;
      fullscreenBtn.setAttribute("aria-label", label);
    };

    // Click-to-fullscreen, ignoring the click that ends a pan gesture.
    const onPointerDown = (event: PointerEvent): void => {
      downX = event.clientX;
      downY = event.clientY;
    };
    const onClickStage = (event: MouseEvent): void => {
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 5) return;
      toggleFullscreen();
    };
    const wireImageClick = (): void => {
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("click", onClickStage);
      if (fullscreenEnabled) {
        stage.addEventListener("pointerdown", onPointerDown);
        stage.addEventListener("click", onClickStage);
      }
    };
    wireImageClick();

    const onFullscreenChange = (): void => syncFullscreenButton();
    root.ownerDocument.addEventListener("fullscreenchange", onFullscreenChange);
    root.ownerDocument.addEventListener("webkitfullscreenchange", onFullscreenChange);

    zoomInBtn.addEventListener("click", () => instance?.zoomIn());
    zoomOutBtn.addEventListener("click", () => instance?.zoomOut());
    oneToOneBtn.addEventListener("click", () => {
      if (!instance || !img.naturalWidth || !img.clientWidth) return;
      instance.zoom(img.naturalWidth / img.clientWidth, { animate: true });
    });
    rotateLeftBtn.addEventListener("click", () => {
      rotation = (rotation - 90) % 360;
      applyTransform();
    });
    rotateRightBtn.addEventListener("click", () => {
      rotation = (rotation + 90) % 360;
      applyTransform();
    });
    flipHBtn.addEventListener("click", () => {
      flipH = !flipH;
      applyTransform();
    });
    flipVBtn.addEventListener("click", () => {
      flipV = !flipV;
      applyTransform();
    });
    resetBtn.addEventListener("click", () => {
      rotation = 0;
      flipH = false;
      flipV = false;
      applyTransform();
      instance?.reset();
    });
    fullscreenBtn.addEventListener("click", toggleFullscreen);

    void (async () => {
      try {
        const { default: Panzoom } = await loadPanzoom();
        if (disposed) return;
        instance = Panzoom(stage, {
          maxScale: 8,
          minScale: 0.2,
          step: 0.4,
          duration: 150,
        });
        if (disposed) {
          instance.destroy();
          instance = null;
          return;
        }
        // Panzoom does not bind the wheel itself; route it through `zoomWithWheel`.
        const onWheel = (event: WheelEvent): void => instance?.zoomWithWheel(event);
        root.addEventListener("wheel", onWheel, { passive: false });
        removeWheel = () => root.removeEventListener("wheel", onWheel);
      } catch (error) {
        fail(error);
      }
    })();

    return {
      update(next) {
        // Reset zoom/rotation only when the image actually changes; a cosmetic
        // config change (e.g. `image.fullscreen`) keeps the current view.
        const sourceChanged = next.displayUrl !== currentUrl;
        currentUrl = next.displayUrl;
        img.alt = next.name;
        if (sourceChanged) {
          img.src = next.displayUrl;
          rotation = 0;
          flipH = false;
          flipV = false;
          applyTransform();
          instance?.reset();
        }
        fullscreenEnabled = next.config.image.fullscreen !== false;
        fullscreenBtn.hidden = !fullscreenEnabled;
        wireImageClick();
      },
      destroy() {
        disposed = true;
        stage.removeEventListener("pointerdown", onPointerDown);
        stage.removeEventListener("click", onClickStage);
        root.ownerDocument.removeEventListener("fullscreenchange", onFullscreenChange);
        root.ownerDocument.removeEventListener("webkitfullscreenchange", onFullscreenChange);
        removeWheel?.();
        removeWheel = null;
        instance?.destroy();
        instance = null;
        root.remove();
      },
    };
  },
};
