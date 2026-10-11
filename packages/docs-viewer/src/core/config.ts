import type { LoaderMode, ResolvedConfig, Theme, ViewerConfig } from "./types";

export const DEFAULT_OFFICE_ENDPOINT =
  "https://view.officeapps.live.com/op/embed.aspx?src=";
export const DEFAULT_GOOGLE_ENDPOINT =
  "https://docs.google.com/viewer?embedded=true&url=";

export const DEFAULT_CONFIG: ResolvedConfig = {
  loader: "auto",
  credentials: "same-origin",
  engine: "auto",
  preflight: "auto",
  theme: "auto",
  code: {},
  image: { fullscreen: true },
  video: { controls: true, info: true },
};

const LOADERS: readonly LoaderMode[] = ["auto", "blob", "direct"];

function toLoader(value: unknown): LoaderMode {
  return typeof value === "string" && (LOADERS as readonly string[]).includes(value)
    ? (value as LoaderMode)
    : DEFAULT_CONFIG.loader;
}

/**
 * Coerce a `preflight` value into `true`, `false` or `"auto"` (the default).
 * Accepts booleans and the strings `true`/`false`/`1`/`0`/`yes`/`no`; anything
 * else (including an empty string or `"auto"`) means "auto".
 */
export function toPreflight(value: unknown): boolean | "auto" {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
    if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  }
  return DEFAULT_CONFIG.preflight;
}

function toEngine(value: unknown): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : DEFAULT_CONFIG.engine;
}

const CREDENTIALS: readonly RequestCredentials[] = ["omit", "include", "same-origin"];

/** Coerce a `credentials` value; returns `undefined` for anything unrecognised. */
function toCredentials(value: unknown): RequestCredentials | undefined {
  return typeof value === "string" && (CREDENTIALS as readonly string[]).includes(value)
    ? (value as RequestCredentials)
    : undefined;
}

/** Coerce a `theme` value into `"auto"` (default), `"light"` or `"dark"`. */
export function toTheme(value: unknown): Theme {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "light" || normalized === "dark") return normalized;
  }
  return DEFAULT_CONFIG.theme;
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Read a `ViewerConfig` from a URL query string.
 *
 * Simple params (`?file=…&engine=iframe`) take precedence over a base64url-encoded
 * JSON blob (`?config=<base64url(JSON)>`), so links can stay short while still
 * allowing fine-grained overrides. `?lang=` is shorthand for `code.lang`.
 */
export function parseQuery(search: string): ViewerConfig {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const config: ViewerConfig = {};

  const rawConfig = params.get("config");
  if (rawConfig) {
    try {
      Object.assign(config, JSON.parse(decodeBase64Url(rawConfig)) as ViewerConfig);
    } catch {
      // Ignore malformed config blobs rather than failing the whole load.
    }
  }

  const source = params.get("file") ?? params.get("url") ?? params.get("src");
  if (source) config.source = source;

  const name = params.get("name");
  if (name) config.name = name;

  const entry = params.get("entry");
  if (entry) config.entry = entry;

  // Absolute base used to open archive members (e.g. a host's `/view/` route).
  const entryBase = params.get("entryBase");
  if (entryBase) config.entryBase = entryBase;

  // Colour theme (`auto` follows `prefers-color-scheme`).
  const theme = params.get("theme");
  if (theme) config.theme = toTheme(theme);

  const type = params.get("type");
  if (type) config.type = type;

  const loader = params.get("loader");
  if (loader) config.loader = toLoader(loader);

  const credentials = params.get("credentials");
  if (credentials) {
    const coerced = toCredentials(credentials);
    if (coerced) config.credentials = coerced;
  }

  const engine = params.get("engine");
  if (engine) config.engine = engine;

  const preflight = params.get("preflight");
  if (preflight !== null) config.preflight = toPreflight(preflight);

  // Shorthand for `code.lang`, so code links stay short (`?file=…&lang=rust`).
  const lang = params.get("lang");
  if (lang) config.code = { ...(config.code ?? {}), lang };

  return config;
}

/**
 * Merge config sources left-to-right (later wins) and apply defaults.
 * Typical order: `resolveConfig(attributes, props)`.
 */
export function resolveConfig(
  ...sources: Array<Partial<ViewerConfig> | undefined | null>
): ResolvedConfig {
  const merged: ViewerConfig = {};
  for (const source of sources) {
    if (source) Object.assign(merged, source);
  }

  return {
    source: merged.source,
    name: merged.name,
    entry: merged.entry,
    entryBase: merged.entryBase,
    type: merged.type,
    loader: toLoader(merged.loader),
    credentials: merged.credentials ?? DEFAULT_CONFIG.credentials,
    engine: toEngine(merged.engine),
    preflight: toPreflight(merged.preflight),
    theme: toTheme(merged.theme),
    code: { ...DEFAULT_CONFIG.code, ...(merged.code ?? {}) },
    image: { ...DEFAULT_CONFIG.image, ...(merged.image ?? {}) },
    video: { ...DEFAULT_CONFIG.video, ...(merged.video ?? {}) },
  };
}
