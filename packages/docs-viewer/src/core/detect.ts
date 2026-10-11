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
  txt: "text/plain",
  md: "text/markdown",
  log: "text/plain",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
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
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
};

const IMAGE_EXTS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico", "svg", "tif", "tiff",
]);
const TEXT_EXTS = new Set([
  "txt", "md", "markdown", "mdx", "log", "csv", "tsv",
  "json", "jsonc", "json5", "xml", "yml", "yaml", "ini", "toml", "env",
  "html", "htm", "css", "scss", "sass", "less",
  "js", "mjs", "cjs", "jsx", "ts", "tsx", "mts", "cts",
  "vue", "svelte",
  "py", "go", "rs", "rb", "java", "c", "h", "cpp", "cc", "cxx", "hpp",
  "cs", "php", "swift", "kt", "kts",
  "sh", "bash", "zsh", "fish",
  "sql", "diff", "patch", "graphql", "gql", "lua", "r",
]);
const OFFICE_EXTS = new Set([
  "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "rtf",
  "pages", "numbers", "key",
]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "m4v", "avi", "mkv"]);
const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "flac", "m4a", "aac"]);

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
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("text/")) return "text";
  if (mime.startsWith("video/")) return "video";
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
    mime === "application/rtf"
  ) {
    return "office";
  }
  return "unknown";
}

export function kindFromExt(ext: string): FileKind {
  if (ext === "pdf") return "pdf";
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
 * (MIME type or bare extension) then the `mimeHint` (a `Content-Type` from
 * preflight) — and only falls back to the filename extension as a last resort,
 * since the URL extension can lie.
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

  // Resolve the authoritative MIME type from the explicit override or the hint.
  let authoritative = "";
  if (typeOverride) {
    if (typeOverride.includes("/")) {
      authoritative = typeOverride;
    } else {
      ext = normalizeExt(typeOverride);
      authoritative = MIME_BY_EXT[ext] ?? "";
    }
  } else if (mimeHint) {
    authoritative = mimeHint;
  }

  let kind: FileKind = "unknown";
  if (authoritative) {
    mime = authoritative;
    kind = kindFromMime(authoritative);
    if (!ext) ext = extFromMime(authoritative);
  }

  // Last resort: the filename extension (which may be wrong).
  if (kind === "unknown") {
    if (ext) {
      kind = kindFromExt(ext);
      if (!mime) mime = MIME_BY_EXT[ext] ?? "";
    }
    if (kind === "unknown" && mime) kind = kindFromMime(mime);
  }

  return { kind, mime: mime || "application/octet-stream", ext };
}
