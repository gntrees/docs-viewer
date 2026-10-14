const u16 = (value: number): number[] => [value & 0xff, (value >> 8) & 0xff];
const u32 = (value: number): number[] => [
  value & 0xff,
  (value >> 8) & 0xff,
  (value >> 16) & 0xff,
  (value >> 24) & 0xff,
];

// sfnt/OpenType tables are big-endian (network byte order).
const be16 = (value: number): number[] => [(value >> 8) & 0xff, value & 0xff];
const be32 = (value: number): number[] => [
  (value >>> 24) & 0xff,
  (value >>> 16) & 0xff,
  (value >>> 8) & 0xff,
  value & 0xff,
];

async function deflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gzipBytes(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export interface FixtureEntry {
  name: string;
  data: string | Uint8Array;
  method?: 0 | 8;
}

/** Build a minimal but valid ZIP archive in memory (CRC left as 0 — unverified). */
export async function makeZip(entries: FixtureEntry[]): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const body: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const raw = typeof entry.data === "string" ? encoder.encode(entry.data) : entry.data;
    const method = entry.method ?? 0;
    const stored = method === 8 ? await deflateRaw(raw) : raw;
    const nameBytes = encoder.encode(entry.name);

    const local = new Uint8Array([
      ...u32(0x04034b50),
      ...u16(20),
      ...u16(0),
      ...u16(method),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(stored.length),
      ...u32(raw.length),
      ...u16(nameBytes.length),
      ...u16(0),
    ]);
    body.push(local, nameBytes, stored);

    const header = new Uint8Array([
      ...u32(0x02014b50),
      ...u16(20),
      ...u16(20),
      ...u16(0),
      ...u16(method),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(stored.length),
      ...u32(raw.length),
      ...u16(nameBytes.length),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(offset),
    ]);
    central.push(header, nameBytes);
    offset += local.length + nameBytes.length + stored.length;
  }

  const cdSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
  const eocd = new Uint8Array([
    ...u32(0x06054b50),
    ...u16(0),
    ...u16(0),
    ...u16(entries.length),
    ...u16(entries.length),
    ...u32(cdSize),
    ...u32(offset),
    ...u16(0),
  ]);

  const all = [...body, ...central, eocd];
  const out = new Uint8Array(all.reduce((sum, chunk) => sum + chunk.length, 0));
  let cursor = 0;
  for (const chunk of all) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  return out.buffer;
}

/** Pad a byte array to the next 512-byte boundary (TAR block size). */
function pad512(bytes: Uint8Array): Uint8Array {
  const remainder = bytes.length % 512;
  if (remainder === 0) return bytes;
  const padded = new Uint8Array(bytes.length + (512 - remainder));
  padded.set(bytes);
  return padded;
}

export interface TarFixtureEntry {
  name: string;
  data?: string | Uint8Array;
  directory?: boolean;
  mtime?: number;
}

/** Build a minimal POSIX ustar archive in memory. */
export function makeTar(entries: TarFixtureEntry[]): ArrayBuffer {
  const encoder = new TextEncoder();
  const blocks: Uint8Array[] = [];

  for (const entry of entries) {
    const raw =
      entry.data === undefined
        ? new Uint8Array()
        : typeof entry.data === "string"
          ? encoder.encode(entry.data)
          : entry.data;
    const size = entry.directory ? 0 : raw.length;
    const header = new Uint8Array(512);

    const name = entry.directory && !entry.name.endsWith("/") ? `${entry.name}/` : entry.name;
    header.set(encoder.encode(name).subarray(0, 100), 0);

    const octal = (offset: number, length: number, value: number): void => {
      const text = value.toString(8).padStart(length - 1, "0");
      for (let i = 0; i < length - 1; i++) header[offset + i] = text.charCodeAt(i);
      header[offset + length - 1] = 0;
    };
    octal(100, 8, 0o644);
    octal(108, 8, 0);
    octal(116, 8, 0);
    octal(124, 12, size);
    octal(136, 12, entry.mtime ?? 0);
    header[156] = entry.directory ? 0x35 : 0x30; // '5' (dir) / '0' (file)
    header.set(encoder.encode("ustar"), 257);
    header[263] = 0x30;
    header[264] = 0x30; // version "00"

    for (let i = 148; i < 156; i++) header[i] = 0x20;
    let checksum = 0;
    for (let i = 0; i < 512; i++) checksum += header[i]!;
    const checksumText = checksum.toString(8).padStart(6, "0");
    for (let i = 0; i < 6; i++) header[148 + i] = checksumText.charCodeAt(i);
    header[154] = 0;
    header[155] = 0x20;

    blocks.push(header);
    if (size) blocks.push(pad512(raw));
  }

  blocks.push(new Uint8Array(1024)); // two zero blocks terminate the archive
  const total = blocks.reduce((sum, block) => sum + block.length, 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const block of blocks) {
    out.set(block, cursor);
    cursor += block.length;
  }
  return out.buffer;
}

/** Gzip an existing buffer (for `.tar.gz` fixtures). */
export async function gzip(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  return (await gzipBytes(new Uint8Array(buffer))).buffer as ArrayBuffer;
}

/** Encode a string as UTF-16BE bytes (as used by sfnt `name` records). */
function utf16be(text: string): number[] {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.charCodeAt(0);
    bytes.push((code >> 8) & 0xff, code & 0xff);
  }
  return bytes;
}

/** Build a minimal sfnt (TTF) with just `name` and `head` tables. */
export function makeSfntFont(options: {
  family: string;
  subfamily?: string;
  unitsPerEm?: number;
}): ArrayBuffer {
  const family = utf16be(options.family);
  const subfamily = utf16be(options.subfamily ?? "Regular");
  const stringOffset = 6 + 2 * 12;
  const nameTable = new Uint8Array([
    ...be16(0),
    ...be16(2),
    ...be16(stringOffset),
    ...be16(3),
    ...be16(1),
    ...be16(0x0409),
    ...be16(1),
    ...be16(family.length),
    ...be16(0),
    ...be16(3),
    ...be16(1),
    ...be16(0x0409),
    ...be16(2),
    ...be16(subfamily.length),
    ...be16(family.length),
    ...family,
    ...subfamily,
  ]);

  const headTable = new Uint8Array(54);
  const headView = new DataView(headTable.buffer);
  headView.setUint16(18, options.unitsPerEm ?? 1000);

  const nameOffset = 12 + 2 * 16;
  const headOffset = nameOffset + nameTable.length;
  const header = new Uint8Array([
    ...be32(0x00010000),
    ...be16(2),
    ...be16(0),
    ...be16(0),
    ...be16(0),
    // name record
    ...[..."name"].map((c) => c.charCodeAt(0)),
    ...be32(0),
    ...be32(nameOffset),
    ...be32(nameTable.length),
    // head record
    ...[..."head"].map((c) => c.charCodeAt(0)),
    ...be32(0),
    ...be32(headOffset),
    ...be32(headTable.length),
  ]);

  const out = new Uint8Array(header.length + nameTable.length + headTable.length);
  out.set(header, 0);
  out.set(nameTable, nameOffset);
  out.set(headTable, headOffset);
  return out.buffer;
}
