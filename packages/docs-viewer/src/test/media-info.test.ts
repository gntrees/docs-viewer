import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveConfig } from "../core/config";
import type { RenderContext } from "../types/types";
import { attachMediaInfo, type MediaInfoContext } from "../ui/media-info";

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

const actionIn = (container: HTMLElement): HTMLButtonElement | null =>
  container.querySelector<HTMLButtonElement>(".gnt-dv-media-info-action");

/** Replace the read-only TimeRanges getters with plain values. */
function stubRanges(
  el: HTMLMediaElement,
  seekable: Array<[number, number]>,
  buffered: Array<[number, number]>,
  duration: number,
): void {
  const ranges = (list: Array<[number, number]>) => ({
    length: list.length,
    start: (index: number) => list[index]![0],
    end: (index: number) => list[index]![1],
  });
  Object.defineProperty(el, "seekable", { value: ranges(seekable), configurable: true });
  Object.defineProperty(el, "buffered", { value: ranges(buffered), configurable: true });
  Object.defineProperty(el, "duration", { value: duration, configurable: true });
}

function readyState(el: HTMLMediaElement, value: number): void {
  Object.defineProperty(el, "readyState", { value, configurable: true });
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("attachMediaInfo", () => {
  it("reports a non-seekable stream when there is no range support", () => {
    const container = host();
    const el = document.createElement("video");
    const ctx: MediaInfoContext = { current: context() };

    attachMediaInfo(container, el, ctx);

    const panel = container.querySelector(".gnt-dv-media-info");
    expect(panel).not.toBeNull();
    expect(panel?.textContent).toContain("video/mp4");
    expect(panel?.textContent).toContain("seekable: no");
    expect(panel?.textContent).toContain("buffered 0%");
  });

  it("reports duration, seekability and buffered progress once metadata loads", () => {
    const container = host();
    const el = document.createElement("video");
    const ctx: MediaInfoContext = { current: context() };
    attachMediaInfo(container, el, ctx);

    stubRanges(el, [[0, 100]], [[0, 50]], 100);
    el.dispatchEvent(new Event("loadedmetadata"));

    const text = container.querySelector(".gnt-dv-media-info")?.textContent ?? "";
    expect(text).toContain("1:40"); // 100s
    expect(text).toContain("seekable: yes");
    expect(text).toContain("buffered 50%");
  });

  it("labels a live stream with a buffer window as buffer-only seek", () => {
    const container = host();
    const el = document.createElement("video");
    const ctx: MediaInfoContext = { current: context() };
    attachMediaInfo(container, el, ctx);

    stubRanges(el, [[0, 30]], [[0, 30]], Number.POSITIVE_INFINITY);
    el.dispatchEvent(new Event("durationchange"));

    const text = container.querySelector(".gnt-dv-media-info")?.textContent ?? "";
    expect(text).toContain("live / streaming");
    expect(text).toContain("live (seek: buffer only)");
  });

  it("labels a live stream without a buffer window as no seek", () => {
    const container = host();
    const el = document.createElement("video");
    attachMediaInfo(container, el, { current: context() });

    stubRanges(el, [], [[0, 0]], Number.POSITIVE_INFINITY);
    el.dispatchEvent(new Event("durationchange"));

    const text = container.querySelector(".gnt-dv-media-info")?.textContent ?? "";
    expect(text).toContain("live (no seek)");
  });

  it("labels a finite stream whose range does not cover the file as partial", () => {
    const container = host();
    const el = document.createElement("video");
    attachMediaInfo(container, el, { current: context() });

    stubRanges(el, [[0, 40]], [[0, 40]], 100);
    readyState(el, 1);
    el.dispatchEvent(new Event("loadedmetadata"));

    expect(container.querySelector(".gnt-dv-media-info")?.textContent).toContain("seekable: partial");
  });

  it("offers a Load fully action for a finite, non-seekable file", async () => {
    const container = host();
    const el = document.createElement("video");
    stubRanges(el, [], [[0, 0]], 100);
    readyState(el, 1);

    const loadFully = vi.fn(() => Promise.resolve());
    attachMediaInfo(container, el, { current: context() }, { loadFully });
    el.dispatchEvent(new Event("loadedmetadata"));

    const action = actionIn(container);
    expect(action).not.toBeNull();
    expect(action?.hidden).toBe(false);

    action?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(loadFully).toHaveBeenCalledTimes(1);
  });

  it("does not offer the action without a handler or when already seekable", () => {
    const containerWithout = host();
    const elWithout = document.createElement("video");
    stubRanges(elWithout, [], [[0, 0]], 100);
    readyState(elWithout, 1);
    attachMediaInfo(containerWithout, elWithout, { current: context() });
    expect(actionIn(containerWithout)?.hidden).toBe(true);

    const containerSeekable = host();
    const elSeekable = document.createElement("video");
    stubRanges(elSeekable, [[0, 100]], [[0, 10]], 100);
    readyState(elSeekable, 1);
    attachMediaInfo(containerSeekable, elSeekable, { current: context() }, { loadFully: () => Promise.resolve() });
    expect(actionIn(containerSeekable)?.hidden).toBe(true);
  });

  it("removes the panel on cleanup", () => {
    const container = host();
    const el = document.createElement("video");
    const detach = attachMediaInfo(container, el, { current: context() });

    expect(container.querySelector(".gnt-dv-media-info")).not.toBeNull();
    detach();
    expect(container.querySelector(".gnt-dv-media-info")).toBeNull();
  });
});
