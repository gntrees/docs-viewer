import {
  baseName,
  findZipEntry,
  inflateZipEntry,
  isDirectory,
  isEncrypted,
  isZip,
  listZip,
} from "./zip";
import { gunzip, isGzip, isTar, listTar, readTarEntry } from "./tar";

/** A normalised entry, shared by the ZIP and RAR readers. */
export interface ArchiveEntry {
  name: string;
  /** Uncompressed size in bytes. */
  size: number;
  compressedSize: number;
  /** Human-readable compression method (e.g. "deflate", "m0"). */
  method: string;
  /** Last-modified time as an ISO string, when the archive carries one. */
  modified?: string;
  encrypted: boolean;
  directory: boolean;
}

export interface ArchiveListing {
  format: "zip" | "rar" | "tar" | "tar.gz";
  entries: ArchiveEntry[];
}

const RAR_MAGIC = [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07]; // "Rar!\x1a\x07"

export function isRar(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < RAR_MAGIC.length) return false;
  const bytes = new Uint8Array(buffer, 0, RAR_MAGIC.length);
  return RAR_MAGIC.every((value, index) => bytes[index] === value);
}

/** Convert the ZIP MS-DOS date/time fields into an ISO string. */
function dosDateTime(date: number, time: number): string | undefined {
  const year = 1980 + ((date >> 9) & 0x7f);
  const month = (date >> 5) & 0x0f;
  const day = date & 0x1f;
  const hours = (time >> 11) & 0x1f;
  const minutes = (time >> 5) & 0x3f;
  const seconds = (time & 0x1f) * 2;
  if (!month || !day) return undefined;
  const value = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
}

/** Fetch the RAR decoder's WebAssembly binary once, lazily. */
let unrarWasm: Promise<ArrayBuffer> | null = null;
function loadUnrarWasm(): Promise<ArrayBuffer> {
  if (!unrarWasm) {
    unrarWasm = import("node-unrar-js/dist/js/unrar.wasm?url")
      .then((mod) => fetch(mod.default))
      .then((response) => response.arrayBuffer())
      .catch((error) => {
        unrarWasm = null;
        throw error;
      });
  }
  return unrarWasm;
}

/**
 * Normalise an archive member path.
 *
 * Returns `null` for entries that carry a `.`/`..` segment *inside* a path (a
 * zip-slip, e.g. `a/../b` — surfacing it would fabricate phantom folders). A
 * *lone* `.`/`..` is kept: in an archive it is just a member name, not a
 * navigation link.
 */
function cleanEntryName(raw: string): string | null {
  // Only `/` is a separator in ZIP/RAR/TAR; a backslash is a literal filename
  // character (converting it would fabricate phantom folders).
  const segments = raw.split("/").filter((segment) => segment !== "");
  if (segments.length === 0) return null;
  if (segments.length > 1 && segments.some((segment) => segment === "." || segment === "..")) {
    return null;
  }
  return segments.join("/");
}

async function listRar(buffer: ArrayBuffer): Promise<ArchiveEntry[]> {
  const { createExtractorFromData } = await import("node-unrar-js");
  const wasmBinary = await loadUnrarWasm();
  const extractor = await createExtractorFromData({ data: buffer, wasmBinary });
  const list = extractor.getFileList();
  const entries: ArchiveEntry[] = [];
  for (const header of list.fileHeaders) {
    const name = cleanEntryName(header.name);
    if (name === null) continue;
    entries.push({
      name,
      size: header.unpSize,
      compressedSize: header.packSize,
      method: header.method,
      modified: header.time || undefined,
      encrypted: header.flags.encrypted,
      directory: header.flags.directory,
    });
  }
  return entries;
}

/** Convert TAR members into the shared entry shape. */
function listTarEntries(buffer: ArrayBuffer): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [];
  for (const member of listTar(buffer)) {
    const name = cleanEntryName(member.name);
    if (name === null) continue;
    entries.push({
      name,
      size: member.size,
      compressedSize: member.size, // TAR members are stored uncompressed.
      method: "store",
      modified: member.modified,
      encrypted: false,
      directory: member.directory,
    });
  }
  return entries;
}

/** List the contents of a ZIP, RAR or TAR (optionally gzipped) archive. */
export async function listArchive(buffer: ArrayBuffer): Promise<ArchiveListing> {
  if (isZip(buffer)) {
    const entries: ArchiveEntry[] = [];
    for (const entry of listZip(buffer)) {
      const name = cleanEntryName(entry.name);
      if (name === null) continue;
      entries.push({
        name,
        size: entry.uncompressedSize,
        compressedSize: entry.compressedSize,
        method: entry.method === 0 ? "store" : entry.method === 8 ? "deflate" : `m${entry.method}`,
        modified: dosDateTime(entry.modDate, entry.modTime),
        encrypted: isEncrypted(entry),
        directory: isDirectory(entry),
      });
    }
    return { format: "zip", entries };
  }
  if (isRar(buffer)) {
    return { format: "rar", entries: await listRar(buffer) };
  }
  if (isTar(buffer)) {
    return { format: "tar", entries: listTarEntries(buffer) };
  }
  if (isGzip(buffer)) {
    const inner = await gunzip(buffer);
    if (isTar(inner)) return { format: "tar.gz", entries: listTarEntries(inner) };
    throw new Error("Unsupported gzip payload (expected a .tar inside).");
  }
  throw new Error("Unsupported archive format (expected ZIP, RAR or TAR).");
}

/** A standalone copy of the bytes, so they can seed the next nested extraction. */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
    ? (bytes.buffer as ArrayBuffer)
    : (bytes.slice().buffer as ArrayBuffer);
}

const normalizePath = (value: string): string =>
  value.replace(/^\/+/, "").replace(/\\/g, "/").replace(/^\.\//, "");

async function createRarExtractor(buffer: ArrayBuffer): Promise<{ extractor: any }> {
  const { createExtractorFromData } = await import("node-unrar-js");
  const wasmBinary = await loadUnrarWasm();
  return { extractor: await createExtractorFromData({ data: buffer, wasmBinary }) };
}

/**
 * Extract a member from a (possibly nested) archive.
 *
 * `path` uses `/` segments that are ambiguous between *folders inside one
 * archive* and *nested archives*. It is resolved greedily: the longest prefix
 * that names a real entry is taken; if that entry is an intermediate segment it
 * must itself be an archive, and extraction continues inside it.
 */
export async function extractArchiveEntry(
  buffer: ArrayBuffer,
  path: string,
): Promise<{ bytes: Uint8Array; name: string }> {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) throw new Error("No archive entry was specified.");

  if (isZip(buffer)) {
    const entries = listZip(buffer);
    for (let count = segments.length; count >= 1; count--) {
      const candidate = segments.slice(0, count).join("/");
      const entry = findZipEntry(entries, candidate);
      if (!entry) continue;
      const bytes = await inflateZipEntry(buffer, entry);
      if (count === segments.length) return { bytes, name: baseName(entry.name) };
      return extractArchiveEntry(toArrayBuffer(bytes), segments.slice(count).join("/"));
    }
    throw new Error(`"${path}" was not found in the archive.`);
  }

  if (isRar(buffer)) {
    const { extractor } = await createRarExtractor(buffer);
    const names: string[] = [];
    for (const header of extractor.getFileList().fileHeaders) {
      names.push(normalizePath(header.name));
    }
    for (let count = segments.length; count >= 1; count--) {
      const candidate = segments.slice(0, count).join("/");
      const match = names.find((name) => name === candidate);
      if (!match) continue;
      const result = extractor.extract({ files: [match] });
      for (const file of result.files) {
        if (!file.extraction) continue;
        if (count === segments.length) return { bytes: file.extraction, name: baseName(match) };
        return extractArchiveEntry(
          toArrayBuffer(file.extraction),
          segments.slice(count).join("/"),
        );
      }
    }
    throw new Error(`"${path}" was not found in the archive.`);
  }

  if (isTar(buffer)) {
    for (let count = segments.length; count >= 1; count--) {
      const candidate = segments.slice(0, count).join("/");
      const bytes = readTarEntry(buffer, candidate);
      if (!bytes) continue;
      if (count === segments.length) return { bytes, name: baseName(candidate) };
      return extractArchiveEntry(toArrayBuffer(bytes), segments.slice(count).join("/"));
    }
    throw new Error(`"${path}" was not found in the archive.`);
  }
  if (isGzip(buffer)) {
    return extractArchiveEntry(await gunzip(buffer), path);
  }

  throw new Error("Unsupported archive format (expected ZIP, RAR or TAR).");
}
