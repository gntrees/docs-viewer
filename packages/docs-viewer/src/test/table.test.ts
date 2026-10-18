import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveConfig } from "../core/config";
import type { RenderContext } from "../types/types";
import { parseDelimited, parseTable, sniffDelimiter, tableRenderer } from "../renderer/table";

describe("sniffDelimiter", () => {
  it("detects the delimiter from the first line", () => {
    expect(sniffDelimiter("a,b,c\n1,2,3")).toBe(",");
    expect(sniffDelimiter("a\tb\tc\n1\t2\t3")).toBe("\t");
    expect(sniffDelimiter("a;b;c\n1;2;3")).toBe(";");
    expect(sniffDelimiter("a|b|c\n1|2|3")).toBe("|");
  });

  it("defaults to comma when there is no delimiter", () => {
    expect(sniffDelimiter("hello world")).toBe(",");
  });

  it("ignores delimiters inside quotes", () => {
    expect(sniffDelimiter('"a,b,c";x;y')).toBe(";");
  });

  it("scans past comment lines to find the delimiter", () => {
    expect(sniffDelimiter("# Name: cars\n# Source: x\nmodel\tmpg\nA\t1")).toBe("\t");
  });
});

describe("parseDelimited", () => {
  it("parses simple rows", () => {
    expect(parseDelimited("a,b\n1,2", ",")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles quoted fields with embedded delimiters, newlines and escaped quotes", () => {
    const text = 'a,"b,c","d""e"\n1,"x\ny",2';
    expect(parseDelimited(text, ",")).toEqual([
      ["a", "b,c", 'd"e'],
      ["1", "x\ny", "2"],
    ]);
  });

  it("handles CRLF and CR line endings", () => {
    expect(parseDelimited("a,b\r\n1,2\r3,4", ",")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });
});

describe("parseTable", () => {
  it("splits a header from the body and strips a BOM", () => {
    const { header, body } = parseTable("\uFEFFa,b\n1,2\n3,4");
    expect(header).toEqual(["a", "b"]);
    expect(body).toEqual([
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("picks the delimiter from the first line", () => {
    const { header, body } = parseTable("a\tb\n1\t2");
    expect(header).toEqual(["a", "b"]);
    expect(body).toEqual([["1", "2"]]);
  });

  it("drops blank lines", () => {
    const { body } = parseTable("a,b\n\n1,2\n\n");
    expect(body).toEqual([["1", "2"]]);
  });

  it("skips a leading comment/blank preamble", () => {
    const { header, body } = parseTable(
      "# Name: Motor Trend Car Road Tests\n# Source: x\n\nmodel\tmpg\nMazda\t21",
    );
    expect(header).toEqual(["model", "mpg"]);
    expect(body).toEqual([["Mazda", "21"]]);
  });

  it("returns an empty header for empty input", () => {
    expect(parseTable("").header).toEqual([]);
  });
});

describe("tableRenderer", () => {
  afterEach(() => vi.unstubAllGlobals());

  function context(): RenderContext {
    return {
      displayUrl: "https://x.test/a.csv",
      source: "https://x.test/a.csv",
      name: "a.csv",
      mime: "text/csv",
      ext: "csv",
      kind: "table",
      config: resolveConfig(),
    };
  }

  it("shows a bar with the file name and toggles between table and source", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("a,b\n1,2\n")));
    const container = document.createElement("div");
    const instance = tableRenderer.mount(container, context());

    await vi.waitFor(() => {
      expect(container.querySelector("table.gnt-dv-table-grid")).not.toBeNull();
    });

    // The bar links to the file and its content-copy is enabled once loaded.
    expect(container.querySelector("a.gnt-dv-bar-name")?.getAttribute("href")).toBe(
      "https://x.test/a.csv",
    );
    const copy = container.querySelector<HTMLButtonElement>(
      '.gnt-dv-bar-btn[aria-label="Copy content"]',
    );
    expect(copy?.disabled).toBe(false);

    const toggle = container.querySelector<HTMLButtonElement>(".gnt-dv-bar-btn[data-mode]");
    expect(toggle?.dataset.mode).toBe("rendered");

    toggle?.click();
    expect(container.querySelector("table.gnt-dv-table-grid")).toBeNull();
    expect(container.querySelector("pre.gnt-dv-text")?.textContent).toContain("a,b");
    expect(toggle?.dataset.mode).toBe("source");

    // The source view is Shiki-highlighted, matching the text/code renderer.
    await vi.waitFor(
      () => {
        expect(container.querySelector(".gnt-dv-code-block pre.shiki")).not.toBeNull();
      },
      { timeout: 5000 },
    );
    expect(container.querySelector(".gnt-dv-code-block pre.shiki")?.innerHTML).toContain("a,b");

    toggle?.click();
    expect(container.querySelector("table.gnt-dv-table-grid")).not.toBeNull();

    instance.destroy();
  });
});
