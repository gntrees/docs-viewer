import type { RenderContext } from "../types/types";

/** Mutable holder so the info line can refresh with the latest context. */
export interface MediaInfoContext {
  current: RenderContext;
}

/** Optional user actions surfaced by the info line. */
export interface MediaInfoActions {
  /**
   * Fetch and play the whole file so a non-seekable source (a host that ignores
   * HTTP range requests) becomes seekable. Rejects on failure.
   */
  loadFully?: () => Promise<void>;
}

/** Format seconds as `m:ss` / `h:mm:ss` (or `—` when unknown). */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const total = Math.floor(seconds);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

const LOAD_LABEL = "Load fully (enable seeking)";

/**
 * A small info overlay for the media renderers: format, duration, resolution,
 * seekability, buffered progress and playback state.
 *
 * Everything is read from the media element itself, so it works cross-origin
 * without CORS-exposed headers. A host that ignores HTTP `Range` requests shows
 * up as `seekable: no`; when that happens and the media has a finite duration,
 * a one-click **Load fully** action is offered (see {@link MediaInfoActions}).
 */
export function attachMediaInfo(
  host: HTMLElement,
  el: HTMLMediaElement,
  ctx: MediaInfoContext,
  actions: MediaInfoActions = {},
): () => void {
  const panel = document.createElement("div");
  panel.className = "gnt-dv-media-info";
  panel.setAttribute("role", "status");

  const line = document.createElement("span");
  line.className = "gnt-dv-media-info-line";
  panel.appendChild(line);

  const action = document.createElement("button");
  action.type = "button";
  action.className = "gnt-dv-media-info-action";
  action.textContent = LOAD_LABEL;
  action.hidden = true;
  panel.appendChild(action);

  host.appendChild(panel);

  let busy = false;
  let errorMessage = "";

  const durationLabel = (): string => {
    if (Number.isFinite(el.duration)) return formatTime(el.duration);
    return el.duration === Number.POSITIVE_INFINITY ? "live / streaming" : "length unknown";
  };

  const seekLabel = (): string => {
    const seekable = el.seekable;
    // An unbounded (live) stream has no absolute position, only a buffer window.
    if (el.duration === Number.POSITIVE_INFINITY) {
      return seekable.length > 0 ? "live (seek: buffer only)" : "live (no seek)";
    }
    if (seekable.length === 0) return "seekable: no";
    try {
      const end = seekable.end(seekable.length - 1);
      if (Number.isFinite(el.duration) && end < el.duration - 0.5) return "seekable: partial";
    } catch {
      // Fall through to "yes" when the range cannot be read.
    }
    return "seekable: yes";
  };

  const bufferedPercent = (): number => {
    try {
      const duration = el.duration;
      if (!Number.isFinite(duration) || duration <= 0 || el.buffered.length === 0) return 0;
      const end = el.buffered.end(el.buffered.length - 1);
      return Math.min(100, Math.round((end / duration) * 100));
    } catch {
      return 0;
    }
  };

  const stateLabel = (): string => {
    if (el.error) return "error";
    if (el.readyState < 2) return "loading";
    if (!el.paused) return "playing";
    return el.currentTime > 0 ? "paused" : "ready";
  };

  const canLoadFully = (): boolean =>
    Boolean(actions.loadFully) &&
    !busy &&
    !el.error &&
    el.readyState >= 1 &&
    el.seekable.length === 0 &&
    Number.isFinite(el.duration);

  const render = (): void => {
    const context = ctx.current;
    const parts: string[] = [context.mime || context.ext || context.kind];
    parts.push(durationLabel());
    const videoWidth = (el as HTMLVideoElement).videoWidth;
    if (context.kind === "video" && videoWidth) {
      parts.push(`${videoWidth}×${(el as HTMLVideoElement).videoHeight}`);
    }
    parts.push(seekLabel());
    parts.push(`buffered ${bufferedPercent()}%`);
    parts.push(stateLabel());
    if (errorMessage) parts.push(errorMessage);
    line.textContent = parts.join("  ·  ");

    const show = canLoadFully();
    action.hidden = !show;
    if (show) action.textContent = LOAD_LABEL;
  };

  const handleClick = async (): Promise<void> => {
    if (!actions.loadFully || busy) return;
    busy = true;
    errorMessage = "";
    action.disabled = true;
    action.textContent = "Downloading…";
    try {
      await actions.loadFully();
    } catch (error) {
      errorMessage = `blob load failed: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      busy = false;
      action.disabled = false;
      render();
    }
  };

  const onClick = (): void => void handleClick();

  const events = [
    "loadedmetadata",
    "durationchange",
    "progress",
    "timeupdate",
    "play",
    "pause",
    "playing",
    "waiting",
    "seeked",
    "error",
  ] as const;
  for (const event of events) el.addEventListener(event, render);
  action.addEventListener("click", onClick);
  render();

  return () => {
    for (const event of events) el.removeEventListener(event, render);
    action.removeEventListener("click", onClick);
    panel.remove();
  };
}
