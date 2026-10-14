import { describe, expect, it } from "vitest";
import {
  findZipEntry,
  inflateZipEntry,
  isDirectory,
  isEncrypted,
  listZip,
} from "../core/archive/zip";
import { makeZip } from "./fixtures";

describe("listZip", () => {
  it("lists the central directory", async () => {
    const zip = await makeZip([
      { name: "a.txt", data: "AAA" },
      { name: "b.txt", data: "BBBB", method: 8 },
      { name: "dir/", data: "" },
    ]);
    const entries = listZip(zip);
    expect(entries.map((entry) => entry.name)).toEqual(["a.txt", "b.txt", "dir/"]);
    expect(entries[0]?.method).toBe(0);
    expect(entries[1]?.method).toBe(8);
    expect(isDirectory(entries[2]!)).toBe(true);
    expect(isEncrypted(entries[0]!)).toBe(false);
  });

  it("throws when there is no end-of-central-directory record", () => {
    expect(() => listZip(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer)).toThrow();
  });
});

describe("inflateZipEntry", () => {
  it("reads stored and deflated members", async () => {
    const zip = await makeZip([
      { name: "a.txt", data: "AAA" },
      { name: "b.txt", data: "BBBB", method: 8 },
    ]);
    const entries = listZip(zip);
    expect(new TextDecoder().decode(await inflateZipEntry(zip, entries[0]!))).toBe("AAA");
    expect(new TextDecoder().decode(await inflateZipEntry(zip, entries[1]!))).toBe("BBBB");
  });

  it("finds an entry tolerating a leading slash", async () => {
    const zip = await makeZip([{ name: "nested/data.txt", data: "X" }]);
    const entry = findZipEntry(listZip(zip), "/nested/data.txt");
    expect(entry?.name).toBe("nested/data.txt");
    expect(findZipEntry(listZip(zip), "missing.txt")).toBeUndefined();
  });
});
