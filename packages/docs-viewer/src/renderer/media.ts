import type { RenderContext, Renderer } from "../core/types";
import { contentBar } from "../ui/content-bar";
import { attachMediaInfo } from "../ui/media-info";

/**
 * Native media renderer (`engine: "native"`) for video and audio.
 *
 * A plain `<video controls>` / `<audio controls>` hands playback to the browser —
 * no server-side viewer, no CSS, no dependencies — which is far more reliable
 * than the Google Docs viewer for video. Format/codec support is whatever the
 * browser has; an unplayable file fires `error`, so `auto` can fall back to
 * `google-docs-viewer`.
 *
 * Playback options come from `video.*` (`controls`, `autoplay`, `muted`, `loop`,
 * `poster`, `info`). `muted` defaults to `true` when `autoplay` is set, since
 * browsers block unmuted autoplay.
 *
 * When a source is not seekable (the host ignores HTTP range requests), the info
 * line offers a one-click **Load fully** that fetches the whole file and plays it
 * from a `blob:` URL, which is seekable. This needs CORS on the file host.
 */
export const mediaRenderer: Renderer = {
  id: "media",
  engine: "native",
  priority: 12,
  match: (ctx) => ctx.kind === "video" || ctx.kind === "audio",
  mount(container, initialCtx) {
    let ctx = initialCtx;
    let disposed = false;
    let blobUrl: string | null = null;
    const infoCtx = { current: ctx };

    const isVideo = ctx.kind === "video";

    const root = document.createElement("div");
    root.className = "gnt-dv-media-wrap";
    const bar = contentBar({ name: ctx.name, source: ctx.source ?? ctx.displayUrl });
    root.appendChild(bar.root);
    const body = document.createElement("div");
    body.className = "gnt-dv-media-body";
    root.appendChild(body);
    container.appendChild(root);

    const el: HTMLMediaElement = document.createElement(isVideo ? "video" : "audio");
    el.className = "gnt-dv-media";
    el.setAttribute("preload", "metadata");
    if (isVideo) el.setAttribute("playsinline", "");
    el.addEventListener("error", () => {
      if (!disposed) ctx.fail?.(new Error(`This browser cannot play "${ctx.name}".`));
    });
    body.appendChild(el);

    /** Fetch the whole file and swap the element onto a seekable `blob:` URL. */
    const loadFully = async (): Promise<void> => {
      const response = await fetch(ctx.source ?? ctx.displayUrl, {
        credentials: ctx.config.credentials,
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim());
      const blob = await response.blob();
      if (disposed) return;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      blobUrl = URL.createObjectURL(blob);
      el.src = blobUrl;
    };

    const detachInfo =
      ctx.config.video.info === false
        ? () => {}
        : attachMediaInfo(bar.infoSlot, el, infoCtx, { loadFully });

    const load = (next: RenderContext): void => {
      const options = next.config.video;
      el.controls = options.controls !== false;
      el.autoplay = options.autoplay === true;
      el.loop = options.loop === true;
      el.muted = options.muted ?? options.autoplay === true;
      if (next.kind === "video" && options.poster) {
        (el as HTMLVideoElement).poster = options.poster;
      }
      el.src = next.displayUrl;
    };

    load(ctx);

    return {
      update(next) {
        ctx = next;
        infoCtx.current = next;
        bar.setTitle(next.name, next.source ?? next.displayUrl);
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
          blobUrl = null;
        }
        load(next);
      },
      destroy() {
        disposed = true;
        detachInfo();
        el.pause?.();
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
          blobUrl = null;
        }
        el.removeAttribute("src");
        root.remove();
      },
    };
  },
};
