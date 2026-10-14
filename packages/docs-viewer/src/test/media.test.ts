import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveConfig } from "../core/config";
import type { RenderContext } from "../core/types";
import { mediaRenderer } from "../renderer/media";

function context(overrides: Partial<RenderContext> = {}): RenderContext {
  return {
    displayUrl: "https://x.test/clip.mp4",
    name: "clip.mp4",
    mime: "video/mp4",
    ext: "mp4",
    kind: "video",
    config: resolveConfig(),
    ...overrides,
  };
}

function host(): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
}

async function waitFor(predicate: () => boolean, timeout = 2000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeout) throw new Error("waitFor timed out");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("mediaRenderer", () => {
  it("matches video and audio on the native engine", () => {
    expect(mediaRenderer.engine).toBe("native");
    expect(mediaRenderer.match(context())).toBe(true);
    expect(mediaRenderer.match(context({ kind: "audio" }))).toBe(true);
    expect(mediaRenderer.match(context({ kind: "pdf" }))).toBe(false);
  });

  it("mounts a native <video> with controls by default", () => {
    const container = host();
    const instance = mediaRenderer.mount(container, context());

    const el = container.querySelector("video.gnt-dv-media");
    expect(el).not.toBeNull();
    expect(el?.getAttribute("src")).toBe("https://x.test/clip.mp4");
    expect((el as HTMLMediaElement).controls).toBe(true);
    expect(el?.hasAttribute("playsinline")).toBe(true);
    expect(el?.getAttribute("preload")).toBe("metadata");

    instance.destroy();
  });

  it("mounts a native <audio> for the audio kind", () => {
    const container = host();
    const instance = mediaRenderer.mount(
      container,
      context({
        kind: "audio",
        name: "song.mp3",
        mime: "audio/mpeg",
        ext: "mp3",
        displayUrl: "https://x.test/song.mp3",
      }),
    );

    const el = container.querySelector("audio.gnt-dv-media");
    expect(el).not.toBeNull();
    expect(container.querySelector("video")).toBeNull();
    expect((el as HTMLMediaElement).controls).toBe(true);

    instance.destroy();
  });

  it("applies video options (autoplay implies muted, loop, poster)", () => {
    const container = host();
    const instance = mediaRenderer.mount(
      container,
      context({
        config: resolveConfig({
          video: { controls: false, autoplay: true, loop: true, poster: "https://x.test/p.jpg" },
        }),
      }),
    );

    const el = container.querySelector("video") as HTMLVideoElement;
    expect(el.controls).toBe(false);
    expect(el.autoplay).toBe(true);
    expect(el.muted).toBe(true); // implied by autoplay
    expect(el.loop).toBe(true);
    expect(el.poster).toBe("https://x.test/p.jpg");

    instance.destroy();
  });

  it("respects an explicit muted:false alongside autoplay", () => {
    const container = host();
    const instance = mediaRenderer.mount(
      container,
      context({ config: resolveConfig({ video: { autoplay: true, muted: false } }) }),
    );

    expect((container.querySelector("video") as HTMLVideoElement).muted).toBe(false);

    instance.destroy();
  });

  it("reports failure when the media cannot be played", () => {
    const container = host();
    const fail = vi.fn();
    const instance = mediaRenderer.mount(container, context({ fail }));

    container.querySelector("video")!.dispatchEvent(new Event("error"));
    expect(fail).toHaveBeenCalledTimes(1);

    instance.destroy();
  });

  it("swaps the source on update and removes the element on destroy", () => {
    const container = host();
    const instance = mediaRenderer.mount(container, context());
    const el = container.querySelector("video")!;

    instance.update?.(context({ displayUrl: "https://x.test/other.mp4" }));
    expect(el.getAttribute("src")).toBe("https://x.test/other.mp4");

    instance.destroy();
    expect(container.querySelector("video")).toBeNull();
  });

  it("loads the whole file on demand to make seeking possible", async () => {
    const container = host();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(new Blob(["data"]), { status: 200 }));
    if (typeof URL.createObjectURL !== "function") {
      Object.defineProperty(URL, "createObjectURL", { value: () => "blob:fake", configurable: true });
    }
    if (typeof URL.revokeObjectURL !== "function") {
      Object.defineProperty(URL, "revokeObjectURL", { value: () => {}, configurable: true });
    }
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");

    const instance = mediaRenderer.mount(container, context());
    const el = container.querySelector("video")!;
    Object.defineProperty(el, "readyState", { value: 1, configurable: true });
    Object.defineProperty(el, "duration", { value: 10, configurable: true });
    el.dispatchEvent(new Event("loadedmetadata"));

    container.querySelector<HTMLButtonElement>(".gnt-dv-media-info-action")!.click();
    await waitFor(() => el.getAttribute("src") === "blob:fake");

    expect(fetchMock).toHaveBeenCalled();
    instance.destroy();
  });
});
