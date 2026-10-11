import { describe, expect, it } from "vitest";
import {
  detect,
  extFromName,
  fileNameFromUrl,
  kindFromExt,
  kindFromMime,
  normalizeContentType,
} from "../src/core/detect";

describe("detect", () => {
  it("detects by extension", () => {
    expect(detect("report.pdf", undefined)).toMatchObject({ kind: "pdf", ext: "pdf" });
    expect(detect("pic.JPG", undefined).kind).toBe("image");
    expect(detect("notes.docx", undefined).kind).toBe("office");
    expect(detect("data.csv", undefined).kind).toBe("table");
    expect(detect("notes.txt", undefined).kind).toBe("text");
    expect(detect("clip.mp4", undefined).kind).toBe("video");
    expect(detect("song.mp3", undefined).kind).toBe("audio");
    expect(detect("blob.xyz", undefined).kind).toBe("unknown");
  });

  it("treats source-code extensions as text", () => {
    for (const name of ["script.py", "main.go", "lib.rs", "run.sh", "app.ts"]) {
      expect(detect(name, undefined).kind).toBe("text");
    }
  });

  it("treats other code languages as text (beyond the playground list)", () => {
    for (const name of [
      "main.rb",
      "App.java",
      "index.php",
      "main.swift",
      "Main.kt",
      "Program.cs",
      "styles.scss",
      "App.vue",
      "Widget.svelte",
      "query.sql",
      "script.lua",
      "plot.r",
      "run.bash",
    ]) {
      expect(detect(name, undefined).kind).toBe("text");
    }
  });

  it("respects an explicit type override", () => {
    expect(detect(undefined, "application/pdf")).toMatchObject({ kind: "pdf", ext: "pdf" });
    expect(detect("file.bin", "docx")).toMatchObject({ kind: "office", ext: "docx" });
    expect(detect("file.bin", ".pdf")).toMatchObject({ kind: "pdf", ext: "pdf" });
  });

  it("locks a kind from a dropdown alias", () => {
    expect(detect("file.bin", "image")).toMatchObject({ kind: "image", mime: "image/png" });
    expect(detect("file.bin", "video")).toMatchObject({ kind: "video" });
    expect(detect("file.bin", "audio")).toMatchObject({ kind: "audio" });
    expect(detect("file.bin", "text")).toMatchObject({ kind: "text" });
    expect(detect("file.bin", "code")).toMatchObject({ kind: "text" });
    expect(detect("file.bin", "pdf")).toMatchObject({ kind: "pdf", mime: "application/pdf" });
    // Office sub-types all resolve to the `office` kind but keep a specific MIME.
    expect(detect("file.bin", "word")).toMatchObject({ kind: "office" });
    expect(detect("file.bin", "excel").mime).toContain("spreadsheetml");
    expect(detect("file.bin", "powerpoint").mime).toContain("presentationml");
    expect(detect("file.bin", "office")).toMatchObject({ kind: "office" });
  });

  it("keeps a URL MIME that matches the locked kind", () => {
    // `type=image` on a `.jpg` keeps image/jpeg rather than the image/png default.
    expect(detect("photo.jpg", "image")).toMatchObject({ kind: "image", mime: "image/jpeg" });
    // Office sub-types share the `office` kind, so a URL MIME of the same kind is
    // kept; an unrelated URL falls back to the alias representative.
    expect(detect("slides.pptx", "word")).toMatchObject({ kind: "office" });
    expect(detect("slides.pptx", "word").mime).toContain("presentationml");
    expect(detect("file.bin", "word").mime).toContain("wordprocessingml");
    // `type=code` keeps the extension so Shiki still infers the language.
    expect(detect("main.rs", "code")).toMatchObject({ kind: "text", ext: "rs" });
  });

  it("locks a kind from a MIME family wildcard", () => {
    expect(detect("file.bin", "image/*")).toMatchObject({ kind: "image", mime: "image/png" });
    expect(detect("clip.gif", "image/*")).toMatchObject({ kind: "image", mime: "image/gif" });
    expect(detect("file.bin", "video/*")).toMatchObject({ kind: "video" });
    expect(detect("file.bin", "audio/*")).toMatchObject({ kind: "audio" });
    expect(detect("file.bin", "text/*")).toMatchObject({ kind: "text" });
  });

  it("lets an exact MIME override beat the URL extension", () => {
    // A `.txt` URL locked as a PDF is treated as a PDF.
    expect(detect("notes.txt", "application/pdf")).toMatchObject({
      kind: "pdf",
      mime: "application/pdf",
    });
  });

  it("maps csv/tsv/tab to the table kind", () => {
    expect(detect("data.csv", undefined)).toMatchObject({ kind: "table", mime: "text/csv" });
    expect(detect("data.tsv", undefined).kind).toBe("table");
    expect(detect("data.tab", undefined).kind).toBe("table");
    expect(detect("file", undefined, "text/csv")).toMatchObject({ kind: "table", ext: "csv" });
    expect(detect("file", undefined, "text/tab-separated-values").kind).toBe("table");
  });

  it("refines a generic text/plain mime with a tabular extension", () => {
    // raw.githubusercontent serves CSV as `text/plain`; the extension refines it.
    expect(detect("data.csv", undefined, "text/plain")).toMatchObject({
      kind: "table",
      ext: "csv",
    });
    // An explicit `type: "text"` lock is respected…
    expect(detect("data.csv", "text").kind).toBe("text");
    // …and a more specific mime still wins over the extension.
    expect(detect("data.csv", undefined, "text/html").kind).toBe("text");
  });

  it("locks the table kind from an alias", () => {
    expect(detect("file.bin", "table")).toMatchObject({ kind: "table", mime: "text/csv" });
    expect(detect("file.bin", "csv")).toMatchObject({ kind: "table", mime: "text/csv" });
  });

  it("maps Google-only formats to their domain kinds", () => {
    for (const [name, kind] of [
      ["a.psd", "image"],
      ["a.dxf", "image"],
      ["a.ai", "image"],
      ["a.eps", "image"],
      ["a.ps", "image"],
      ["a.xps", "image"],
      ["a.ttf", "font"],
      ["a.zip", "archive"],
      ["a.rar", "archive"],
      ["a.pages", "office"],
    ] as const) {
      expect(detect(name, undefined).kind).toBe(kind);
    }
  });

  it("maps Google-only MIME types", () => {
    expect(detect("file", undefined, "application/postscript").kind).toBe("image");
    expect(detect("file", undefined, "image/vnd.adobe.photoshop").kind).toBe("image");
    expect(detect("file", undefined, "application/vnd.ms-xpsdocument").kind).toBe("image");
    expect(detect("file", undefined, "font/ttf").kind).toBe("font");
    expect(detect("file", undefined, "application/zip").kind).toBe("archive");
    expect(detect("file", undefined, "application/vnd.apple.pages").kind).toBe("office");
  });

  it("refines other generic mimes from the extension", () => {
    // Hosts commonly serve DXF/PSD/TTF/ZIP as text/plain or octet-stream.
    expect(detect("plan.dxf", undefined, "text/plain")).toMatchObject({ kind: "image" });
    expect(detect("art.psd", undefined, "application/octet-stream")).toMatchObject({
      kind: "image",
    });
    expect(detect("font.ttf", undefined, "application/octet-stream")).toMatchObject({
      kind: "font",
    });
    expect(detect("pack.zip", undefined, "application/octet-stream")).toMatchObject({
      kind: "archive",
    });
    // A deliberate text lock is still respected.
    expect(detect("plan.dxf", "text").kind).toBe("text");
  });

  it("prefers an authoritative mime hint over a misleading extension", () => {
    // A `.png` URL that is really a PDF is detected as a PDF.
    expect(detect("a.png", undefined, "application/pdf")).toMatchObject({
      kind: "pdf",
      mime: "application/pdf",
    });
  });

  it("keeps the URL extension for the code-language hint", () => {
    // Servers often send text/plain for source files; keep `.py` for Shiki.
    expect(detect("script.py", undefined, "text/plain")).toMatchObject({
      kind: "text",
      ext: "py",
    });
  });

  it("derives an extension from the mime when the URL has none", () => {
    expect(detect("download", undefined, "application/pdf")).toMatchObject({
      kind: "pdf",
      ext: "pdf",
    });
  });

  it("ignores query strings and paths when reading the extension", () => {
    expect(extFromName("a/b/file.pdf?x=1")).toBe("pdf");
    expect(extFromName("no-extension")).toBe("");
  });

  it("derives a filename from a URL", () => {
    expect(fileNameFromUrl(undefined)).toBe("document");
    expect(fileNameFromUrl("https://x.test/dir/report.pdf")).toBe("report.pdf");
    expect(fileNameFromUrl("/a%20b/c.png")).toBe("c.png");
  });

  it("maps kinds from mime and extension", () => {
    expect(kindFromMime("application/pdf")).toBe("pdf");
    expect(kindFromMime("image/webp")).toBe("image");
    expect(kindFromMime("application/vnd.ms-excel")).toBe("office");
    expect(kindFromMime("application/json")).toBe("text");
    expect(kindFromExt("pptx")).toBe("office");
    expect(kindFromExt("nope")).toBe("unknown");
  });

  it("normalises a Content-Type header down to its bare mime type", () => {
    expect(normalizeContentType("application/pdf; charset=binary")).toBe("application/pdf");
    expect(normalizeContentType("  Text/HTML ; charset=UTF-8")).toBe("text/html");
    expect(normalizeContentType(undefined)).toBe("");
    expect(normalizeContentType(null)).toBe("");
  });
});
