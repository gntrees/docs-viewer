/**
 * Read a font's real Family/Subfamily and `unitsPerEm` from its `name`/`head`
 * tables — no dependency for sfnt (TTF/OTF) and WOFF. WOFF2 stores the whole
 * font Brotli-compressed, so it needs a decoder (`brotli-dec-wasm`), imported
 * lazily; if it cannot be loaded the caller simply shows the file name instead.
 *
 * Nothing here is essential to display a font — the browser loads it via
 * `FontFace` — so every path returns `null` rather than throwing on bad input.
 */

export interface FontMeta {
  family?: string;
  subfamily?: string;
  fullName?: string;
  unitsPerEm?: number;
  flavor: "sfnt" | "woff" | "woff2";
}

const ASCII = (bytes: Uint8Array, offset: number, length: number): string =>
  String.fromCharCode(...bytes.subarray(offset, offset + length));

/** The 63 well-known WOFF2 table tags, in spec order (index = 0…62). */
const WOFF2_TAGS = [
  "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm",
  "glyf", "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern",
  "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC",
  "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar",
  "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty",
  "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat",
  "Gloc", "Feat", "Sill",
];

function inflateZlib(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Response(stream).arrayBuffer().then((buffer) => new Uint8Array(buffer));
}

/** Decode the `name` table into the best Family/Subfamily/FullName strings. */
function parseNameTable(bytes: Uint8Array): Omit<FontMeta, "flavor" | "unitsPerEm"> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength < 6) return {};
  const count = view.getUint16(2);
  const stringOffset = view.getUint16(4);

  const score = (platform: number, language: number): number =>
    platform === 3 ? (language === 0x409 ? 4 : 3) : platform === 0 ? 2 : 1;
  const best = new Map<number, { score: number; text: string }>();

  for (let i = 0; i < count; i++) {
    const rec = 6 + i * 12;
    if (rec + 12 > bytes.byteLength) break;
    const platformID = view.getUint16(rec);
    const encodingID = view.getUint16(rec + 2);
    const languageID = view.getUint16(rec + 4);
    const nameID = view.getUint16(rec + 6);
    const length = view.getUint16(rec + 8);
    const offset = view.getUint16(rec + 10);
    if (nameID !== 1 && nameID !== 2 && nameID !== 4) continue;

    const start = stringOffset + offset;
    const raw = bytes.subarray(start, start + length);
    let text: string;
    try {
      text =
        platformID === 1
          ? new TextDecoder("latin1").decode(raw)
          : new TextDecoder(encodingID === 0 ? "utf-16be" : "utf-16be").decode(raw);
    } catch {
      continue;
    }
    text = text.replace(/\0/g, "").trim();
    if (!text) continue;

    const current = best.get(nameID);
    const value = score(platformID, languageID);
    if (!current || value > current.score) best.set(nameID, { score: value, text });
  }

  return {
    family: best.get(1)?.text,
    subfamily: best.get(2)?.text,
    fullName: best.get(4)?.text,
  };
}

/** `unitsPerEm` lives at byte 18 of the `head` table. */
function parseUnitsPerEm(head: Uint8Array): number | undefined {
  if (head.byteLength < 20) return undefined;
  const view = new DataView(head.buffer, head.byteOffset, head.byteLength);
  const value = view.getUint16(18);
  return value > 0 ? value : undefined;
}

/** Pull the `name` and `head` table bytes out of a bare sfnt font. */
function readSfnt(bytes: Uint8Array, base = 0): { name?: Uint8Array; head?: Uint8Array } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const numTables = view.getUint16(base + 4);
  let name: Uint8Array | undefined;
  let head: Uint8Array | undefined;
  for (let i = 0; i < numTables; i++) {
    const rec = base + 12 + i * 16;
    const tag = ASCII(bytes, rec, 4);
    const offset = view.getUint32(rec + 8);
    const length = view.getUint32(rec + 12);
    if (offset + length > bytes.byteLength) continue;
    if (tag === "name") name = bytes.subarray(offset, offset + length);
    else if (tag === "head") head = bytes.subarray(offset, offset + length);
  }
  return { name, head };
}

async function readWoff(bytes: Uint8Array): Promise<{ name?: Uint8Array; head?: Uint8Array }> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const numTables = view.getUint16(12);
  let name: Uint8Array | undefined;
  let head: Uint8Array | undefined;
  for (let i = 0; i < numTables; i++) {
    const rec = 44 + i * 20;
    const tag = ASCII(bytes, rec, 4);
    const offset = view.getUint32(rec + 4);
    const compLength = view.getUint32(rec + 8);
    const origLength = view.getUint32(rec + 12);
    const stored = bytes.subarray(offset, offset + compLength);
    const data = compLength < origLength ? await inflateZlib(stored) : stored;
    if (tag === "name") name = data;
    else if (tag === "head") head = data;
  }
  return { name, head };
}

/** Read a base-128 (variable-length) integer used by the WOFF2 directory. */
function readBase128(bytes: Uint8Array, cursor: { i: number }): number {
  let result = 0;
  for (let i = 0; i < 5; i++) {
    const byte = bytes[cursor.i++] ?? 0;
    if (i === 0 && byte === 0x80) throw new Error("Invalid UIntBase128.");
    if (result & 0xfe000000) throw new Error("UIntBase128 overflow.");
    result = (result << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) return result;
  }
  throw new Error("Unterminated UIntBase128.");
}

async function readWoff2(bytes: Uint8Array): Promise<{ name?: Uint8Array; head?: Uint8Array }> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const numTables = view.getUint16(12);
  const totalCompressedSize = view.getUint32(20);
  const cursor = { i: 48 };
  const directory: Array<{ tag: string; offset: number; length: number; transformed: boolean }> = [];
  let offset = 0;

  for (let i = 0; i < numTables; i++) {
    const flags = bytes[cursor.i++] ?? 0;
    const tagIndex = flags & 0x3f;
    const transformVersion = (flags >> 6) & 0x03;
    const tag = tagIndex === 63 ? ASCII(bytes, cursor.i, 4) : (WOFF2_TAGS[tagIndex] ?? "");
    if (tagIndex === 63) cursor.i += 4;
    const origLength = readBase128(bytes, cursor);
    const transformed =
      ((tag === "glyf" || tag === "loca") && transformVersion === 0) ||
      (tag === "hmtx" && transformVersion === 1);
    const length = transformed ? readBase128(bytes, cursor) : origLength;
    directory.push({ tag, offset, length, transformed });
    offset += length;
  }

  const compressed = bytes.subarray(cursor.i, cursor.i + totalCompressedSize);
  const mod = await (await import("brotli-dec-wasm")).default;
  const decoded = mod.decompress(compressed);

  const collect: { name?: Uint8Array; head?: Uint8Array } = {};
  for (const table of directory) {
    if (table.tag === "name") collect.name = decoded.subarray(table.offset, table.offset + table.length);
    else if (table.tag === "head") collect.head = decoded.subarray(table.offset, table.offset + table.length);
  }
  return collect;
}

/** Read font metadata; returns `null` for unsupported data. */
export async function readFontMeta(data: ArrayBuffer): Promise<FontMeta | null> {
  const bytes = new Uint8Array(data);
  if (bytes.byteLength < 4) return null;
  const signature = ASCII(bytes, 0, 4);
  const sfnt =
    signature === "OTTO" || signature === "true" || signature === "typ1" || bytes[0] === 0x00;

  try {
    let tables: { name?: Uint8Array; head?: Uint8Array };
    let flavor: FontMeta["flavor"];
    if (signature === "wOFF") {
      tables = await readWoff(bytes);
      flavor = "woff";
    } else if (signature === "wOF2") {
      tables = await readWoff2(bytes);
      flavor = "woff2";
    } else if (sfnt) {
      tables = readSfnt(bytes);
      flavor = "sfnt";
    } else {
      return null;
    }

    const meta: FontMeta = { flavor };
    if (tables.name) Object.assign(meta, parseNameTable(tables.name));
    if (tables.head) meta.unitsPerEm = parseUnitsPerEm(tables.head);
    return meta;
  } catch {
    return null;
  }
}
