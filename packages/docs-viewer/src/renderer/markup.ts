import type { RenderContext, Renderer, ResolvedConfig } from "../core/types";
import { contentBar, type ViewMode } from "../ui/content-bar";
import { highlightCode, shikiLangForExt, shikiTheme } from "./shiki";

/**
 * Markup renderer (`engine: "markup"`) — HTML and Markdown.
 *
 * Shows the *rendered* document by default, with the content bar's toggle
 * switching to the raw source (Shiki-highlighted) — exactly like the table
 * renderer. Untrusted markup is isolated in a sandboxed `<iframe>` (no
 * `allow-scripts` / `allow-same-origin`), so it can never run code or reach the
 * host page. If anything fails it calls `ctx.fail()`, so `auto` falls back to
 * the next engine (shiki → the remote viewers).
 */

/** Documents longer than this are not rendered (the source view still works). */
export const MARKUP_MAX_CHARS = 2 * 1024 * 1024;

/** Extensions rendered through the Markdown pipeline. */
const MARKDOWN_EXTS = new Set(["md", "markdown", "mdx"]);

function isMarkdown(ctx: RenderContext): boolean {
  return MARKDOWN_EXTS.has(ctx.ext) || ctx.mime.includes("markdown");
}

interface MarkedModule {
  parse(src: string, options?: { gfm?: boolean; async?: boolean }): string;
}

let markedPromise: Promise<MarkedModule> | null = null;

/** Load the Markdown parser lazily so it never lands in the initial bundle. */
function loadMarked(): Promise<MarkedModule> {
  if (!markedPromise) {
    markedPromise = import("marked").then(
      (mod) => mod as unknown as MarkedModule,
      (error) => {
        markedPromise = null;
        throw new Error(`marked could not be loaded. Install it with "bun add marked". (${String(error)})`);
      },
    );
  }
  return markedPromise;
}

type ThemeName = "light" | "dark";

/** Resolve the effective light/dark theme (mirrors the Shiki theme resolution). */
function effectiveTheme(config: ResolvedConfig): ThemeName {
  if (config.theme === "light") return "light";
  if (config.theme === "dark") return "dark";
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Escape a value for use inside a double-quoted HTML attribute. */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Directory used to resolve the document's relative links/images. */
function baseHref(ctx: RenderContext): string {
  if (ctx.config.markup.baseUrl) return ctx.config.markup.baseUrl;
  const source = ctx.source ?? ctx.displayUrl;
  if (!source || source.startsWith("blob:")) return "";
  try {
    return new URL(".", source).href;
  } catch {
    return "";
  }
}

/**
 * The stylesheet injected into the rendered document. Kept minimal and
 * theme-aware; for raw HTML it is injected first so the file's own styles win.
 */
function markupCss(theme: ThemeName): string {
  const vars =
    theme === "dark"
      ? "--bg:#18181b;--fg:#fafafa;--muted:#a1a1aa;--border:#3f3f46;--code-bg:#27272a;--link:#60a5fa;--thumb:rgba(255,255,255,.42);--thumb-hover:rgba(255,255,255,.7)"
      : "--bg:#ffffff;--fg:#18181b;--muted:#52525b;--border:#e4e4e7;--code-bg:#f4f4f5;--link:#2563eb;--thumb:rgba(24,24,27,.32);--thumb-hover:rgba(24,24,27,.55)";
  return `
:root { color-scheme: ${theme}; ${vars}; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  padding: 24px;
  background: var(--bg);
  color: var(--fg);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 15px;
  line-height: 1.65;
  overflow-wrap: break-word;
}
img, video, svg { max-width: 100%; height: auto; }
a { color: var(--link); }
h1, h2, h3, h4, h5, h6 { line-height: 1.3; margin: 1.4em 0 .6em; }
h1 { font-size: 1.7em; }
h2 { font-size: 1.4em; }
h3 { font-size: 1.2em; }
p, ul, ol, blockquote, pre, table { margin: 0 0 1em; }
ul, ol { padding-left: 1.6em; }
blockquote { margin-left: 0; padding: .2em 1em; border-left: 3px solid var(--border); color: var(--muted); }
code, kbd, samp, pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; }
code { background: var(--code-bg); padding: .15em .35em; border-radius: 4px; }
pre { background: var(--code-bg); padding: 14px 16px; border-radius: 8px; overflow: auto; }
pre code { background: none; padding: 0; }
table { border-collapse: collapse; width: max-content; max-width: 100%; }
th, td { border: 1px solid var(--border); padding: 6px 10px; text-align: left; }
th { background: var(--code-bg); }
hr { border: 0; border-top: 1px solid var(--border); margin: 1.6em 0; }
::-webkit-scrollbar { width: 12px; height: 12px; }
::-webkit-scrollbar-thumb { background-color: var(--thumb); border: 3px solid transparent; background-clip: padding-box; border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background-color: var(--thumb-hover); }
::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }
`;
}

/** A complete HTML document for the parsed Markdown body. */
function fullDocument(body: string, ctx: RenderContext): string {
  const base = baseHref(ctx);
  return (
    "<!doctype html><html><head>" +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    (base ? `<base href="${escapeAttr(base)}" target="_blank">` : '<base target="_blank">') +
    `<style>${markupCss(effectiveTheme(ctx.config))}</style>` +
    `</head><body>${body}</body></html>`
  );
}

/**
 * A complete HTML document for a raw HTML file: the file keeps its own document
 * and styles untouched (isolated from the viewer theme), so it renders exactly
 * as authored. We only inject a `<base>` so relative links/images resolve. The
 * sandboxed iframe already keeps its styles from leaking to the host page.
 */
function htmlDocument(content: string, ctx: RenderContext): string {
  const doc = new DOMParser().parseFromString(content, "text/html");
  const head = doc.head ?? doc.documentElement;
  const base = baseHref(ctx);
  if (base && !doc.querySelector("base")) {
    const baseEl = doc.createElement("base");
    baseEl.setAttribute("href", base);
    baseEl.setAttribute("target", "_blank");
    head.prepend(baseEl);
  }
  return `<!doctype html>${doc.documentElement.outerHTML}`;
}

/** Elements dropped when rendering inline (`sandbox: false`) — best-effort only. */
const BANNED_TAGS = new Set([
  "script", "style", "iframe", "frame", "frameset", "object", "embed", "link", "meta",
  "base", "form", "input", "button", "textarea", "select", "option", "template", "noscript",
]);

/** Conservative best-effort sanitizer for inline rendering (trusted sources only). */
function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const el of Array.from(doc.body.querySelectorAll("*"))) {
    if (BANNED_TAGS.has(el.tagName.toLowerCase())) {
      el.remove();
      continue;
    }
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();
      if (name.startsWith("on") || name === "srcdoc") {
        el.removeAttribute(attr.name);
      } else if (
        (name === "href" || name === "src" || name === "xlink:href") &&
        /^javascript:/i.test(value)
      ) {
        el.removeAttribute(attr.name);
      }
    }
  }
  return doc.body.innerHTML;
}

export const markupRenderer: Renderer = {
  id: "markup",
  engine: "markup",
  priority: 16,
  match: (ctx) => ctx.kind === "markup",
  mount(container, ctx) {
    const root = document.createElement("div");
    root.className = "gnt-dv-markup";
    let raw: string | null = null;
    let mode: ViewMode = "rendered";
    const bar = contentBar({
      name: ctx.name,
      source: ctx.source ?? ctx.displayUrl,
      getText: () => raw,
      toggle: {
        active: "rendered",
        onChange(next): void {
          mode = next;
          paint();
        },
      },
    });
    root.appendChild(bar.root);
    const bodyEl = document.createElement("div");
    bodyEl.className = "gnt-dv-markup-body";
    root.appendChild(bodyEl);
    container.appendChild(root);

    const showPlain = (text: string): void => {
      const pre = document.createElement("pre");
      pre.className = "gnt-dv-text";
      pre.textContent = text;
      bodyEl.replaceChildren(pre);
    };
    const showMessage = (text: string): void => {
      const hint = document.createElement("p");
      hint.className = "gnt-dv-markup-hint";
      hint.textContent = text;
      bodyEl.replaceChildren(hint);
    };
    showPlain("Loading…");

    const controller = new AbortController();
    let disposed = false;
    let token = 0;

    /** Source view: the same Shiki pipeline as the text/code renderer. */
    const renderSource = (text: string): void => {
      const current = ++token;
      showPlain(text);
      void highlightCode(text, shikiLangForExt(ctx.ext), shikiTheme(ctx.config))
        .then((html) => {
          if (disposed || current !== token || mode !== "source") return;
          const scroll = document.createElement("div");
          scroll.className = "gnt-dv-code-scroll gnt-dv-code-block";
          scroll.innerHTML = html;
          bodyEl.replaceChildren(scroll);
        })
        .catch(() => {
          // Highlighting is best-effort; the plain text stays as a fallback.
        });
    };

    /** Rendered view: a sandboxed iframe (default) or sanitised inline markup. */
    const renderRendered = (text: string): void => {
      const current = ++token;
      if (text.length > MARKUP_MAX_CHARS) {
        showMessage(`This document is too large to render (${Math.round(text.length / 1024 / 1024)} MB). Use the source view.`);
        return;
      }
      const markdown = isMarkdown(ctx);
      void (async () => {
        let html = text;
        if (markdown) {
          let marked: MarkedModule;
          try {
            marked = await loadMarked();
          } catch (error) {
            if (!disposed) ctx.fail?.(error);
            return;
          }
          if (disposed || current !== token || mode !== "rendered") return;
          html = marked.parse(text, { gfm: ctx.config.markup.gfm !== false, async: false });
        }
        if (disposed || current !== token || mode !== "rendered") return;

        if (ctx.config.markup.sandbox === false) {
          const doc = document.createElement("div");
          doc.className = "gnt-dv-markup-doc";
          doc.innerHTML = sanitizeHtml(html);
          bodyEl.replaceChildren(doc);
          return;
        }

        const frame = document.createElement("iframe");
        frame.className = "gnt-dv-markup-frame";
        frame.title = ctx.name;
        frame.setAttribute("sandbox", "allow-popups");
        frame.setAttribute("referrerpolicy", "no-referrer");
        frame.srcdoc = markdown ? fullDocument(html, ctx) : htmlDocument(html, ctx);
        bodyEl.replaceChildren(frame);
      })();
    };

    const paint = (): void => {
      if (raw == null) return;
      if (mode === "source") renderSource(raw);
      else renderRendered(raw);
    };

    void (async () => {
      try {
        const response = await fetch(ctx.displayUrl, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`.trim());
        }
        raw = await response.text();
        if (disposed) return;
        bar.refresh();
        paint();
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
