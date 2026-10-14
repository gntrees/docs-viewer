import { describe, expect, it } from "vitest";
import { readFontMeta } from "../core/truetype";
import { makeSfntFont } from "./fixtures";

describe("readFontMeta", () => {
  it("reads Family/Subfamily/unitsPerEm from an sfnt", async () => {
    const meta = await readFontMeta(
      makeSfntFont({ family: "Test Family", subfamily: "Bold", unitsPerEm: 2048 }),
    );
    expect(meta).toMatchObject({
      family: "Test Family",
      subfamily: "Bold",
      unitsPerEm: 2048,
      flavor: "sfnt",
    });
  });

  it("returns null for non-font data", async () => {
    expect(await readFontMeta(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer)).toBeNull();
    expect(await readFontMeta(new ArrayBuffer(2))).toBeNull();
  });
});
