import type { HighlighterCore } from "shiki/core";
import type { LanguageRegistration, ThemeRegistration } from "shiki/types";
import type { Renderer, ResolvedConfig } from "../types/types";
import { contentBar } from "../ui/content-bar";

/**
 * Shiki-backed code renderer (`engine: "shiki"`).
 *
 * Handles every `text`-kind document — plain text *and* source code — by
 * highlighting it with [Shiki](https://shiki.style). It fetches the file (so it
 * needs CORS) and highlights it in the viewer's theme. If anything fails it calls
 * `ctx.fail()`, so `auto` falls back to the next engine (the remote viewers).
 */

/** Extension → Shiki language id. Unknown extensions fall back to plain text. */
const LANG_BY_EXT: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  mts: "typescript",
  cts: "typescript",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  jsonc: "jsonc",
  json5: "json5",
  md: "markdown",
  markdown: "markdown",
  mdx: "mdx",
  html: "html",
  htm: "html",
  vue: "vue",
  svelte: "svelte",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  kts: "kotlin",
  sh: "shellscript",
  bash: "shellscript",
  zsh: "shellscript",
  fish: "fish",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  ini: "ini",
  xml: "xml",
  sql: "sql",
  dockerfile: "docker",
  diff: "diff",
  patch: "diff",
  env: "dotenv",
  graphql: "graphql",
  gql: "graphql",
  lua: "lua",
  r: "r",
  txt: "text",
  log: "text",
  csv: "text",
  tsv: "text",
};

/** Shiki language id for a file extension (`"text"` when unknown). */
export function shikiLangForExt(ext: string): string {
  return LANG_BY_EXT[ext] ?? "text";
}

/** Resolve the Shiki theme from the viewer config + `prefers-color-scheme`. */
export function shikiTheme(config: ResolvedConfig): string {
  if (config.code.theme) return config.code.theme;
  const dark =
    config.theme === "dark" ||
    (config.theme !== "light" &&
      typeof matchMedia === "function" &&
      matchMedia("(prefers-color-scheme: dark)").matches);
  return dark ? "github-dark" : "github-light";
}

/* ------------------------------------------------------------------------- *
 * Fine-grained Shiki.
 *
 * The full `shiki` bundle ships a registry of every language and theme it knows
 * (~70 kB gzip of loaders) and pulls in the oniguruma wasm — a lot of payload for
 * the handful of grammars a viewer ever highlights. So themes and grammars are
 * instead pulled one at a time from `shiki/core`, on demand.
 *
 * Anything outside the curated set — an arbitrary `code.lang`, or a theme the
 * viewer does not bundle — falls back to the full bundle, so "any language" keeps
 * working; it just is not the fast path.
 * ------------------------------------------------------------------------- */

/** One Shiki asset, taken from a dynamic import's `default` export. */
type ShikiAsset<Registration> = () => Promise<Registration>;

/** Plain-text languages Shiki renders without a grammar. */
const PLAIN_LANGS = new Set(["plain", "plaintext", "text", "txt"]);

/** The themes `shikiTheme` can ask for. */
const CORE_THEMES: Record<string, ShikiAsset<ThemeRegistration>> = {
  "github-dark": () => import("shiki/themes/github-dark.mjs").then((mod) => mod.default),
  "github-light": () => import("shiki/themes/github-light.mjs").then((mod) => mod.default),
};

/**
 * Grammars loaded on demand.
 *
 * Every language `LANG_BY_EXT` maps to, plus the sub-languages those grammars
 * embed (Vue, Svelte and HTML each pull in their own) so the docs' snippets and
 * every extension the viewer maps stay on the small path.
 */
const CORE_LANGS: Record<string, ShikiAsset<LanguageRegistration | LanguageRegistration[]>> = {
  c: () => import("shiki/langs/c.mjs").then((mod) => mod.default),
  cpp: () => import("shiki/langs/cpp.mjs").then((mod) => mod.default),
  csharp: () => import("shiki/langs/csharp.mjs").then((mod) => mod.default),
  css: () => import("shiki/langs/css.mjs").then((mod) => mod.default),
  diff: () => import("shiki/langs/diff.mjs").then((mod) => mod.default),
  docker: () => import("shiki/langs/docker.mjs").then((mod) => mod.default),
  dotenv: () => import("shiki/langs/dotenv.mjs").then((mod) => mod.default),
  fish: () => import("shiki/langs/fish.mjs").then((mod) => mod.default),
  go: () => import("shiki/langs/go.mjs").then((mod) => mod.default),
  graphql: () => import("shiki/langs/graphql.mjs").then((mod) => mod.default),
  html: () => import("shiki/langs/html.mjs").then((mod) => mod.default),
  "html-derivative": () =>
    import("shiki/langs/html-derivative.mjs").then((mod) => mod.default),
  ini: () => import("shiki/langs/ini.mjs").then((mod) => mod.default),
  java: () => import("shiki/langs/java.mjs").then((mod) => mod.default),
  javascript: () => import("shiki/langs/javascript.mjs").then((mod) => mod.default),
  json: () => import("shiki/langs/json.mjs").then((mod) => mod.default),
  json5: () => import("shiki/langs/json5.mjs").then((mod) => mod.default),
  jsonc: () => import("shiki/langs/jsonc.mjs").then((mod) => mod.default),
  jsx: () => import("shiki/langs/jsx.mjs").then((mod) => mod.default),
  kotlin: () => import("shiki/langs/kotlin.mjs").then((mod) => mod.default),
  less: () => import("shiki/langs/less.mjs").then((mod) => mod.default),
  lua: () => import("shiki/langs/lua.mjs").then((mod) => mod.default),
  markdown: () => import("shiki/langs/markdown.mjs").then((mod) => mod.default),
  "markdown-vue": () => import("shiki/langs/markdown-vue.mjs").then((mod) => mod.default),
  mdx: () => import("shiki/langs/mdx.mjs").then((mod) => mod.default),
  php: () => import("shiki/langs/php.mjs").then((mod) => mod.default),
  postcss: () => import("shiki/langs/postcss.mjs").then((mod) => mod.default),
  python: () => import("shiki/langs/python.mjs").then((mod) => mod.default),
  r: () => import("shiki/langs/r.mjs").then((mod) => mod.default),
  ruby: () => import("shiki/langs/ruby.mjs").then((mod) => mod.default),
  rust: () => import("shiki/langs/rust.mjs").then((mod) => mod.default),
  sass: () => import("shiki/langs/sass.mjs").then((mod) => mod.default),
  scss: () => import("shiki/langs/scss.mjs").then((mod) => mod.default),
  shellscript: () => import("shiki/langs/shellscript.mjs").then((mod) => mod.default),
  sql: () => import("shiki/langs/sql.mjs").then((mod) => mod.default),
  svelte: () => import("shiki/langs/svelte.mjs").then((mod) => mod.default),
  swift: () => import("shiki/langs/swift.mjs").then((mod) => mod.default),
  toml: () => import("shiki/langs/toml.mjs").then((mod) => mod.default),
  tsx: () => import("shiki/langs/tsx.mjs").then((mod) => mod.default),
  typescript: () => import("shiki/langs/typescript.mjs").then((mod) => mod.default),
  "vue-directives": () =>
    import("shiki/langs/vue-directives.mjs").then((mod) => mod.default),
  "vue-interpolations": () =>
    import("shiki/langs/vue-interpolations.mjs").then((mod) => mod.default),
  "vue-sfc-style-variable-injection": () =>
    import("shiki/langs/vue-sfc-style-variable-injection.mjs").then((mod) => mod.default),
  vue: () => import("shiki/langs/vue.mjs").then((mod) => mod.default),
  xml: () => import("shiki/langs/xml.mjs").then((mod) => mod.default),
  yaml: () => import("shiki/langs/yaml.mjs").then((mod) => mod.default),
};

/** Interface of the fallback module (`shiki`'s full bundle). */
interface FullShiki {
  codeToHtml(code: string, options: { lang: string; theme: string }): Promise<string>;
}

/** Cached fine-grained highlighter, with no grammar or theme preloaded. */
let corePromise: Promise<HighlighterCore> | null = null;
const loadedThemes = new Set<string>();
const loadedLangs = new Set<string>();

function loadCore(): Promise<HighlighterCore> {
  if (!corePromise) {
    corePromise = (async () => {
      const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
        import("shiki/core"),
        import("shiki/engine/javascript"),
      ]);
      // The pure-JS engine keeps oniguruma's wasm (a separate ~40 kB chunk) out of
      // the bundle; `forgiving` tolerates the few patterns it cannot compile.
      return createHighlighterCore({
        engine: createJavaScriptRegexEngine({ forgiving: true }),
      });
    })().catch((error: unknown) => {
      corePromise = null;
      throw error;
    });
  }
  return corePromise;
}

/** Shiki's full bundle — only reached for a language or theme outside `CORE_*`. */
let fullPromise: Promise<FullShiki> | null = null;

function loadFullShiki(): Promise<FullShiki> {
  if (!fullPromise) {
    fullPromise = import("shiki").then(
      (mod) => mod as unknown as FullShiki,
      (error) => {
        fullPromise = null;
        throw new Error(`shiki could not be loaded. Install it with "bun add shiki". (${String(error)})`);
      },
    );
  }
  return fullPromise;
}

/** Highlight `code` to themed HTML with Shiki (rejects if Shiki cannot load). */
export async function highlightCode(code: string, lang: string, theme: string): Promise<string> {
  const themeLoader = CORE_THEMES[theme];
  const langLoader = CORE_LANGS[lang];
  if (themeLoader && (langLoader !== undefined || PLAIN_LANGS.has(lang))) {
    try {
      const core = await loadCore();
      if (!loadedThemes.has(theme)) {
        await core.loadTheme(themeLoader());
        loadedThemes.add(theme);
      }
      if (langLoader && !loadedLangs.has(lang)) {
        await core.loadLanguage(langLoader());
        loadedLangs.add(lang);
      }
      return await core.codeToHtml(code, { lang, theme });
    } catch {
      // A grammar that embeds a language we do not ship, or anything else the
      // fine-grained path cannot satisfy — the full bundle below still can.
    }
  }
  const shiki = await loadFullShiki();
  return shiki.codeToHtml(code, { lang, theme });
}

export const shikiRenderer: Renderer = {
  id: "shiki",
  engine: "shiki",
  priority: 15,
  match: (ctx) => ctx.kind === "text" || ctx.kind === "table" || ctx.kind === "markup",
  mount(container, ctx) {
    const root = document.createElement("div");
    root.className = "gnt-dv-code";
    let code: string | null = null;
    const bar = contentBar({
      name: ctx.name,
      source: ctx.source ?? ctx.displayUrl,
      getText: () => code,
    });
    root.appendChild(bar.root);
    // A separate scroller keeps the bar fixed while the code scrolls.
    const body = document.createElement("div");
    body.className = "gnt-dv-code-body";
    root.appendChild(body);
    container.appendChild(root);

    const showPlain = (text: string): void => {
      const pre = document.createElement("pre");
      pre.className = "gnt-dv-text";
      pre.textContent = text;
      body.replaceChildren(pre);
    };
    showPlain("Loading…");

    const controller = new AbortController();
    let disposed = false;

    void (async () => {
      try {
        const response = await fetch(ctx.displayUrl, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`.trim());
        }
        code = await response.text();
        if (disposed) return;
        bar.refresh();

        const lang = ctx.config.code.lang ?? shikiLangForExt(ctx.ext);
        const html = await highlightCode(code, lang, shikiTheme(ctx.config));
        if (disposed) return;

        // Wrap the highlighted output in our own scroller container: host page
        // CSS adds `overflow` to `pre`, so rather than scrolling *inside* the
        // pre we size this wrapper to its content and let the body scroll both
        // axes (vertical + horizontal, auto).
        const scroll = document.createElement("div");
        scroll.className = "gnt-dv-code-scroll";
        scroll.innerHTML = html;
        body.replaceChildren(scroll);
      } catch (error) {
        if (disposed) return;
        ctx.fail?.(error instanceof Error ? error : new Error(String(error)));
      }
    })();

    return {
      destroy() {
        disposed = true;
        controller.abort();
        root.remove();
      },
    };
  },
};
