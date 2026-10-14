import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const r = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

/**
 * Framework test lab: the same viewer playground rendered by five different
 * framework wrappers, one per route (`/react/`, `/preact/`, `/vue/`, `/svelte/`,
 * `/solid/`). Each route is a separate HTML entry (a multi-page app), so a single
 * dev server can host all five at once.
 *
 * All wrapper integration happens through `@gntrees/docs-viewer/<framework>`, so
 * Vue and Svelte bring their own compiler plugins. React's JSX is handled by
 * esbuild (`jsx: "automatic"`); Preact and Solid are driven through their
 * imperative APIs to avoid three competing JSX transforms in one config.
 *
 * The viewer is consumed from the published npm package (see `package.json`), not
 * the local workspace source, so this lab exercises the real shipped artifact.
 */
export default defineConfig({
  appType: "mpa",
  plugins: [vue(), svelte()],
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        home: r("./index.html"),
        react: r("./react/index.html"),
        preact: r("./preact/index.html"),
        vue: r("./vue/index.html"),
        svelte: r("./svelte/index.html"),
        solid: r("./solid/index.html"),
      },
    },
  },
});
