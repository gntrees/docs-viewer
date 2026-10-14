/**
 * Minimal ZIP reader — enough to *list* an archive and *inflate one entry*,
 * without any dependency. Reads the central directory (the authoritative index),
 * so it works even when the archive has a prefix/data descriptor. ZIP64 and
 * encryption are out of scope (flagged, not decoded).
 */

export interface ZipEntry {
  /** Full path inside the archive (forward slashes). */
  name: string;
  /** Compression method (0 = stored, 8 = deflate). */
  method: number;
  /** Raw general-purpose flags (bit 0 marks encryption). */
  flags: number;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  /** MS-DOS date/time fields (as stored). */
  modTime: number;
  modDate: number;
  /** Offset of the local file header. */
  localOffset: number;
}

const EOCD_SIG = 0x06054b50;
const CDH_SIG = 0x02014b50;
const LFH_SIG = 0x04034b50;

export const isZip = (buffer: ArrayBuffer): boolean => {
  const view = new DataView(buffer);
  if (buffer.byteLength < 4) return false;
  const sig = view.getUint32(0, true);
  return sig === LFH_SIG || sig === EOCD_SIG;
};

/** Locate the End Of Central Directory record (scanning back over any comment). */
function findEocd(view: DataView): number {
  const min = Math.max(0, view.byteLength - 22 - 0xffff);
  for (let i = view.byteLength - 22; i >= min; i--) {
    if (view.getUint32(i, true) === EOCD_SIG) return i;
  }
  return -1;
}

/** Read the central directory into a flat list of entries. */
export function listZip(buffer: ArrayBuffer): ZipEntry[] {
  const view = new DataView(buffer);
  const eocd = findEocd(view);
  if (eocd < 0) throw new Error("Not a ZIP archive (no end-of-central-directory record).");

  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const entries: ZipEntry[] = [];

  for (let i = 0; i < count; i++) {
    if (offset + 46 > view.byteLength || view.getUint32(offset, true) !== CDH_SIG) break;
    const nameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    const nameBytes = new Uint8Array(buffer, offset + 46, nameLen);
    entries.push({
      name: decoder.decode(nameBytes),
      flags: view.getUint16(offset + 8, true),
      method: view.getUint16(offset + 10, true),
      modTime: view.getUint16(offset + 12, true),
      modDate: view.getUint16(offset + 14, true),
      crc32: view.getUint32(offset + 16, true),
      compressedSize: view.getUint32(offset + 20, true),
      uncompressedSize: view.getUint32(offset + 24, true),
      localOffset: view.getUint32(offset + 42, true),
    });
    offset += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/** Whether an entry is a directory (path ends with `/`). */
export const isDirectory = (entry: ZipEntry): boolean => entry.name.endsWith("/");

/** Whether an entry is encrypted (bit 0 of the general-purpose flags). */
export const isEncrypted = (entry: ZipEntry): boolean => (entry.flags & 0x1) !== 0;

/** Inflate a raw deflate stream using the platform's DecompressionStream. */
async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * Extract one entry's bytes. Supports stored (method 0) and deflate (method 8);
 * encrypted or unsupported entries throw.
 */
export async function inflateZipEntry(
  buffer: ArrayBuffer,
  entry: ZipEntry,
): Promise<Uint8Array> {
  if (isEncrypted(entry)) throw new Error(`"${entry.name}" is encrypted.`);
  const view = new DataView(buffer);
  if (entry.localOffset + 30 > buffer.byteLength || view.getUint32(entry.localOffset, true) !== LFH_SIG) {
    throw new Error(`Bad local header for "${entry.name}".`);
  }
  const nameLen = view.getUint16(entry.localOffset + 26, true);
  const extraLen = view.getUint16(entry.localOffset + 28, true);
  const start = entry.localOffset + 30 + nameLen + extraLen;
  const data = new Uint8Array(buffer, start, entry.compressedSize);

  if (entry.method === 0) return data.slice();
  if (entry.method === 8) return inflateRaw(data);
  throw new Error(`Unsupported compression method ${entry.method} for "${entry.name}".`);
}

/** Find an entry by its path (tolerating a leading slash and backslashes). */
export function findZipEntry(entries: ZipEntry[], path: string): ZipEntry | undefined {
  const normalize = (value: string): string =>
    value.replace(/^\/+/, "").replace(/\\/g, "/").replace(/^\.\//, "");
  const target = normalize(path);
  return entries.find((entry) => normalize(entry.name) === target);
}

/** Evidence of a downloadable filename inside an archive. */
export const baseName = (path: string): string => path.split("/").pop() || path;
