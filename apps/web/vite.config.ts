import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { buildOverview, sections } from "./src/docs-content";
import { docsToMarkdown, markdownFileName, overviewToLlmsTxt, sectionToMarkdown } from "./src/docs-markdown";

const r = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

/**
 * GitHub Pages serves a project site from a sub-path, so the built assets and the
 * absolute links must be prefixed with it. Change these two to match your repo
 * (`https://<user>.github.io/<repo>/`). Dev still serves from `/`.
 */
const BASE_PATH = "/docs-viewer/";
const SITE_ORIGIN = "https://gntrees.github.io/docs-viewer";

/** Rewrite `/view` (no trailing slash) to `/view/` in dev and preview servers. */
function viewTrailingSlash(): Plugin {
  const rewrite = (base: string, url: string | undefined): string | undefined => {
    if (!url) return url;
    const prefix = base.replace(/\/$/, ""); // "" when base is "/"
    const pattern = new RegExp(`^${prefix}/view(\\?|$)`);
    return pattern.test(url) ? url.replace(pattern, `${prefix}/view/$1`) : url;
  };

  return {
    name: "view-trailing-slash",
    configureServer(server) {
      const base = server.config.base;
      server.middlewares.use((req, _res, next) => {
        req.url = rewrite(base, req.url);
        next();
      });
    },
    configurePreviewServer(server) {
      const base = server.config.base;
      server.middlewares.use((req, _res, next) => {
        req.url = rewrite(base, req.url);
        next();
      });
    },
  };
}

/**
 * Serve the documentation as markdown files, generated from `docs-content.ts`.
 *
 * In dev a middleware answers `/docs/<file>.md` from memory; on build the same
 * files are emitted into `dist/docs/`, so the pages, the Download buttons and an
 * agent fetching the raw files all share one source of truth. Emitted files bake
 * in `SITE_ORIGIN` as absolute URLs; dev derives the origin from the request host
 * so localhost links stay clickable.
 */
function docsMarkdown(): Plugin {
  const files = (origin: string): Map<string, string> => {
    const map = new Map<string, string>();
    const overview = buildOverview(sections, origin);
    map.set(`/docs/${markdownFileName(overview)}`, sectionToMarkdown(overview));
    for (const section of sections) {
      map.set(`/docs/${markdownFileName(section)}`, sectionToMarkdown(section));
    }
    map.set("/docs/docs.md", docsToMarkdown(sections));
    map.set("/llms.txt", overviewToLlmsTxt(overview));
    return map;
  };

  /** Absolute origin for the current request, so dev links match the served host. */
  const requestOrigin = (host?: string, forwardedProto?: string): string => {
    if (!host) return "";
    const proto = forwardedProto?.split(",")[0]?.trim() || "http";
    return `${proto}://${host}`;
  };

  return {
    name: "docs-markdown",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? "").split("?")[0] ?? "";
        const forwarded = req.headers["x-forwarded-proto"];
        const origin = requestOrigin(
          req.headers.host,
          Array.isArray(forwarded) ? forwarded[0] : forwarded,
        );
        const source = files(origin).get(path);
        if (source === undefined) return next();
        res.setHeader(
          "Content-Type",
          path.endsWith(".txt") ? "text/plain; charset=utf-8" : "text/markdown; charset=utf-8",
        );
        res.end(source);
      });
    },
    generateBundle() {
      for (const [path, source] of files(SITE_ORIGIN)) {
        this.emitFile({ type: "asset", fileName: path.replace(/^\//, ""), source });
      }
    },
  };
}

/**
 * Plain Vite app: a home page, a docs page and a dedicated viewer page.
 *
 * The library is aliased to its TypeScript source so the site hot-reloads
 * without rebuilding `packages/docs-viewer` first.
 */
export default defineConfig(({ command, isPreview }) => ({
  // GitHub Pages serves the project under `BASE_PATH`; dev stays at `/`.
  base: command === "build" || isPreview ? BASE_PATH : "/",
  // Multi-page app: without this, Vite's SPA fallback serves index.html for
  // unknown routes, so `/view` would render the home page.
  appType: "mpa",
  plugins: [viewTrailingSlash(), docsMarkdown()],
  resolve: {
    alias: [
      { find: /^@gntrees\/docs-viewer$/, replacement: r("../../packages/docs-viewer/src/index.ts") },
      { find: /^@gntrees\/docs-viewer\/(.*)$/, replacement: r("../../packages/docs-viewer/src/$1") },
    ],
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        home: r("./index.html"),
        docs: r("./docs/index.html"),
        view: r("./view/index.html"),
      },
    },
  },
}));
