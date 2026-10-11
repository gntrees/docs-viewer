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
    expect(detect("data.csv", undefined).kind).toBe("text");
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
