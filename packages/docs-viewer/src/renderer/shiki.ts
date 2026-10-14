import type { Renderer, ResolvedConfig } from "../core/types";
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

interface ShikiModule {
  codeToHtml(code: string, options: { lang: string; theme: string }): Promise<string>;
}

let shikiPromise: Promise<ShikiModule> | null = null;

function loadShiki(): Promise<ShikiModule> {
  if (!shikiPromise) {
    shikiPromise = import("shiki").then(
      (mod) => mod as unknown as ShikiModule,
      (error) => {
        shikiPromise = null;
        throw new Error(`shiki could not be loaded. Install it with "bun add shiki". (${String(error)})`);
      },
    );
  }
  return shikiPromise;
}

/** Highlight `code` to themed HTML with Shiki (rejects if Shiki cannot load). */
export async function highlightCode(code: string, lang: string, theme: string): Promise<string> {
  const shiki = await loadShiki();
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
