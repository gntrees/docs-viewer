import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { h as preactH, render as preactRender } from "preact";
import { createRoot as createSolidRoot } from "solid-js";
import { createApp } from "vue";
import { RendererRegistry } from "../core/registry";
import type { Renderer } from "../types/types";
import { DocsViewerElement } from "../core/element";
import * as preactWrapper from "../wrapper/preact";
import * as reactWrapper from "../wrapper/react";
import * as solidWrapper from "../wrapper/solid";
import * as svelteWrapper from "../wrapper/svelte";
import * as vueWrapper from "../wrapper/vue";

// React 19 warns (and refuses to flush) unless the act environment is declared.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** A renderer that matches everything, so wrappers can be tested without network. */
function fakeRenderer(): Renderer {
  return {
    id: "fake",
    priority: 1000,
    match: () => true,
    mount(container: HTMLElement) {
      const node = document.createElement("div");
      node.dataset.testid = "fake-renderer";
      container.appendChild(node);
      return {
        destroy() {
          node.remove();
        },
      };
    },
  };
}

// Swap the shared registry so every wrapper-created element renders offline.
beforeEach(() => {
  DocsViewerElement.registry = new RendererRegistry().register(fakeRenderer());
});

afterEach(() => {
  document.body.replaceChildren();
});

const config = { source: "/report.pdf", preflight: false };

type ViewerElement = HTMLElement & { config?: { source?: string } };

function viewerIn(host: HTMLElement): ViewerElement | null {
  return host.querySelector("gnt-docs-viewer") as ViewerElement | null;
}

/**
 * Frameworks mount on different schedules (React via `act`, Preact after a
 * deferred effect), so poll instead of assuming a fixed number of ticks.
 */
async function waitForViewer(host: HTMLElement): Promise<ViewerElement> {
  for (let i = 0; i < 50; i++) {
    const viewer = viewerIn(host);
    if (viewer) return viewer;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error("viewer did not mount");
}

function host(): HTMLDivElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

describe("framework wrappers", () => {
  it("exports the names the playground snippets import", () => {
    // React / Preact / Solid / Vue expose a `DocsViewer` component...
    expect(typeof reactWrapper.DocsViewer).toBe("function");
    expect(typeof preactWrapper.DocsViewer).toBe("function");
    expect(typeof solidWrapper.DocsViewer).toBe("function");
    expect(vueWrapper.DocsViewer).toBeTypeOf("object");
    // ...while Svelte exposes a `docsViewer` action.
    expect(typeof svelteWrapper.docsViewer).toBe("function");
  });

  it("react: <DocsViewer {...config} /> mounts and applies config", async () => {
    const el = host();
    const root = createRoot(el);
    await act(async () => {
      root.render(createElement(reactWrapper.DocsViewer, config));
    });

    const viewer = await waitForViewer(el);
    expect(viewer.config?.source).toBe("/report.pdf");
    expect(viewer.querySelector('[data-testid="fake-renderer"]')).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    expect(viewerIn(el)).toBeNull();
  });

  it("preact: <DocsViewer {...config} /> mounts and applies config", async () => {
    const el = host();
    preactRender(preactH(preactWrapper.DocsViewer, config), el);

    const viewer = await waitForViewer(el);
    expect(viewer.config?.source).toBe("/report.pdf");
  });

  it("solid: <DocsViewer {...config} /> mounts and applies config", async () => {
    const el = host();
    createSolidRoot((dispose) => {
      el.appendChild(solidWrapper.DocsViewer(config));
      return dispose;
    });

    const viewer = await waitForViewer(el);
    expect(viewer.config?.source).toBe("/report.pdf");
  });

  it("vue: <DocsViewer :config /> mounts and applies config", async () => {
    const el = host();
    createApp(vueWrapper.DocsViewer, { config }).mount(el);

    const viewer = await waitForViewer(el);
    expect(viewer.config?.source).toBe("/report.pdf");
  });

  it("svelte: use:docsViewer={config} mounts, updates and destroys", () => {
    const el = host();
    const action = svelteWrapper.docsViewer(el, config);

    // The Svelte action is synchronous: the element is present immediately.
    const viewer = viewerIn(el);
    expect(viewer).not.toBeNull();
    expect(viewer?.config?.source).toBe("/report.pdf");

    action.update({ source: "/other.pdf", preflight: false });
    expect(viewer?.config?.source).toBe("/other.pdf");

    action.destroy();
    expect(viewerIn(el)).toBeNull();
  });
});
