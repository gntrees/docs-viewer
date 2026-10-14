import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveConfig } from "../core/config";
import { loadDocument } from "../core/loader";

describe("loadDocument", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("passes the source URL straight through for direct/auto loaders", async () => {
    const result = await loadDocument(resolveConfig({ source: "https://x.test/a.pdf" }));
    expect(result.displayUrl).toBe("https://x.test/a.pdf");
    expect(result.revoke).toBeUndefined();
  });

  it("fetches the bytes and hands over a blob URL for the blob loader", async () => {
    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
    const fetchSpy = vi.fn(async () => new Response(new Uint8Array([1, 2, 3])));
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await loadDocument(
      resolveConfig({ source: "https://x.test/a.bin", loader: "blob", credentials: "include" }),
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://x.test/a.bin",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(result.displayUrl).toBe("blob:mock");

    result.revoke?.();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });

  it("throws with the status when the blob fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 404, statusText: "Not Found" })),
    );

    await expect(
      loadDocument(resolveConfig({ source: "https://x.test/missing.bin", loader: "blob" })),
    ).rejects.toThrow("404 Not Found");
  });

  it("throws when no source is given", async () => {
    await expect(loadDocument(resolveConfig({}))).rejects.toThrow("No document source");
  });
});
