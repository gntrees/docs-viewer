import { afterEach, describe, expect, it, vi } from "vitest";
import { extractArchiveEntry, listArchive } from "../src/core/archive";
import { resolveConfig } from "../src/core/config";
import type { RenderContext } from "../src/core/types";
import { defineDocsViewer } from "../src/element";
import { archiveRenderer } from "../src/renderers/archive";
import { gzip, makeTar, makeZip } from "./fixtures";

describe("listArchive", () => {
  it("lists ZIP entries with a normalised shape", async () => {
    const zip = await makeZip([
      { name: "hello.txt", data: "Hello" },
      { name: "folder/", data: "" },
      { name: "nested/data.txt", data: "Nested", method: 8 },
    ]);
    const { format, entries } = await listArchive(zip);
    expect(format).toBe("zip");
    expect(entries.map((entry) => entry.name)).toEqual(["hello.txt", "folder", "nested/data.txt"]);
    expect(entries[1]?.directory).toBe(true);
    expect(entries[0]?.method).toBe("store");
    expect(entries[2]?.method).toBe("deflate");
  });

  it("rejects a non-archive buffer", async () => {
    await expect(listArchive(new Uint8Array([1, 2, 3, 4]).buffer)).rejects.toThrow();
  });

  it("drops path-traversal segments but keeps lone dot names", async () => {
    const zip = await makeZip([
      { name: "ok.txt", data: "ok" },
      { name: "../evil.txt", data: "no" },
      { name: ".", data: "" },
      { name: "..", data: "" },
      { name: "a/../b.txt", data: "no" },
      { name: "...legit.txt", data: "keep" },
    ]);
    const { entries } = await listArchive(zip);
    // `.`/`..` are member names here, not navigation; only traversal *segments*
    // (e.g. `../evil.txt`, `a/../b.txt`) are dropped.
    expect(entries.map((entry) => entry.name)).toEqual(["ok.txt", ".", "..", "...legit.txt"]);
  });

  it("keeps a backslash as a literal filename character", async () => {
    const zip = await makeZip([{ name: "Backslash1\\", data: "x" }]);
    const { entries } = await listArchive(zip);
    expect(entries.map((entry) => entry.name)).toEqual(["Backslash1\\"]);
  });

  it("lists TAR entries with a normalised shape", async () => {
    const tar = makeTar([
      { name: "hello.txt", data: "Hello" },
      { name: "dir", directory: true },
      { name: "dir/nested.txt", data: "Nested" },
    ]);
    const { format, entries } = await listArchive(tar);
    expect(format).toBe("tar");
    expect(entries.map((entry) => entry.name)).toEqual(["hello.txt", "dir", "dir/nested.txt"]);
    expect(entries[1]?.directory).toBe(true);
    expect(entries[2]?.method).toBe("store");
  });

  it("lists a gzipped TAR (.tar.gz)", async () => {
    const gz = await gzip(makeTar([{ name: "a.txt", data: "A" }]));
    const { format, entries } = await listArchive(gz);
    expect(format).toBe("tar.gz");
    expect(entries.map((entry) => entry.name)).toEqual(["a.txt"]);
  });
});

describe("extractArchiveEntry", () => {
  it("extracts a member by path", async () => {
    const zip = await makeZip([{ name: "nested/data.txt", data: "Nested", method: 8 }]);
    const { bytes, name } = await extractArchiveEntry(zip, "nested/data.txt");
    expect(name).toBe("data.txt");
    expect(new TextDecoder().decode(bytes)).toBe("Nested");
  });

  it("throws for a missing member", async () => {
    const zip = await makeZip([{ name: "a.txt", data: "A" }]);
    await expect(extractArchiveEntry(zip, "missing.txt")).rejects.toThrow();
  });

  it("extracts through nested archives", async () => {
    const inner = await makeZip([{ name: "deep.txt", data: "Deep", method: 8 }]);
    const outer = await makeZip([{ name: "inner.zip", data: new Uint8Array(inner) }]);
    const { bytes, name } = await extractArchiveEntry(outer, "inner.zip/deep.txt");
    expect(name).toBe("deep.txt");
    expect(new TextDecoder().decode(bytes)).toBe("Deep");
  });

  it("extracts a member from a TAR (incl. a nested zip)", async () => {
    const inner = await makeZip([{ name: "deep.txt", data: "Deep" }]);
    const tar = makeTar([
      { name: "plain.txt", data: "Plain" },
      { name: "inner.zip", data: new Uint8Array(inner) },
    ]);
    const plain = await extractArchiveEntry(tar, "plain.txt");
    expect(new TextDecoder().decode(plain.bytes)).toBe("Plain");
    const nested = await extractArchiveEntry(tar, "inner.zip/deep.txt");
    expect(nested.name).toBe("deep.txt");
    expect(new TextDecoder().decode(nested.bytes)).toBe("Deep");
  });

  it("extracts a member from a gzipped TAR", async () => {
    const gz = await gzip(makeTar([{ name: "a.txt", data: "A" }]));
    const { bytes, name } = await extractArchiveEntry(gz, "a.txt");
    expect(name).toBe("a.txt");
    expect(new TextDecoder().decode(bytes)).toBe("A");
  });
});

describe("archiveRenderer", () => {
  defineDocsViewer();

  const flush = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  const response = (buffer: ArrayBuffer, headers: Record<string, string> = {}): Response =>
    ({
      ok: true,
      status: 200,
      statusText: "OK",
      arrayBuffer: async () => buffer,
      headers: new Headers(headers),
    }) as unknown as Response;

  function mount(buffer: ArrayBuffer, entry?: string): HTMLElement {
    const container = document.createElement("div");
    document.body.appendChild(container);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: unknown, init?: RequestInit) =>
        init?.method === "HEAD"
          ? response(new ArrayBuffer(0), { "content-length": "2048" })
          : response(buffer),
      ),
    );
    const source = "https://example.test/archive.zip";
    const ctx: RenderContext = {
      displayUrl: source,
      source,
      name: "archive.zip",
      mime: "application/zip",
      ext: "zip",
      kind: "archive",
      config: resolveConfig({ source, entry }),
    };
    archiveRenderer.mount(container, ctx);
    return container;
  }

  const links = (container: HTMLElement): string[] =>
    [...container.querySelectorAll(".gnt-dv-archive-link")].map((node) => node.textContent ?? "");

  const linkFor = (container: HTMLElement, name: string): HTMLButtonElement => {
    const found = [...container.querySelectorAll<HTMLButtonElement>(".gnt-dv-archive-link")].find(
      (node) => node.textContent === name,
    );
    if (!found) throw new Error(`no link named ${name}`);
    return found;
  };

  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it("opens the listing when the closed archive is clicked", async () => {
    const zip = await makeZip([
      { name: "hello.txt", data: "Hello" },
      { name: "folder/", data: "" },
      { name: "folder/inner.txt", data: "x" },
    ]);
    const container = mount(zip);
    await flush();

    expect(links(container)).toEqual(["archive.zip"]);
    linkFor(container, "archive.zip").click();
    await flush();

    // Folders sort first.
    expect(links(container)).toEqual(["folder", "hello.txt"]);
  });

  it("keeps the header and column heads for an empty archive", async () => {
    const container = mount(await makeZip([]));
    await flush();
    linkFor(container, "archive.zip").click();
    await flush();

    expect(container.querySelector(".gnt-dv-archive-head")).not.toBeNull();
    const heads = [...container.querySelectorAll(".gnt-dv-table-grid thead th")].map(
      (node) => node.textContent ?? "",
    );
    expect(heads).toEqual(["Name", "Last modified", "Size"]);
    expect(container.querySelector(".gnt-dv-archive-empty")?.textContent).toContain("empty");
  });

  it("drills into a nested archive and previews a file in place", async () => {
    const inner = await makeZip([{ name: "deep.txt", data: "Deep" }]);
    const outer = await makeZip([
      { name: "inner.zip", data: new Uint8Array(inner) },
      { name: "note.bin", data: "hi" },
    ]);
    const container = mount(outer);
    await flush();
    linkFor(container, "archive.zip").click();
    await flush();

    linkFor(container, "inner.zip").click();
    await flush();
    const crumbs = [...container.querySelectorAll(".gnt-dv-archive-crumb")].map(
      (node) => node.textContent ?? "",
    );
    expect(crumbs).toContain("inner.zip");
    expect(links(container)).toEqual(["deep.txt"]);

    // Back to the outer listing, then preview a file in the same page.
    container.querySelector<HTMLButtonElement>(".gnt-dv-archive-back")!.click();
    await flush();
    linkFor(container, "note.bin").click();
    await flush();

    const nested = container.querySelector<HTMLElement & { config?: { name?: string } }>(
      "gnt-docs-viewer",
    );
    expect(nested).not.toBeNull();
    expect(nested?.config?.name).toBe("note.bin");
  });

  it("renders a deep-linked entry with the archive path and a nested viewer", async () => {
    const zip = await makeZip([
      { name: "folder/deep.txt", data: "Deep" },
      { name: "top.bin", data: "x" },
    ]);
    const container = mount(zip, "folder/deep.txt");
    await flush();

    const crumbs = [...container.querySelectorAll(".gnt-dv-archive-crumb")].map(
      (node) => node.textContent ?? "",
    );
    expect(crumbs).toContain("folder");
    expect(crumbs).toContain("deep.txt");
    expect(container.querySelector("gnt-docs-viewer")).not.toBeNull();
  });

  it("builds a correct deep link (no duplicated folder) for a member in a folder", async () => {
    const zip = await makeZip([{ name: "docs/notes.txt", data: "hi" }]);
    const container = mount(zip);
    await flush();
    linkFor(container, "archive.zip").click();
    await flush();
    linkFor(container, "docs").click();
    await flush();
    linkFor(container, "notes.txt").click();
    await flush();

    const link = container.querySelector<HTMLAnchorElement>(".gnt-dv-archive-action");
    expect(link).not.toBeNull();
    const entry = new URL(link!.href).searchParams.get("entry");
    expect(entry).toBe("docs/notes.txt");
  });

  it("offers a download instead of an inline preview for office members", async () => {
    const zip = await makeZip([{ name: "report.docx", data: "x" }]);
    const container = mount(zip);
    await flush();
    linkFor(container, "archive.zip").click();
    await flush();
    linkFor(container, "report.docx").click();
    await flush();

    expect(container.querySelector("gnt-docs-viewer")).toBeNull();
    expect(container.querySelector(".gnt-dv-archive-gate")?.textContent).toContain(
      "can't be previewed",
    );
  });
});
