import type Hls from "hls.js";
import type { RenderContext, Renderer } from "../core/types";
import { contentBar } from "../ui/content-bar";
import { attachMediaInfo } from "../ui/media-info";

const HLS_EXT = /^(m3u8|m3u)$/i;

let hlsPromise: Promise<typeof Hls> | null = null;

function loadHls(): Promise<typeof Hls> {
  if (!hlsPromise) {
    hlsPromise = import("hls.js").then(
      (mod) => mod.default,
      (error) => {
        hlsPromise = null;
        throw new Error(
          `hls.js could not be loaded. Install it with "bun add hls.js". (${String(error)})`,
        );
      },
    );
  }
  return hlsPromise;
}

/**
 * HLS streaming renderer (`engine: "hls"`) for `.m3u8` playlists.
 *
 * Uses [hls.js](https://github.com/video-dev/hls.js) (MIT, ~150 kB) — lazily
 * imported — for browsers without native HLS (Chrome, Firefox, Edge), and falls
 * back to a plain `<video src>` where HLS is native (Safari/iOS). Segments are
 * fetched on demand, so long video starts quickly and seeking only pulls the
 * segment it needs.
 *
 * It only matches `.m3u8`/`.m3u` videos, so a regular `<video>` file keeps using
 * the `native` engine.
 */
export const hlsRenderer: Renderer = {
  id: "hls",
  engine: "hls",
  priority: 13,
  match: (ctx) => ctx.kind === "video" && HLS_EXT.test(ctx.ext),
  mount(container, initialCtx) {
    let ctx = initialCtx;
    let disposed = false;
    const infoCtx = { current: ctx };

    const root = document.createElement("div");
    root.className = "gnt-dv-media-wrap";
    const bar = contentBar({ name: ctx.name, source: ctx.source ?? ctx.displayUrl });
    root.appendChild(bar.root);
    const body = document.createElement("div");
    body.className = "gnt-dv-media-body";
    root.appendChild(body);
    container.appendChild(root);

    const video = document.createElement("video");
    video.className = "gnt-dv-media";
    video.setAttribute("preload", "metadata");
    video.setAttribute("playsinline", "");
    body.appendChild(video);

    const applyOptions = (next: RenderContext): void => {
      const options = next.config.video;
      video.controls = options.controls !== false;
      video.autoplay = options.autoplay === true;
      video.loop = options.loop === true;
      video.muted = options.muted ?? options.autoplay === true;
      if (options.poster) video.poster = options.poster;
    };
    applyOptions(ctx);

    const detachInfo =
      ctx.config.video.info === false ? () => {} : attachMediaInfo(bar.infoSlot, video, infoCtx);

    let instance: Hls | null = null;
    const fail = (error: unknown): void => {
      if (!disposed) ctx.fail?.(error instanceof Error ? error : new Error(String(error)));
    };

    video.addEventListener("error", () => {
      if (!disposed) fail(new Error(`This browser cannot play "${ctx.name}".`));
    });

    const load = async (next: RenderContext): Promise<void> => {
      const url = next.displayUrl;
      try {
        const Hls = await loadHls();
        if (disposed) return;
        if (Hls.isSupported()) {
          instance?.destroy();
          const hls = new Hls();
          instance = hls;
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) fail(new Error(`HLS error: ${data.details}`));
          });
          hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(url));
          hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari and iOS play HLS natively.
          video.src = url;
        } else {
          fail(new Error("HLS is not supported in this browser."));
        }
      } catch (error) {
        fail(error);
      }
    };

    void load(ctx);

    return {
      update(next) {
        ctx = next;
        infoCtx.current = next;
        bar.setTitle(next.name, next.source ?? next.displayUrl);
        applyOptions(next);
        void load(next);
      },
      destroy() {
        disposed = true;
        detachInfo();
        instance?.destroy();
        instance = null;
        video.removeAttribute("src");
        root.remove();
      },
    };
  },
};
