import { describe, expect, it } from "vitest";
import { resolveConfig } from "../core/config";
import type { RenderContext } from "../types/types";
import {
  googleDocsViewerRenderer,
  googleViewerUrl,
  microsoftDocsViewerRenderer,
  microsoftViewerUrl,
} from "../renderer/remote";

const source = "https://files.test/report.docx";

function context(kind: RenderContext["kind"]): RenderContext {
  return {
    displayUrl: source,
    source,
    name: "report.docx",
    mime: "",
    ext: "",
    kind,
    config: resolveConfig(),
  };
}

describe("remote viewer URLs", () => {
  it("builds Microsoft and Google URLs with an encoded source", () => {
    expect(microsoftViewerUrl(source)).toBe(
      `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(source)}`,
    );
    expect(googleViewerUrl(source)).toBe(
      `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(source)}`,
    );
  });
});

describe("remote renderers", () => {
  it("advertises engine names and the public-URL requirement", () => {
    expect(microsoftDocsViewerRenderer.engine).toBe("microsoft-docs-viewer");
    expect(googleDocsViewerRenderer.engine).toBe("google-docs-viewer");
    expect(microsoftDocsViewerRenderer.requiresPublicUrl).toBe(true);
    expect(googleDocsViewerRenderer.requiresPublicUrl).toBe(true);
  });

  it("matches the kinds each viewer supports", () => {
    expect(microsoftDocsViewerRenderer.match(context("office"))).toBe(true);
    expect(microsoftDocsViewerRenderer.match(context("image"))).toBe(false);

    expect(googleDocsViewerRenderer.match(context("office"))).toBe(true);
    expect(googleDocsViewerRenderer.match(context("image"))).toBe(true);
    expect(googleDocsViewerRenderer.match(context("pdf"))).toBe(true);
    expect(googleDocsViewerRenderer.match(context("table"))).toBe(true);
    expect(googleDocsViewerRenderer.match(context("font"))).toBe(true);
    expect(googleDocsViewerRenderer.match(context("archive"))).toBe(true);
    expect(googleDocsViewerRenderer.match(context("audio"))).toBe(false);
  });

  it("does not match a non-absolute source", () => {
    const relative = {
      ...context("office"),
      source: "/report.docx",
      displayUrl: "/report.docx",
    };
    expect(microsoftDocsViewerRenderer.match(relative)).toBe(false);
    expect(googleDocsViewerRenderer.match(relative)).toBe(false);
  });

  it("orders Microsoft before Google", () => {
    expect(microsoftDocsViewerRenderer.priority ?? 0).toBeGreaterThan(
      googleDocsViewerRenderer.priority ?? 0,
    );
  });

  it("mounts the iframe at the built URL and cleans up", () => {
    const container = document.createElement("div");
    const instance = microsoftDocsViewerRenderer.mount(container, context("office"));
    expect(container.querySelector("iframe")?.getAttribute("src")).toContain(
      "officeapps.live.com",
    );
    instance.destroy();
    expect(container.querySelector("iframe")).toBeNull();
  });
});
