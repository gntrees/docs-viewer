import { afterEach, describe, expect, it } from "vitest";
import { parseQuery } from "../src/core/config";
import { DocsViewerElement } from "../src/element";
import { runStandalone } from "../src/standalone";

describe("runStandalone", () => {
  afterEach(() => document.body.replaceChildren());

  it("mounts a viewer driven by the query string into an explicit target", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);

    const search = "?file=/docs/report.pdf&engine=iframe";
    const viewer = runStandalone({ target, search });

    expect(viewer).toBeInstanceOf(DocsViewerElement);
    expect(viewer.config).toEqual(parseQuery(search));
    expect(target.contains(viewer)).toBe(true);
    // An empty target gets a default full-height container.
    expect(target.style.height).toBe("100%");
  });

  it("falls back to a [data-gnt-viewer] mount point", () => {
    const marked = document.createElement("div");
    marked.setAttribute("data-gnt-viewer", "");
    document.body.appendChild(marked);

    const viewer = runStandalone({ search: "?file=/a.pdf" });

    expect(marked.contains(viewer)).toBe(true);
  });
});
