/**
 * Minimal TAR reader — enough to *list* an archive and *read one member*, with no
 * dependency. Handles POSIX ustar and GNU/PAX long names, GNU base-256 sizes and
 * `ustar` checksums. A `.tar.gz`/`.tgz` is gunzipped first via `DecompressionStream`.
 *
 * `.tar.bz2` / `.tar.xz` are out of scope (no platform decompressor).
 */

export interface TarMember {
  /** Full path inside the archive (forward slashes). */
  name: string;
  size: number;
  directory: boolean;
  /** Last-modified time as an ISO string, when the header carries one. */
  modified?: string;
}

const decoder = new TextDecoder();

const BLOCK = 512;

const GZIP_MAGIC = [0x1f, 0x8b];

/** Whether the buffer starts with the gzip magic bytes. */
export function isGzip(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 2) return false;
  const bytes = new Uint8Array(buffer, 0, 2);
  return GZIP_MAGIC.every((value, index) => bytes[index] === value);
}

/** Inflate a gzip stream using the platform's DecompressionStream. */
export async function gunzip(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const stream = new Blob([buffer as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  return await new Response(stream).arrayBuffer();
}

/** Decode a fixed-width header field, stopping at the first NUL. */
function text(bytes: Uint8Array): string {
  const nul = bytes.indexOf(0);
  return decoder.decode(nul === -1 ? bytes : bytes.subarray(0, nul)).trim();
}

/** Parse an octal (or GNU base-256) numeric header field. */
function numeric(bytes: Uint8Array): number {
  if (bytes.length === 0) return 0;
  if (bytes[0]! & 0x80) {
    let value = bytes[0]! & 0x7f;
    for (let i = 1; i < bytes.length; i++) value = value * 256 + bytes[i]!;
    return value;
  }
  const raw = text(bytes).trim();
  if (!raw) return 0;
  const parsed = parseInt(raw, 8);
  return Number.isFinite(parsed) ? parsed : 0;
}

const pad512 = (size: number): number => Math.ceil(size / BLOCK) * BLOCK;

/** Validate a header block's stored checksum (or its ustar magic). */
function validHeader(block: Uint8Array): boolean {
  if (block.length < BLOCK) return false;
  let sum = 0;
  for (let i = 0; i < BLOCK; i++) sum += i >= 148 && i < 156 ? 0x20 : block[i]!;
  const stored = parseInt(text(block.subarray(148, 156)).trim(), 8);
  if (sum === stored) return true;
  return text(block.subarray(257, 262)) === "ustar";
}

/** Whether the buffer looks like a TAR archive. */
export function isTar(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < BLOCK) return false;
  return validHeader(new Uint8Array(buffer, 0, BLOCK));
}

interface TarHeader {
  name: string;
  size: number;
  directory: boolean;
  modified?: string;
  /** Offset of the member's data (right after the 512-byte header). */
  dataOffset: number;
}

/** Parse the PAX extended-header payload for `key=value` records. */
function parsePax(data: Uint8Array, out: Map<string, string>): void {
  let pos = 0;
  while (pos < data.length) {
    let space = pos;
    while (space < data.length && data[space] !== 0x20) space += 1;
    const length = parseInt(decoder.decode(data.subarray(pos, space)), 10);
    if (!Number.isFinite(length) || length <= 0 || pos + length > data.length) break;
    const record = decoder.decode(data.subarray(space + 1, pos + length - 1)); // drop trailing \n
    const eq = record.indexOf("=");
    if (eq !== -1) out.set(record.slice(0, eq), record.slice(eq + 1));
    pos += length;
  }
}

/** Walk the archive, yielding each member header in order. */
function walkTar(buffer: ArrayBuffer, visit: (header: TarHeader) => void): void {
  const bytes = new Uint8Array(buffer);
  let offset = 0;
  let pendingName: string | null = null;

  while (offset + BLOCK <= bytes.length) {
    const block = bytes.subarray(offset, offset + BLOCK);
    // Two consecutive zero blocks mark the end; a single one is enough to stop.
    if (block.every((value) => value === 0)) break;

    const size = numeric(block.subarray(124, 136));
    const type = block[156] === 0 ? "0" : String.fromCharCode(block[156]!);
    const dataStart = offset + BLOCK;

    // GNU long name: the real name lives in the following data block.
    if (type === "L") {
      pendingName = text(bytes.subarray(dataStart, dataStart + size));
      offset = dataStart + pad512(size);
      continue;
    }
    // PAX extended header: `path=` overrides the name; `size=` overrides the size.
    if (type === "x") {
      const pax = new Map<string, string>();
      parsePax(bytes.subarray(dataStart, dataStart + size), pax);
      if (pax.has("path")) pendingName = pax.get("path")!;
      offset = dataStart + pad512(size);
      continue;
    }
    // Global / other metadata headers carry no member of their own.
    if (type === "g") {
      offset = dataStart + pad512(size);
      continue;
    }

    const prefix = text(block.subarray(345, 500));
    const rawName = pendingName ?? text(block.subarray(0, 100));
    pendingName = null;

    const name = prefix ? `${prefix}/${rawName}` : rawName;
    const directory = type === "5" || rawName.endsWith("/");
    const seconds = numeric(block.subarray(136, 148));
    const modified =
      seconds > 0 ? new Date(seconds * 1000).toISOString() : undefined;

    visit({ name, size, directory, modified, dataOffset: dataStart });
    offset = dataStart + pad512(size);
  }
}

/** List the members of a TAR archive. */
export function listTar(buffer: ArrayBuffer): TarMember[] {
  const members: TarMember[] = [];
  walkTar(buffer, (header) => {
    members.push({
      name: header.name,
      size: header.size,
      directory: header.directory,
      modified: header.modified,
    });
  });
  return members;
}

/** Read one member's bytes by its (normalised) path, or `undefined`. */
export function readTarEntry(buffer: ArrayBuffer, path: string): Uint8Array | undefined {
  const normalize = (value: string): string =>
    value.replace(/^\/+/, "").replace(/^\.\//, "").replace(/\/+$/, "");
  const target = normalize(path);
  const bytes = new Uint8Array(buffer);
  let found: Uint8Array | undefined;
  walkTar(buffer, (header) => {
    if (found) return;
    if (header.directory) return;
    if (normalize(header.name) !== target) return;
    found = bytes.subarray(header.dataOffset, header.dataOffset + header.size).slice();
  });
  return found;
}
