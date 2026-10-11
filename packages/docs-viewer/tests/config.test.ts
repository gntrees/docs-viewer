import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, parseQuery, resolveConfig } from "../src/core/config";

describe("resolveConfig", () => {
  it("applies defaults", () => {
    const config = resolveConfig();
    expect(config.loader).toBe(DEFAULT_CONFIG.loader);
    expect(config.engine).toBe("auto");
    expect(config.preflight).toBe("auto");
    expect(config.credentials).toBe("same-origin");
    expect(config.code).toEqual({});
    expect(config.image).toEqual({ fullscreen: true });
  });

  it("merges left-to-right, later wins", () => {
    const config = resolveConfig({ engine: "iframe" }, { engine: "shiki", name: "final.pdf" });
    expect(config.engine).toBe("shiki");
    expect(config.name).toBe("final.pdf");
  });

  it("merges code config", () => {
    expect(resolveConfig({ code: { theme: "vitesse-dark" } }).code.theme).toBe("vitesse-dark");
    expect(resolveConfig().code).toEqual({});
  });

  it("merges image config", () => {
    expect(resolveConfig({ image: { fullscreen: false } }).image.fullscreen).toBe(false);
    expect(resolveConfig().image.fullscreen).toBe(true);
  });

  it("coerces the preflight setting", () => {
    expect(resolveConfig({ preflight: "false" as never }).preflight).toBe(false);
    expect(resolveConfig({ preflight: "1" as never }).preflight).toBe(true);
    expect(resolveConfig({ preflight: false }).preflight).toBe(false);
    expect(resolveConfig({ preflight: true }).preflight).toBe(true);
    expect(resolveConfig({ preflight: "auto" as never }).preflight).toBe("auto");
    expect(resolveConfig({ preflight: "" as never }).preflight).toBe("auto");
  });

  it("ignores an empty engine", () => {
    expect(resolveConfig({ engine: "" as never }).engine).toBe("auto");
  });
});

describe("parseQuery", () => {
  it("reads simple params", () => {
    const config = parseQuery("?file=/a.pdf&engine=google-docs-viewer&preflight=false");
    expect(config.source).toBe("/a.pdf");
    expect(config.engine).toBe("google-docs-viewer");
    expect(config.preflight).toBe(false);
  });

  it("accepts preflight=auto", () => {
    expect(parseQuery("?file=/a.pdf&preflight=auto").preflight).toBe("auto");
    expect(parseQuery("?file=/a.pdf&preflight=1").preflight).toBe(true);
  });

  it("accepts file, url and src aliases", () => {
    expect(parseQuery("?url=/b.pdf").source).toBe("/b.pdf");
    expect(parseQuery("?src=/c.pdf").source).toBe("/c.pdf");
  });

  it("lets simple params override the base64 config blob", () => {
    const blob = Buffer.from(JSON.stringify({ engine: "iframe", loader: "blob" })).toString(
      "base64url",
    );
    const config = parseQuery(`?config=${blob}&engine=shiki&file=/x.pdf`);
    expect(config.engine).toBe("shiki");
    expect(config.loader).toBe("blob");
    expect(config.source).toBe("/x.pdf");
  });

  it("ignores malformed config blobs", () => {
    const config = parseQuery("?config=%%%not-base64%%%&file=/y.pdf");
    expect(config.source).toBe("/y.pdf");
    expect(config.engine).toBeUndefined();
  });
});
