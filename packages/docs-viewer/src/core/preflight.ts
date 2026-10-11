export type PreflightResult = "ok" | "fail" | "unknown";

/** Rich result of a reachability probe, including the response `Content-Type`. */
export interface ProbeResult {
  status: PreflightResult;
  /**
   * The response `Content-Type` header, when the server exposed it. `Content-Type`
   * is a CORS-safelisted *response* header, so it is readable even cross-origin —
   * but a CORS-blocked or network error yields no header at all (`undefined`).
   */
  contentType?: string;
}

const isMissing = (status: number): boolean => status === 404 || status === 410;

/**
 * Probe a file before rendering.
 *
 * Uses a CORS `HEAD` request: a definitive **404/410** reports `"fail"` so the
 * viewer can stop immediately instead of mounting a renderer that cannot work.
 * CORS-blocked and network errors report `"unknown"` — they cannot be told apart
 * from a missing file — so rendering still proceeds. When the server rejects
 * `HEAD` (405/501), it retries with a 1-byte ranged `GET`.
 *
 * The response `Content-Type` is returned alongside the status so callers can use
 * it for file-type detection (see `type: "auto"`).
 */
export async function probe(url: string, signal?: AbortSignal): Promise<ProbeResult> {
  try {
    const head = await fetch(url, { method: "HEAD", signal, redirect: "follow" });
    if (isMissing(head.status)) return { status: "fail" };
    const contentType = head.headers.get("content-type") ?? undefined;
    if (head.status === 405 || head.status === 501) {
      // Some servers reject HEAD; retry with a 1-byte ranged GET.
      const ranged = await fetch(url, {
        headers: { Range: "bytes=0-0" },
        signal,
        redirect: "follow",
      });
      if (isMissing(ranged.status)) return { status: "fail" };
      return { status: "ok", contentType: ranged.headers.get("content-type") ?? contentType };
    }
    return { status: "ok", contentType };
  } catch {
    return { status: "unknown" };
  }
}

/**
 * Backwards-compatible wrapper around {@link probe} that returns only the status.
 */
export async function preflight(url: string, signal?: AbortSignal): Promise<PreflightResult> {
  return (await probe(url, signal)).status;
}
