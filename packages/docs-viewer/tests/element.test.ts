import { afterEach, describe, expect, it, vi } from "vitest";
import { RendererRegistry } from "../src/core/registry";
import type { RenderContext, Renderer } from "../src/core/types";
import { defineDocsViewer, DocsViewerElement, TAG } from "../src/element";

defineDocsViewer();

const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

function fakeRenderer(id = "fake"): Renderer {
  return {
    id,
    priority: 1000,
    match: () => true,
    mount(container) {
      const node = document.createElement("div");
      node.dataset.testid = "fake-renderer";
      node.textContent = "rendered";
      container.appendChild(node);
      return {
        destroy() {
          node.remove();
        },
      };
    },
  };
}

function throwingRenderer(): Renderer {
  return {
    id: "boom",
    priority: 1000,
    match: () => true,
    mount() {
      throw new Error("kaboom");
    },
  };
}

function create(config?: Record<string, unknown>, renderer: Renderer = fakeRenderer()) {
  const element = document.createElement(TAG) as DocsViewerElement;
  element.registry = new RendererRegistry().register(renderer);
  document.body.appendChild(element);
  if (config) element.config = config;
  return element;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("DocsViewerElement", () => {
  it("renders through the registered renderer and emits gnt-ready", async () => {
    const ready = vi.fn();
    const element = document.createElement(TAG) as DocsViewerElement;
    element.registry = new RendererRegistry().register(fakeRenderer());
    element.addEventListener("gnt-ready", ready);
    document.body.appendChild(element);
    element.config = { source: "/a.pdf" };
    await flush();

    expect(element.querySelector('[data-testid="fake-renderer"]')).not.toBeNull();
    expect(ready).toHaveBeenCalledTimes(1);
    expect(ready.mock.calls[0]?.[0]).toBeInstanceOf(CustomEvent);
  });

  it("shows an empty state when no source is given", async () => {
    const element = create({});
    await flush();
    expect(element.resolvedConfig?.source).toBeUndefined();
    expect(element.textContent).toContain("No document source");
  });

  it("reads config from attributes", async () => {
    const element = document.createElement(TAG) as DocsViewerElement;
    element.setAttribute("source", "/b.pdf");
    element.setAttribute("preflight", "false");
    document.body.appendChild(element);
    await flush();

    expect(element.resolvedConfig?.preflight).toBe(false);
    expect(element.resolvedConfig?.source).toBe("/b.pdf");
  });

  it("lets the config property win over attributes", async () => {
    const element = document.createElement(TAG) as DocsViewerElement;
    element.setAttribute("preflight", "false");
    element.registry = new RendererRegistry().register(fakeRenderer());
    document.body.appendChild(element);
    element.config = { source: "/a.pdf", preflight: true };
    await flush();
    expect(element.resolvedConfig?.preflight).toBe(true);
  });

  it("derives the file kind from the source URL when no name is set", async () => {
    let captured: RenderContext | undefined;
    const renderer: Renderer = {
      id: "capture",
      priority: 1000,
      match: () => true,
      mount(_container, ctx) {
        captured = ctx;
        return { destroy() {} };
      },
    };

    const element = document.createElement(TAG) as DocsViewerElement;
    element.registry = new RendererRegistry().register(renderer);
    document.body.appendChild(element);
    element.config = { source: "/docs/report.pdf" };
    await flush();

    expect(captured?.kind).toBe("pdf");
    expect(captured?.name).toBe("report.pdf");
    expect(captured?.mime).toBe("application/pdf");
  });

  it("detects the file kind from the Content-Type when type is auto", async () => {
    let captured: RenderContext | undefined;
    const renderer: Renderer = {
      id: "capture",
      priority: 1000,
      match: () => true,
      mount(_container, ctx) {
        captured = ctx;
        return { destroy() {} };
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(null, {
            status: 200,
            headers: { "content-type": "application/pdf" },
          }),
      ),
    );

    const element = document.createElement(TAG) as DocsViewerElement;
    element.registry = new RendererRegistry().register(renderer);
    document.body.appendChild(element);
    // Extension-less URL: only the response header can reveal the type.
    element.config = { source: "https://files.test/download?id=42", type: "auto" };
    await flush();
    await flush();

    expect(captured?.kind).toBe("pdf");
    expect(captured?.mime).toBe("application/pdf");
  });

  it("refines an unknown extension from the Content-Type while preflighting", async () => {
    let captured: RenderContext | undefined;
    const renderer: Renderer = {
      id: "capture",
      priority: 1000,
      match: () => true,
      mount(_container, ctx) {
        captured = ctx;
        return { destroy() {} };
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(null, { status: 200, headers: { "content-type": "image/png" } }),
      ),
    );

    const element = document.createElement(TAG) as DocsViewerElement;
    element.registry = new RendererRegistry().register(renderer);
    document.body.appendChild(element);
    element.config = { source: "https://files.test/blob?id=7" };
    await flush();
    await flush();

    expect(captured?.kind).toBe("image");
  });

  it("prefers the Content-Type over a misleading extension", async () => {
    // The URL says .pdf, the server says image/png → the header wins.
    let captured: RenderContext | undefined;
    const renderer: Renderer = {
      id: "capture",
      priority: 1000,
      match: () => true,
      mount(_container, ctx) {
        captured = ctx;
        return { destroy() {} };
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(null, { status: 200, headers: { "content-type": "image/png" } }),
      ),
    );

    const element = document.createElement(TAG) as DocsViewerElement;
    element.registry = new RendererRegistry().register(renderer);
    document.body.appendChild(element);
    element.config = { source: "https://files.test/report.pdf" };
    await flush();
    await flush();

    expect(captured?.kind).toBe("image");
  });

  it("falls back to the extension when the Content-Type is unavailable", async () => {
    let captured: RenderContext | undefined;
    const renderer: Renderer = {
      id: "capture",
      priority: 1000,
      match: () => true,
      mount(_container, ctx) {
        captured = ctx;
        return { destroy() {} };
      },
    };
    // A CORS-blocked probe rejects → "unknown", with no Content-Type.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    const element = document.createElement(TAG) as DocsViewerElement;
    element.registry = new RendererRegistry().register(renderer);
    document.body.appendChild(element);
    element.config = { source: "https://files.test/report.pdf" };
    await flush();
    await flush();

    expect(captured?.kind).toBe("pdf");
  });

  it("does not probe a locked type under preflight auto", async () => {
    let captured: RenderContext | undefined;
    const renderer: Renderer = {
      id: "capture",
      priority: 1000,
      match: () => true,
      mount(_container, ctx) {
        captured = ctx;
        return { destroy() {} };
      },
    };
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const element = document.createElement(TAG) as DocsViewerElement;
    element.registry = new RendererRegistry().register(renderer);
    document.body.appendChild(element);
    element.config = { source: "https://files.test/report.bin", type: "pdf", preflight: "auto" };
    await flush();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(captured?.kind).toBe("pdf");
  });

  it("does not probe when preflight is false", async () => {
    let captured: RenderContext | undefined;
    const renderer: Renderer = {
      id: "capture",
      priority: 1000,
      match: () => true,
      mount(_container, ctx) {
        captured = ctx;
        return { destroy() {} };
      },
    };
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const element = document.createElement(TAG) as DocsViewerElement;
    element.registry = new RendererRegistry().register(renderer);
    document.body.appendChild(element);
    element.config = { source: "https://files.test/report.pdf", preflight: false };
    await flush();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(captured?.kind).toBe("pdf");
  });

  it("probes when preflight is true even for a known type", async () => {
    const fetchSpy = vi.fn(
      async () =>
        new Response(null, { status: 200, headers: { "content-type": "application/pdf" } }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const element = document.createElement(TAG) as DocsViewerElement;
    element.registry = new RendererRegistry().register(fakeRenderer());
    document.body.appendChild(element);
    element.config = { source: "https://files.test/report.pdf", type: "pdf", preflight: true };
    await flush();
    await flush();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it("prefers the configured engine over priority", async () => {
    const order: string[] = [];
    const makeRenderer = (id: string, engine: string, priority: number): Renderer => ({
      id,
      engine,
      priority,
      match: () => true,
      mount(container) {
        order.push(id);
        const node = document.createElement("div");
        node.dataset.testid = id;
        container.appendChild(node);
        return {
          destroy() {
            node.remove();
          },
        };
      },
    });

    const element = document.createElement(TAG) as DocsViewerElement;
    element.registry = new RendererRegistry()
      .register(makeRenderer("a", "alpha", 1))
      .register(makeRenderer("b", "beta", 5));
    document.body.appendChild(element);
    element.config = { source: "/a.pdf", engine: "alpha" };
    await flush();

    expect(order).toEqual(["a"]);
    expect(element.querySelector('[data-testid="a"]')).not.toBeNull();
  });

  it("falls back to the next renderer when one reports failure", async () => {
    const order: string[] = [];
    const failing: Renderer = {
      id: "primary",
      engine: "primary",
      priority: 100,
      match: () => true,
      mount(container, ctx) {
        order.push("primary");
        const node = document.createElement("div");
        node.dataset.testid = "primary";
        container.appendChild(node);
        queueMicrotask(() => ctx.fail?.(new Error("nope")));
        return {
          destroy() {
            node.remove();
          },
        };
      },
    };
    const fallback: Renderer = {
      id: "secondary",
      engine: "secondary",
      priority: 50,
      match: () => true,
      mount(container) {
        order.push("secondary");
        const node = document.createElement("div");
        node.dataset.testid = "secondary";
        container.appendChild(node);
        return {
          destroy() {
            node.remove();
          },
        };
      },
    };

    const element = document.createElement(TAG) as DocsViewerElement;
    element.registry = new RendererRegistry().register(failing).register(fallback);
    document.body.appendChild(element);
    element.config = { source: "/a.pdf" };
    await flush();

    expect(order).toEqual(["primary", "secondary"]);
    expect(element.querySelector('[data-testid="secondary"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="primary"]')).toBeNull();
  });

  it("does not fall back when a specific engine fails", async () => {
    const onError = vi.fn();
    const failing: Renderer = {
      id: "primary",
      engine: "primary",
      priority: 100,
      match: () => true,
      mount(container, ctx) {
        const node = document.createElement("div");
        node.dataset.testid = "primary";
        container.appendChild(node);
        queueMicrotask(() => ctx.fail?.(new Error("nope")));
        return {
          destroy() {
            node.remove();
          },
        };
      },
    };
    const fallback: Renderer = {
      id: "secondary",
      engine: "secondary",
      priority: 50,
      match: () => true,
      mount(container) {
        const node = document.createElement("div");
        node.dataset.testid = "secondary";
        container.appendChild(node);
        return {
          destroy() {
            node.remove();
          },
        };
      },
    };

    const element = document.createElement(TAG) as DocsViewerElement;
    element.registry = new RendererRegistry().register(failing).register(fallback);
    element.addEventListener("gnt-error", onError);
    document.body.appendChild(element);
    element.config = { source: "/a.pdf", engine: "primary" };
    await flush();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(element.querySelector('[data-testid="secondary"]')).toBeNull();
  });

  it("errors when the selected engine cannot handle the document", async () => {
    const onError = vi.fn();
    const element = document.createElement(TAG) as DocsViewerElement;
    element.registry = new RendererRegistry().register({
      id: "alpha",
      engine: "alpha",
      priority: 1,
      match: () => false,
      mount: () => ({ destroy() {} }),
    });
    element.addEventListener("gnt-error", onError);
    document.body.appendChild(element);
    element.config = { source: "/a.pdf", engine: "alpha" };
    await flush();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(element.textContent).toContain("alpha");
  });

  it("preflights absolute URLs and fails fast on 404", async () => {
    const onError = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
    const element = document.createElement(TAG) as DocsViewerElement;
    element.registry = new RendererRegistry().register(fakeRenderer());
    element.addEventListener("gnt-error", onError);
    document.body.appendChild(element);
    element.config = { source: "https://files.test/report.pdf" };
    await flush();
    await flush();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(element.querySelector('[data-testid="fake-renderer"]')).toBeNull();
  });

  it("skips preflight for relative URLs", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const element = create({ source: "/a.pdf" });
    await flush();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(element.querySelector('[data-testid="fake-renderer"]')).not.toBeNull();
  });

  it("emits gnt-error when a renderer throws", async () => {
    const onError = vi.fn();
    const element = document.createElement(TAG) as DocsViewerElement;
    element.registry = new RendererRegistry().register(throwingRenderer());
    element.addEventListener("gnt-error", onError);
    document.body.appendChild(element);
    element.config = { source: "/a.pdf" };
    await flush();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(element.textContent).toContain("kaboom");
  });

  it("cleans up the renderer on disconnect", async () => {
    const element = create({ source: "/a.pdf" });
    await flush();
    expect(element.querySelector('[data-testid="fake-renderer"]')).not.toBeNull();

    element.remove();
    await flush();
    expect(element.querySelector('[data-testid="fake-renderer"]')).toBeNull();
  });
});
