import type { DetectedFile, FileKind } from "./types";

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
  ico: "image/x-icon",
  svg: "image/svg+xml",
  tif: "image/tiff",
  tiff: "image/tiff",
  psd: "image/vnd.adobe.photoshop",
  dxf: "image/vnd.dxf",
  ai: "application/postscript",
  eps: "application/postscript",
  ps: "application/postscript",
  txt: "text/plain",
  md: "text/markdown",
  log: "text/plain",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  tab: "text/tab-separated-values",
  json: "application/json",
  xml: "application/xml",
  yml: "text/yaml",
  yaml: "text/yaml",
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  js: "text/javascript",
  mjs: "text/javascript",
  ts: "text/plain",
  py: "text/x-python",
  go: "text/x-go",
  rs: "text/x-rust",
  mts: "text/plain",
  cts: "text/plain",
  cjs: "text/javascript",
  jsx: "text/javascript",
  tsx: "text/plain",
  jsonc: "application/json",
  json5: "application/json",
  mdx: "text/markdown",
  vue: "text/plain",
  svelte: "text/plain",
  scss: "text/x-scss",
  sass: "text/x-sass",
  less: "text/x-less",
  rb: "text/x-ruby",
  java: "text/x-java",
  c: "text/x-c",
  h: "text/x-c",
  cpp: "text/x-c++",
  cc: "text/x-c++",
  cxx: "text/x-c++",
  hpp: "text/x-c++",
  cs: "text/x-csharp",
  php: "text/x-php",
  swift: "text/x-swift",
  kt: "text/x-kotlin",
  kts: "text/x-kotlin",
  bash: "text/x-shellscript",
  zsh: "text/x-shellscript",
  fish: "text/x-shellscript",
  sql: "text/x-sql",
  diff: "text/x-diff",
  patch: "text/x-diff",
  env: "text/plain",
  graphql: "text/x-graphql",
  gql: "text/x-graphql",
  lua: "text/x-lua",
  r: "text/x-r",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
  rtf: "application/rtf",
  pages: "application/vnd.apple.pages",
  numbers: "application/vnd.apple.numbers",
  key: "application/vnd.apple.keynote",
  ttf: "font/ttf",
  xps: "application/vnd.ms-xpsdocument",
  zip: "application/zip",
  rar: "application/vnd.rar",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  m3u8: "application/vnd.apple.mpegurl",
  m3u: "application/vnd.apple.mpegurl",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
};

const IMAGE_EXTS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico", "svg", "tif", "tiff",
  // Graphics formats a browser cannot decode natively (routed to the Google fallback).
  "psd", "dxf", "ai", "eps", "ps",
]);
const TEXT_EXTS = new Set([
  "txt", "log",
  "json", "jsonc", "json5", "xml", "yml", "yaml", "ini", "toml", "env",
  "css", "scss", "sass", "less",
  "js", "mjs", "cjs", "jsx", "ts", "tsx", "mts", "cts",
  "vue", "svelte",
  "py", "go", "rs", "rb", "java", "c", "h", "cpp", "cc", "cxx", "hpp",
  "cs", "php", "swift", "kt", "kts",
  "sh", "bash", "zsh", "fish",
  "sql", "diff", "patch", "graphql", "gql", "lua", "r",
]);
/** Delimited text rendered by the `table` engine (.csv/.tsv/.tab). */
const TABLE_EXTS = new Set(["csv", "tsv", "tab"]);
/** Markup rendered by the `markup` engine (HTML and Markdown). */
const MARKUP_EXTS = new Set(["html", "htm", "md", "markdown", "mdx"]);
/** Fonts (`font` kind; a DIY specimen renderer is planned). */
const FONT_EXTS = new Set(["ttf"]);
/** Archives (`archive` kind; Google lists .zip/.rar, a DIY renderer is planned). */
const ARCHIVE_EXTS = new Set(["zip", "rar", "tar", "tgz", "gz"]);
/** MIME types that carry no real type info, so the extension may refine the kind. */
const GENERIC_MIMES = new Set(["text/plain", "application/octet-stream"]);
const OFFICE_EXTS = new Set([
  "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "rtf",
  "pages", "numbers", "key",
]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "m4v", "avi", "mkv", "m3u8", "m3u"]);
const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "flac", "m4a", "aac"]);

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

/**
 * Kind-level aliases accepted by the `type` config (mirrors the playground Type
 * dropdown). Each locks a whole `FileKind` rather than a single MIME; the
 * representative `mime`/family is only used when the URL does not already
 * provide one of the same kind (so a `.jpg` stays `image/jpeg`).
 */
const TYPE_ALIASES: Record<string, { kind: FileKind; mime: string }> = {
  pdf: { kind: "pdf", mime: "application/pdf" },
  image: { kind: "image", mime: "image/png" },
  video: { kind: "video", mime: "video/mp4" },
  audio: { kind: "audio", mime: "audio/mpeg" },
  text: { kind: "text", mime: "text/plain" },
  code: { kind: "text", mime: "text/plain" },
  table: { kind: "table", mime: "text/csv" },
  csv: { kind: "table", mime: "text/csv" },
  markup: { kind: "markup", mime: "text/html" },
  html: { kind: "markup", mime: "text/html" },
  htm: { kind: "markup", mime: "text/html" },
  markdown: { kind: "markup", mime: "text/markdown" },
  md: { kind: "markup", mime: "text/markdown" },
  mdx: { kind: "markup", mime: "text/markdown" },
  font: { kind: "font", mime: "font/ttf" },
  archive: { kind: "archive", mime: "application/zip" },
  office: { kind: "office", mime: DOCX_MIME },
  word: { kind: "office", mime: DOCX_MIME },
  docs: { kind: "office", mime: DOCX_MIME },
  excel: { kind: "office", mime: XLSX_MIME },
  spreadsheet: { kind: "office", mime: XLSX_MIME },
  powerpoint: { kind: "office", mime: PPTX_MIME },
  presentation: { kind: "office", mime: PPTX_MIME },
};

/** MIME family wildcards (`image/*`) mapped to the kind they lock. */
const MIME_FAMILIES: Record<string, { kind: FileKind; mime: string }> = {
  "image/": { kind: "image", mime: "image/png" },
  "video/": { kind: "video", mime: "video/mp4" },
  "audio/": { kind: "audio", mime: "audio/mpeg" },
  "text/": { kind: "text", mime: "text/plain" },
};

/** Normalise an extension: strips leading dots and lowercases. */
export function normalizeExt(value: string): string {
  return value.replace(/^\./, "").trim().toLowerCase();
}

/**
 * Extract the bare MIME type from a `Content-Type` header value, dropping any
 * parameters (e.g. `text/html; charset=utf-8` → `text/html`).
 */
export function normalizeContentType(header: string | undefined | null): string {
  if (!header) return "";
  return header.split(";")[0]?.trim().toLowerCase() ?? "";
}

/** Best-effort filename from a URL, tolerating query strings and encoded paths. */
export function fileNameFromUrl(url: string | undefined): string {
  if (!url) return "document";
  try {
    const parsed = new URL(url, "http://localhost");
    const segment = parsed.pathname.split("/").filter(Boolean).pop();
    return segment ? decodeURIComponent(segment) : "document";
  } catch {
    return "document";
  }
}

export function extFromName(name: string | undefined): string {
  if (!name) return "";
  const clean = name.split(/[?#]/)[0] ?? "";
  const base = clean.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  return dot < 0 ? "" : normalizeExt(base.slice(dot + 1));
}

export function kindFromMime(mime: string): FileKind {
  if (mime === "application/pdf") return "pdf";
  if (mime === "text/csv" || mime === "application/csv") return "table";
  if (mime === "text/tab-separated-values") return "table";
  if (mime.startsWith("font/") || mime === "application/x-font-ttf" || mime === "application/font-sfnt") {
    return "font";
  }
  if (
    mime === "application/zip" ||
    mime === "application/x-zip-compressed" ||
    mime === "application/vnd.rar" ||
    mime === "application/x-rar-compressed" ||
    mime === "application/x-tar" ||
    mime === "application/tar" ||
    mime === "application/gzip" ||
    mime === "application/x-gzip"
  ) {
    return "archive";
  }
  // PostScript/EPS/AI and XPS: no native renderer, so they share the image chain
  // (which ends at the Google viewer).
  if (mime === "application/postscript" || mime === "application/illustrator") return "image";
  if (mime === "application/vnd.ms-xpsdocument" || mime === "application/oxps") return "image";
  if (mime.startsWith("image/")) return "image";
  if (mime === "text/html" || mime === "text/markdown" || mime === "text/x-markdown") {
    return "markup";
  }
  if (mime.startsWith("text/")) return "text";
  if (mime.startsWith("video/")) return "video";
  if (mime.includes("mpegurl")) return "video"; // HLS playlists (.m3u8)
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/json" || mime === "application/xml") return "text";
  if (
    mime.includes("word") ||
    mime.includes("excel") ||
    mime.includes("spreadsheetml") ||
    mime.includes("presentationml") ||
    mime.includes("powerpoint") ||
    mime.includes("opendocument") ||
    mime === "application/msword" ||
    mime === "application/rtf" ||
    mime === "application/vnd.apple.pages" ||
    mime === "application/vnd.apple.numbers" ||
    mime === "application/vnd.apple.keynote"
  ) {
    return "office";
  }
  return "unknown";
}

export function kindFromExt(ext: string): FileKind {
  if (ext === "pdf") return "pdf";
  if (TABLE_EXTS.has(ext)) return "table";
  if (MARKUP_EXTS.has(ext)) return "markup";
  if (FONT_EXTS.has(ext)) return "font";
  if (ARCHIVE_EXTS.has(ext)) return "archive";
  if (IMAGE_EXTS.has(ext)) return "image";
  if (TEXT_EXTS.has(ext)) return "text";
  if (OFFICE_EXTS.has(ext)) return "office";
  if (VIDEO_EXTS.has(ext)) return "video";
  if (AUDIO_EXTS.has(ext)) return "audio";
  return "unknown";
}

/** Reverse-look up a MIME type in the extension map (first match wins). */
function extFromMime(mime: string): string {
  return Object.keys(MIME_BY_EXT).find((key) => MIME_BY_EXT[key] === mime) ?? "";
}

/**
 * Detect the file kind, MIME type and extension.
 *
 * Detection prefers the *authoritative* signals — an explicit `typeOverride`
 * (kind alias, MIME type, MIME family wildcard, or bare extension) then the
 * `mimeHint` (a `Content-Type` from preflight) — and only falls back to the
 * filename extension as a last resort, since the URL extension can lie.
 *
 * The returned `ext` is kept from the URL when available (Shiki uses it to pick a
 * language), otherwise reverse-looked-up from the resolved MIME type.
 */
export function detect(
  name: string | undefined,
  typeOverride: string | undefined,
  mimeHint?: string,
): DetectedFile {
  const urlExt = extFromName(name);
  let ext = urlExt;
  let mime = urlExt ? MIME_BY_EXT[urlExt] ?? "" : "";

  let kind: FileKind = "unknown";

  if (typeOverride) {
    const override = typeOverride.trim();
    const alias = TYPE_ALIASES[override.toLowerCase()];
    if (alias) {
      // Kind-level lock: keep the URL MIME when it agrees, else the representative.
      kind = alias.kind;
      if (!mime || kindFromMime(mime) !== alias.kind) mime = alias.mime;
    } else if (override.endsWith("/*")) {
      // MIME family lock, e.g. `image/*`.
      const family = MIME_FAMILIES[override.slice(0, override.indexOf("/") + 1).toLowerCase()];
      if (family) {
        kind = family.kind;
        if (!mime || kindFromMime(mime) !== family.kind) mime = family.mime;
      }
    } else if (override.includes("/")) {
      // Exact MIME lock — authoritative over the URL.
      mime = override.toLowerCase();
      kind = kindFromMime(mime);
      if (!ext) ext = extFromMime(mime);
    } else {
      // Bare extension lock (existing behaviour).
      ext = normalizeExt(override);
      const mimeForExt = MIME_BY_EXT[ext] ?? "";
      if (mimeForExt) {
        mime = mimeForExt;
        kind = kindFromMime(mime);
      }
    }
  } else if (mimeHint) {
    mime = mimeHint;
    kind = kindFromMime(mime);
    if (kind === "unknown") mime = "";
    else if (!ext) ext = extFromMime(mime);
  }

  // Last resort: the filename extension (which may be wrong).
  if (kind === "unknown") {
    if (ext) {
      kind = kindFromExt(ext);
      if (!mime) mime = MIME_BY_EXT[ext] ?? "";
    }
    if (kind === "unknown" && mime) kind = kindFromMime(mime);
  }

  // A generic MIME (`text/plain`, `application/octet-stream`) carries no real type
  // info — raw hosts use it for CSV, DXF, PSD, … — so let the extension refine the
  // kind. An explicit `type` always wins, so a deliberate lock is never overridden.
  if (!typeOverride && GENERIC_MIMES.has(mime) && ext) {
    const extKind = kindFromExt(ext);
    if (extKind !== "unknown") kind = extKind;
  }

  return { kind, mime: mime || "application/octet-stream", ext };
}
