import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveConfig } from "../src/core/config";
import type { RenderContext } from "../src/core/types";
import { markupRenderer } from "../src/renderers/markup";

function context(overrides: Partial<RenderContext> = {}): RenderContext {
  return {
    displayUrl: "https://x.test/readme.md",
    source: "https://x.test/readme.md",
    name: "readme.md",
    mime: "text/markdown",
    ext: "md",
    kind: "markup",
    config: resolveConfig(),
    ...overrides,
  };
}

function htmlContext(overrides: Partial<RenderContext> = {}): RenderContext {
  return context({
    displayUrl: "https://x.test/page.html",
    source: "https://x.test/page.html",
    name: "page.html",
    mime: "text/html",
    ext: "html",
    ...overrides,
  });
}

describe("markupRenderer", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("matches markup documents and advertises the markup engine", () => {
    expect(markupRenderer.engine).toBe("markup");
    expect(markupRenderer.match(context())).toBe(true);
    expect(markupRenderer.match(context({ kind: "text" }))).toBe(false);
  });

  it("renders Markdown inside a sandboxed iframe by default", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("# Hi\n\nHello **world**\n")));
    const container = document.createElement("div");
    const instance = markupRenderer.mount(container, context());

    await vi.waitFor(
      () => {
        expect(container.querySelector("iframe.gnt-dv-markup-frame")).not.toBeNull();
      },
      { timeout: 5000 },
    );

    const frame = container.querySelector<HTMLIFrameElement>("iframe.gnt-dv-markup-frame");
    expect(frame?.getAttribute("sandbox")).toBe("allow-popups");
    expect(frame?.srcdoc).toContain("<h1");
    expect(frame?.srcdoc).toContain("<strong>world</strong>");
    expect(container.querySelector("a.gnt-dv-bar-name")?.getAttribute("href")).toBe(
      "https://x.test/readme.md",
    );

    instance.destroy();
  });

  it("renders a raw HTML file with its own document", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<style>h1{color:red}</style><h1>Page</h1>")));
    const container = document.createElement("div");
    const instance = markupRenderer.mount(container, htmlContext());

    await vi.waitFor(
      () => {
        expect(container.querySelector("iframe.gnt-dv-markup-frame")).not.toBeNull();
      },
      { timeout: 5000 },
    );

    const frame = container.querySelector<HTMLIFrameElement>("iframe.gnt-dv-markup-frame");
    expect(frame?.srcdoc).toContain("<h1>Page</h1>");
    // A <base> is injected so relative URLs resolve against the file's directory.
    expect(frame?.srcdoc).toContain('<base href="https://x.test/"');
    // The file's own styles are kept and no viewer theme CSS is injected.
    expect(frame?.srcdoc).toContain("color:red");
    expect(frame?.srcdoc).not.toContain("color-scheme");

    instance.destroy();
  });

  it("toggles to the Shiki-highlighted source", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("# Hi\n")));
    const container = document.createElement("div");
    const instance = markupRenderer.mount(container, context());

    await vi.waitFor(
      () => {
        expect(container.querySelector("iframe.gnt-dv-markup-frame")).not.toBeNull();
      },
      { timeout: 5000 },
    );

    const toggle = container.querySelector<HTMLButtonElement>(".gnt-dv-bar-btn[data-mode]");
    expect(toggle?.dataset.mode).toBe("rendered");
    toggle?.click();
    expect(container.querySelector("iframe.gnt-dv-markup-frame")).toBeNull();

    await vi.waitFor(
      () => {
        expect(container.querySelector(".gnt-dv-code-block pre.shiki")).not.toBeNull();
      },
      { timeout: 5000 },
    );
    expect(container.querySelector(".gnt-dv-code-block pre.shiki")?.innerHTML).toContain("Hi");

    instance.destroy();
  });

  it("renders inline and strips dangerous markup when sandbox is disabled", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response('<script>alert(1)</script><h1>Safe</h1>')));
    const container = document.createElement("div");
    const instance = markupRenderer.mount(
      container,
      htmlContext({ config: resolveConfig({ markup: { sandbox: false } }) }),
    );

    await vi.waitFor(
      () => {
        expect(container.querySelector(".gnt-dv-markup-doc h1")).not.toBeNull();
      },
      { timeout: 5000 },
    );

    expect(container.querySelector(".gnt-dv-markup-doc script")).toBeNull();
    expect(container.querySelector(".gnt-dv-markup-doc h1")?.textContent).toBe("Safe");

    instance.destroy();
  });

  it("reports failure when the fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
    const container = document.createElement("div");
    const fail = vi.fn();
    const instance = markupRenderer.mount(container, context({ fail }));
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(fail).toHaveBeenCalledTimes(1);
    instance.destroy();
  });
});
