import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveConfig } from "../core/config";
import type { RenderContext } from "../core/types";
import { shikiLangForExt, shikiRenderer, shikiTheme } from "../renderer/shiki";

function context(overrides: Partial<RenderContext> = {}): RenderContext {
  return {
    displayUrl: "https://x.test/a.ts",
    name: "a.ts",
    mime: "text/plain",
    ext: "ts",
    kind: "text",
    config: resolveConfig(),
    ...overrides,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("shikiLangForExt", () => {
  it("maps extensions to shiki language ids", () => {
    expect(shikiLangForExt("ts")).toBe("typescript");
    expect(shikiLangForExt("py")).toBe("python");
    expect(shikiLangForExt("yml")).toBe("yaml");
    expect(shikiLangForExt("nope")).toBe("text");
  });

  it("maps languages beyond the playground list", () => {
    expect(shikiLangForExt("rb")).toBe("ruby");
    expect(shikiLangForExt("java")).toBe("java");
    expect(shikiLangForExt("php")).toBe("php");
    expect(shikiLangForExt("swift")).toBe("swift");
    expect(shikiLangForExt("kt")).toBe("kotlin");
    expect(shikiLangForExt("cs")).toBe("csharp");
    expect(shikiLangForExt("scss")).toBe("scss");
    expect(shikiLangForExt("vue")).toBe("vue");
    expect(shikiLangForExt("svelte")).toBe("svelte");
    expect(shikiLangForExt("sql")).toBe("sql");
    expect(shikiLangForExt("lua")).toBe("lua");
    expect(shikiLangForExt("r")).toBe("r");
  });
});

describe("shikiTheme", () => {
  it("uses the configured code theme", () => {
    expect(shikiTheme(resolveConfig({ code: { theme: "vitesse-dark" } }))).toBe("vitesse-dark");
  });

  it("follows prefers-color-scheme by default", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    expect(shikiTheme(resolveConfig())).toBe("github-light");
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    expect(shikiTheme(resolveConfig())).toBe("github-dark");
  });
});

describe("shikiRenderer", () => {
  it("matches text documents and advertises the shiki engine", () => {
    expect(shikiRenderer.engine).toBe("shiki");
    expect(shikiRenderer.match(context())).toBe(true);
    expect(shikiRenderer.match(context({ kind: "pdf" }))).toBe(false);
  });

  it("highlights code fetched from the URL", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("const x = 1;\n", { status: 200 })));
    const container = document.createElement("div");
    const instance = shikiRenderer.mount(container, context());

    // Shiki is loaded lazily; poll until the highlighted <pre> appears.
    for (let i = 0; i < 200 && !container.querySelector("pre.shiki"); i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    const pre = container.querySelector("pre.shiki");
    expect(pre).not.toBeNull();
    expect(pre?.innerHTML).toContain("const");
    expect(container.querySelector(".gnt-dv-bar-name")?.textContent).toBe("a.ts");
    instance.destroy();
  });

  it("highlights a non-playground language (ruby)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("puts 'hi'\n", { status: 200 })));
    const container = document.createElement("div");
    const instance = shikiRenderer.mount(
      container,
      context({ ext: "rb", name: "a.rb", displayUrl: "https://x.test/a.rb" }),
    );

    for (let i = 0; i < 200 && !container.querySelector("pre.shiki"); i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    const pre = container.querySelector("pre.shiki");
    expect(pre).not.toBeNull();
    expect(pre?.innerHTML).toContain("puts");
    instance.destroy();
  });

  it("reports failure when the fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
    const container = document.createElement("div");
    const fail = vi.fn();
    const instance = shikiRenderer.mount(container, context({ fail }));
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(fail).toHaveBeenCalledTimes(1);
    instance.destroy();
  });
});
