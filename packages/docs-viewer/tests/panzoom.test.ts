import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveConfig } from "../src/core/config";
import type { RenderContext } from "../src/core/types";
import { panzoomRenderer } from "../src/renderers/panzoom";

interface MockInstance {
  element: unknown;
  options: Record<string, unknown>;
  calls: string[];
  destroyed: boolean;
}

const { MockPanzoom, instances } = vi.hoisted(() => {
  const instances: MockInstance[] = [];

  function MockPanzoom(element: unknown, options: Record<string, unknown> = {}): MockInstance {
    const instance: MockInstance = {
      element,
      options,
      calls: [],
      destroyed: false,
      zoomIn: () => instance.calls.push("zoomIn"),
      zoomOut: () => instance.calls.push("zoomOut"),
      zoom: (scale: number) => instance.calls.push(`zoom:${scale}`),
      reset: () => instance.calls.push("reset"),
      zoomWithWheel: () => instance.calls.push("wheel"),
      destroy: () => {
        instance.destroyed = true;
      },
    } as unknown as MockInstance;
    instances.push(instance);
    return instance;
  }

  return { MockPanzoom, instances };
});

vi.mock("@panzoom/panzoom", () => ({ default: MockPanzoom }));

function context(overrides: Partial<RenderContext> = {}): RenderContext {
  return {
    displayUrl: "https://x.test/a.png",
    name: "a.png",
    mime: "image/png",
    ext: "png",
    kind: "image",
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

const buttonList = (container: HTMLElement): HTMLButtonElement[] =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".gnt-dv-panzoom-btn"));

/** Stub the Fullscreen API so click-to-fullscreen is observable in happy-dom. */
function stubFullscreen(): ReturnType<typeof vi.fn> {
  const requestFullscreen = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
    value: requestFullscreen,
    configurable: true,
    writable: true,
  });
  return requestFullscreen;
}

afterEach(() => {
  instances.length = 0;
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("panzoomRenderer", () => {
  it("matches images and advertises the panzoom engine", () => {
    expect(panzoomRenderer.engine).toBe("panzoom");
    expect(panzoomRenderer.match(context())).toBe(true);
    expect(panzoomRenderer.match(context({ kind: "pdf" }))).toBe(false);
  });

  it("mounts a panzoom stage with its own inline-SVG toolbar", async () => {
    const container = host();
    const instance = panzoomRenderer.mount(container, context());
    await waitFor(() => instances.length === 1);

    const stage = container.querySelector(".gnt-dv-panzoom-stage");
    expect(container.querySelector(".gnt-dv-panzoom")).not.toBeNull();
    expect(stage).not.toBeNull();
    expect(stage?.querySelector("img")?.getAttribute("src")).toBe("https://x.test/a.png");
    expect(buttonList(container)).toHaveLength(9);
    expect(container.querySelector(".gnt-dv-panzoom-bar svg")).not.toBeNull();
    // No background-image anywhere (icons are real inline SVG).
    expect(container.querySelector("[style*='background-image']")).toBeNull();
    // Panzoom transforms the stage (outer), not the image (rotation is inner).
    expect(instances[0]!.element).toBe(stage);
    expect(instances[0]!.options.maxScale).toBe(8);

    instance.destroy();
  });

  it("wires the zoom and reset buttons to the panzoom instance", async () => {
    const container = host();
    const instance = panzoomRenderer.mount(container, context());
    await waitFor(() => instances.length === 1);

    const [zoomOut, zoomIn, , , , , , reset] = buttonList(container);
    zoomOut!.click();
    zoomIn!.click();
    reset!.click();
    expect(instances[0]!.calls).toEqual(["zoomOut", "zoomIn", "reset"]);

    instance.destroy();
  });

  it("zooms to natural size with the 1:1 button", async () => {
    const container = host();
    const instance = panzoomRenderer.mount(container, context());
    await waitFor(() => instances.length === 1);

    const img = container.querySelector("img")!;
    Object.defineProperty(img, "naturalWidth", { value: 1000, configurable: true });
    Object.defineProperty(img, "clientWidth", { value: 500, configurable: true });

    buttonList(container)[2]!.click();
    expect(instances[0]!.calls).toContain("zoom:2");

    instance.destroy();
  });

  it("rotates the image on the rotate buttons and clears rotation on reset", async () => {
    const container = host();
    const instance = panzoomRenderer.mount(container, context());
    await waitFor(() => instances.length === 1);

    const img = container.querySelector("img")!;
    buttonList(container)[4]!.click(); // rotate right
    expect(img.style.rotate).toBe("90deg");
    buttonList(container)[3]!.click(); // rotate left
    expect(img.style.rotate).toBe("");

    buttonList(container)[4]!.click(); // rotate right again
    buttonList(container)[7]!.click(); // reset
    expect(img.style.rotate).toBe("");

    instance.destroy();
  });

  it("mirrors the image with the flip buttons and clears it on reset", async () => {
    const container = host();
    const instance = panzoomRenderer.mount(container, context());
    await waitFor(() => instances.length === 1);

    const img = container.querySelector("img")!;
    buttonList(container)[5]!.click(); // flip horizontal
    expect(img.style.transform).toBe("scale(-1, 1)");
    buttonList(container)[6]!.click(); // flip vertical
    expect(img.style.transform).toBe("scale(-1, -1)");
    buttonList(container)[7]!.click(); // reset
    expect(img.style.transform).toBe("");

    instance.destroy();
  });

  it("does not render a download button", async () => {
    const container = host();
    const instance = panzoomRenderer.mount(container, context());
    await waitFor(() => instances.length === 1);

    const labels = buttonList(container).map((button) => button.title);
    expect(labels).not.toContain("Download");

    instance.destroy();
  });

  it("opens fullscreen on click by default", async () => {
    const requestFullscreen = stubFullscreen();
    const container = host();
    const instance = panzoomRenderer.mount(container, context());
    await waitFor(() => instances.length === 1);

    container.querySelector(".gnt-dv-panzoom-stage")!.dispatchEvent(new MouseEvent("click"));
    expect(requestFullscreen).toHaveBeenCalledTimes(1);

    instance.destroy();
  });

  it("does not open fullscreen when the click ends a pan gesture", async () => {
    const requestFullscreen = stubFullscreen();
    const container = host();
    const instance = panzoomRenderer.mount(container, context());
    await waitFor(() => instances.length === 1);

    const stage = container.querySelector(".gnt-dv-panzoom-stage")!;
    stage.dispatchEvent(new PointerEvent("pointerdown", { clientX: 10, clientY: 10 }));
    stage.dispatchEvent(new MouseEvent("click", { clientX: 120, clientY: 120 }));
    expect(requestFullscreen).not.toHaveBeenCalled();

    instance.destroy();
  });

  it("does not wire the click handler when image.fullscreen is false", async () => {
    const requestFullscreen = stubFullscreen();
    const container = host();
    const instance = panzoomRenderer.mount(
      container,
      context({ config: resolveConfig({ image: { fullscreen: false } }) }),
    );
    await waitFor(() => instances.length === 1);

    container.querySelector(".gnt-dv-panzoom-stage")!.dispatchEvent(new MouseEvent("click"));
    expect(requestFullscreen).not.toHaveBeenCalled();

    instance.destroy();
  });

  it("reports failure when the image cannot be decoded", () => {
    const container = host();
    const fail = vi.fn();
    const instance = panzoomRenderer.mount(container, context({ fail }));

    container.querySelector("img")!.dispatchEvent(new Event("error"));
    expect(fail).toHaveBeenCalledTimes(1);

    instance.destroy();
  });

  it("destroys panzoom and removes its DOM on destroy", async () => {
    const container = host();
    const instance = panzoomRenderer.mount(container, context());
    await waitFor(() => instances.length === 1);

    instance.destroy();
    expect(instances[0]!.destroyed).toBe(true);
    expect(container.querySelector(".gnt-dv-panzoom")).toBeNull();
  });
});
