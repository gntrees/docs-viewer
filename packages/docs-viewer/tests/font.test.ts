import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveConfig } from "../src/core/config";
import type { RenderContext } from "../src/core/types";
import { fontRenderer } from "../src/renderers/font";
import { makeSfntFont } from "./fixtures";

class FakeFontFace {
  constructor(
    public family: string,
    public source: string,
  ) {}
  async load(): Promise<FakeFontFace> {
    return this;
  }
}

function context(url: string): RenderContext {
  return {
    displayUrl: url,
    source: url,
    name: "Test.ttf",
    mime: "font/ttf",
    ext: "ttf",
    kind: "font",
    config: resolveConfig(),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fontRenderer", () => {
  it("draws a specimen and shows the real family name", async () => {
    vi.stubGlobal("FontFace", FakeFontFace);
    const added: unknown[] = [];
    Object.defineProperty(document, "fonts", {
      value: { add: (face: unknown) => added.push(face) },
      configurable: true,
    });
    const font = makeSfntFont({ family: "Specimen Test", subfamily: "Regular", unitsPerEm: 1000 });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(font)));

    const container = document.createElement("div");
    const instance = fontRenderer.mount(container, context("https://x.test/Test.ttf"));

    await vi.waitFor(() => {
      expect(container.querySelector(".gnt-dv-font-hero")).toBeTruthy();
    });
    await vi.waitFor(() => {
      expect(container.querySelector(".gnt-dv-font-info")?.textContent).toContain(
        "Specimen Test",
      );
    });
    expect(container.querySelectorAll(".gnt-dv-font-row").length).toBeGreaterThan(0);
    expect(added.length).toBe(1);

    instance.destroy();
    expect(container.querySelector(".gnt-dv-font")).toBeNull();
  });

  it("reports a failure when the font cannot load", async () => {
    vi.stubGlobal(
      "FontFace",
      class {
        constructor() {}
        async load(): Promise<never> {
          throw new Error("bad font");
        }
      },
    );
    const fail = vi.fn();
    const ctx = { ...context("https://x.test/bad.ttf"), fail };
    const container = document.createElement("div");
    const instance = fontRenderer.mount(container, ctx);
    await vi.waitFor(() => expect(fail).toHaveBeenCalled());
    instance.destroy();
  });
});
