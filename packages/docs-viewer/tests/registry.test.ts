import { describe, expect, it } from "vitest";
import { RendererRegistry } from "../src/core/registry";
import type { RenderContext, Renderer } from "../src/core/types";

const context = {
  displayUrl: "u",
  name: "n",
  mime: "",
  ext: "",
  kind: "unknown",
  config: {},
} as unknown as RenderContext;

function make(id: string, priority: number, matches = true): Renderer {
  return {
    id,
    priority,
    match: () => matches,
    mount: () => ({ destroy() {} }),
  };
}

describe("RendererRegistry", () => {
  it("picks the highest-priority match", () => {
    const registry = new RendererRegistry().register(make("a", 1)).register(make("b", 5));
    expect(registry.match(context)?.id).toBe("b");
  });

  it("returns every match ordered by priority", () => {
    const registry = new RendererRegistry()
      .register(make("a", 1))
      .register(make("b", 5))
      .register(make("c", 3, false));
    expect(registry.candidates(context).map((renderer) => renderer.id)).toEqual(["b", "a"]);
  });

  it("skips renderers that throw inside match", () => {
    const bad: Renderer = {
      id: "bad",
      priority: 100,
      match: () => {
        throw new Error("boom");
      },
      mount: () => ({ destroy() {} }),
    };
    const registry = new RendererRegistry().register(bad).register(make("ok", 0));
    expect(registry.match(context)?.id).toBe("ok");
  });

  it("replaces renderers with the same id", () => {
    const registry = new RendererRegistry().register(make("a", 1)).register(make("a", 2));
    expect(registry.list()).toHaveLength(1);
    expect(registry.list()[0]?.priority).toBe(2);
  });

  it("unregisters by id", () => {
    const registry = new RendererRegistry().register(make("a", 1));
    registry.unregister("a");
    expect(registry.match(context)).toBeUndefined();
  });
});
