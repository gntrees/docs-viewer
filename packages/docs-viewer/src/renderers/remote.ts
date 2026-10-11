import { DEFAULT_GOOGLE_ENDPOINT, DEFAULT_OFFICE_ENDPOINT } from "../core/config";
import type { FileKind, RenderContext, Renderer } from "../core/types";

/** How long to wait for a remote viewer before handing off to the next engine. */
export const REMOTE_FALLBACK_TIMEOUT_MS = 8000;

/** Microsoft Office Web Apps viewer URL for a document. */
export function microsoftViewerUrl(source: string): string {
  return DEFAULT_OFFICE_ENDPOINT + encodeURIComponent(source);
}

/** Google Docs viewer URL for a document. */
export function googleViewerUrl(source: string): string {
  return DEFAULT_GOOGLE_ENDPOINT + encodeURIComponent(source);
}

/** Formats Microsoft's viewer supports (per the Office Web Apps reference). */
const MICROSOFT_KINDS: readonly FileKind[] = ["office"];

/**
 * Formats Google's viewer supports (images, video, text, markup, Office, PDF,
 * fonts, archives, …). Used as a broad late fallback for content the browser
 * cannot render natively (e.g. PSD/DXF/AI/EPS/PS via the `image` chain).
 */
const GOOGLE_KINDS: readonly FileKind[] = [
  "office",
  "pdf",
  "image",
  "video",
  "text",
  "table",
  "font",
  "archive",
];

const ABSOLUTE_URL = /^https?:\/\//i;

/** Both remote viewers fetch the file server-side, so a relative/blob source cannot work. */
function isAbsoluteSource(url: string | undefined): boolean {
  return !!url && ABSOLUTE_URL.test(url);
}

/**
 * Build an iframe renderer for a remote viewer engine.
 *
 * Both viewers fetch the file **server-side** at a fixed endpoint, so `source`
 * must be a publicly reachable absolute URL (a `blob:` URL, `localhost` or
 * anything behind auth will not work). Because the provider is cross-origin,
 * failures cannot be detected reliably — the element's reachability preflight
 * runs first, and this timeout is the last resort.
 */
function createRemoteRenderer(options: {
  id: string;
  engine: string;
  priority: number;
  kinds: readonly FileKind[];
  buildUrl: (source: string) => string;
}): Renderer {
  return {
    id: options.id,
    engine: options.engine,
    priority: options.priority,
    requiresPublicUrl: true,
    match: (ctx: RenderContext) =>
      options.kinds.includes(ctx.kind) && isAbsoluteSource(ctx.source ?? ctx.displayUrl),
    mount(container, initialCtx) {
      let ctx = initialCtx;
      let disposed = false;
      let timer: number | undefined;

      const frame = document.createElement("iframe");
      frame.className = "gnt-dv-frame";
      frame.title = ctx.name;
      frame.setAttribute("allowfullscreen", "true");
      frame.referrerPolicy = "no-referrer";

      const clearTimer = (): void => {
        if (timer !== undefined) {
          clearTimeout(timer);
          timer = undefined;
        }
      };
      const handleLoad = (): void => clearTimer();
      frame.addEventListener("load", handleLoad);
      container.appendChild(frame);

      /** Point the iframe at the viewer and arm the fallback timeout. */
      function show(next: RenderContext): void {
        frame.title = next.name;
        frame.src = options.buildUrl(next.displayUrl);
        clearTimer();
        timer = window.setTimeout(() => {
          if (!disposed) {
            ctx.fail?.(new Error(`The ${options.engine} viewer did not load "${next.name}".`));
          }
        }, REMOTE_FALLBACK_TIMEOUT_MS);
      }

      show(ctx);

      return {
        update(next) {
          ctx = next;
          show(next);
        },
        destroy() {
          disposed = true;
          clearTimer();
          frame.removeEventListener("load", handleLoad);
          frame.remove();
        },
      };
    },
  };
}

/** Microsoft Office Web Apps viewer (`engine: "microsoft-docs-viewer"`). */
export const microsoftDocsViewerRenderer: Renderer = createRemoteRenderer({
  id: "microsoft-docs-viewer",
  engine: "microsoft-docs-viewer",
  priority: 2,
  kinds: MICROSOFT_KINDS,
  buildUrl: microsoftViewerUrl,
});

/** Google Docs viewer (`engine: "google-docs-viewer"`). */
export const googleDocsViewerRenderer: Renderer = createRemoteRenderer({
  id: "google-docs-viewer",
  engine: "google-docs-viewer",
  priority: 1,
  kinds: GOOGLE_KINDS,
  buildUrl: googleViewerUrl,
});
