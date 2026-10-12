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

/** How long a single probe request may take before it is treated as `"unknown"`. */
export const PROBE_TIMEOUT_MS = 4000;

/**
 * `fetch` bounded by `ms` (and the caller's signal). Some hosts never answer a
 * `HEAD` (they accept the connection and stall), so without a timeout a probe
 * could hang the whole load.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  signal: AbortSignal | undefined,
  ms: number,
): Promise<Response> {
  const controller = new AbortController();
  const abort = (): void => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", abort, { once: true });
  }
  const timer = setTimeout(abort, ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

/**
 * Probe a file before rendering.
 *
 * Uses a CORS `HEAD` request: a definitive **404/410** reports `"fail"` so the
 * viewer can stop immediately instead of mounting a renderer that cannot work.
 * CORS-blocked and network errors report `"unknown"` — they cannot be told apart
 * from a missing file — so rendering still proceeds. When the server rejects
 * `HEAD` (405/501), it retries with a 1-byte ranged `GET`. A request that does
 * not answer within {@link PROBE_TIMEOUT_MS} is abandoned and treated as
 * `"unknown"`.
 *
 * The response `Content-Type` is returned alongside the status so callers can use
 * it for file-type detection (see `type: "auto"`).
 */
export async function probe(url: string, signal?: AbortSignal): Promise<ProbeResult> {
  try {
    const head = await fetchWithTimeout(
      url,
      { method: "HEAD", redirect: "follow" },
      signal,
      PROBE_TIMEOUT_MS,
    );
    if (isMissing(head.status)) return { status: "fail" };
    const contentType = head.headers.get("content-type") ?? undefined;
    if (head.status === 405 || head.status === 501) {
      // Some servers reject HEAD; retry with a 1-byte ranged GET.
      const ranged = await fetchWithTimeout(
        url,
        { headers: { Range: "bytes=0-0" }, redirect: "follow" },
        signal,
        PROBE_TIMEOUT_MS,
      );
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
