import type { ResolvedConfig } from "./types";

export interface LoadedDocument {
  /** URL to hand to the renderer. */
  displayUrl: string;
  /** Call when the document is replaced/unmounted to release resources. */
  revoke?: () => void;
}

/**
 * Resolve the URL a renderer should display.
 *
 * `direct` (the default) passes the original URL straight through, which avoids
 * CORS entirely and is the only mode that works with the remote iframe viewers.
 * `blob` fetches the bytes (requires CORS on the file host) and is useful when
 * the source URL is short-lived or must not be exposed to a third party.
 */
export async function loadDocument(
  config: ResolvedConfig,
  signal?: AbortSignal,
): Promise<LoadedDocument> {
  const source = config.source;
  if (!source) throw new Error("No document source was provided.");

  if (config.loader !== "blob") {
    return { displayUrl: source };
  }

  const response = await fetch(source, {
    credentials: config.credentials,
    signal,
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`.trim());
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  return {
    displayUrl: objectUrl,
    revoke: () => URL.revokeObjectURL(objectUrl),
  };
}
