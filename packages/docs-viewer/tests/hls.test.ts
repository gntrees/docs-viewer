import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveConfig } from "../src/core/config";
import type { RenderContext } from "../src/core/types";

interface MockHlsInstance {
  attached: unknown;
  loaded: string | null;
  destroyed: boolean;
  on(event: string, cb: (event: string, data: unknown) => void): void;
  emit(event: string, data?: unknown): void;
}

const { MockHls, instances } = vi.hoisted(() => {
  class MockHls implements MockHlsInstance {
    static supported = true;
    static isSupported(): boolean {
      return MockHls.supported;
    }
    static Events = { ERROR: "hlsError", MEDIA_ATTACHED: "hlsMediaAttached" };

    listeners: Record<string, Array<(event: string, data: unknown) => void>> = {};
    attached: unknown = null;
    loaded: string | null = null;
    destroyed = false;

    constructor() {
      instances.push(this);
    }
    on(event: string, cb: (event: string, data: unknown) => void): void {
      (this.listeners[event] ??= []).push(cb);
    }
    attachMedia(el: unknown): void {
      this.attached = el;
      this.emit("hlsMediaAttached");
    }
    loadSource(url: string): void {
      this.loaded = url;
    }
    emit(event: string, data?: unknown): void {
      for (const cb of this.listeners[event] ?? []) cb(event, data);
    }
    destroy(): void {
      this.destroyed = true;
    }
  }
  const instances: MockHls[] = [];
  return { MockHls, instances };
});

vi.mock("hls.js", () => ({ default: MockHls }));

import { hlsRenderer } from "../src/renderers/hls";

function context(overrides: Partial<RenderContext> = {}): RenderContext {
  return {
    displayUrl: "https://x.test/stream.m3u8",
    name: "stream.m3u8",
    mime: "application/vnd.apple.mpegurl",
    ext: "m3u8",
    kind: "video",
    config: resolveConfig(),
    ...overrides,
  };
}

async function waitFor(predicate: () => boolean, timeout = 2000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeout) throw new Error("waitFor timed out");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function host(): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
}

afterEach(() => {
  instances.length = 0;
  MockHls.supported = true;
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("hlsRenderer", () => {
  it("only matches .m3u8 videos", () => {
    expect(hlsRenderer.engine).toBe("hls");
    expect(hlsRenderer.match(context())).toBe(true);
    expect(hlsRenderer.match(context({ ext: "mp4" }))).toBe(false);
    expect(hlsRenderer.match(context({ kind: "audio", ext: "m3u8" }))).toBe(false);
  });

  it("attaches hls.js and loads the playlist source", async () => {
    const container = host();
    const instance = hlsRenderer.mount(container, context());

    const video = container.querySelector("video.gnt-dv-media");
    expect(video).not.toBeNull();
    await waitFor(() => instances.length === 1 && instances[0]!.loaded !== null);

    expect(instances[0]!.attached).toBe(video);
    expect(instances[0]!.loaded).toBe("https://x.test/stream.m3u8");

    instance.destroy();
    expect(instances[0]!.destroyed).toBe(true);
    expect(container.querySelector("video")).toBeNull();
  });

  it("falls back to a fatal-error report on fatal hls.js errors", async () => {
    const container = host();
    const fail = vi.fn();
    const instance = hlsRenderer.mount(container, context({ fail }));
    await waitFor(() => instances.length === 1);

    instances[0]!.emit("hlsError", { fatal: false, details: "bufferStalledError" });
    expect(fail).not.toHaveBeenCalled();

    instances[0]!.emit("hlsError", { fatal: true, details: "manifestLoadError" });
    expect(fail).toHaveBeenCalledTimes(1);

    instance.destroy();
  });

  it("uses native HLS (<video src>) when hls.js is unsupported", async () => {
    MockHls.supported = false;
    vi.spyOn(HTMLMediaElement.prototype, "canPlayType").mockReturnValue("maybe");

    const container = host();
    const instance = hlsRenderer.mount(container, context());

    await waitFor(() => container.querySelector("video")?.getAttribute("src") !== null);
    expect(container.querySelector("video")?.getAttribute("src")).toBe(
      "https://x.test/stream.m3u8",
    );

    instance.destroy();
  });
});
