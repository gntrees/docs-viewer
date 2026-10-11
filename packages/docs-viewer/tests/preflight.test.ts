import { afterEach, describe, expect, it, vi } from "vitest";
import { preflight, probe } from "../src/core/preflight";

afterEach(() => vi.unstubAllGlobals());

describe("probe", () => {
  it("exposes the response Content-Type alongside the status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(null, {
            status: 200,
            headers: { "content-type": "application/pdf; charset=binary" },
          }),
      ),
    );
    expect(await probe("https://x.test/a.pdf")).toEqual({
      status: "ok",
      contentType: "application/pdf; charset=binary",
    });
  });

  it("omits the Content-Type when the header is absent", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
    expect(await probe("https://x.test/a.pdf")).toEqual({ status: "ok" });
  });

  it("reports fail with no header for 404", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
    expect(await probe("https://x.test/missing.pdf")).toEqual({ status: "fail" });
  });
});

describe("preflight", () => {
  it("returns fail for 404/410", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
    expect(await preflight("https://x.test/a.docx")).toBe("fail");

    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 410 })));
    expect(await preflight("https://x.test/a.docx")).toBe("fail");
  });

  it("returns ok for a reachable file", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
    expect(await preflight("https://x.test/a.docx")).toBe("ok");
  });

  it("returns unknown when the request is blocked (CORS/network)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    expect(await preflight("https://x.test/a.docx")).toBe("unknown");
  });

  it("retries with a ranged GET when HEAD is rejected", async () => {
    const methods: Array<string | undefined> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        methods.push(init?.method);
        return new Response(null, { status: init?.method === "HEAD" ? 405 : 404 });
      }),
    );
    expect(await preflight("https://x.test/a.docx")).toBe("fail");
    expect(methods).toEqual(["HEAD", undefined]);
  });
});
