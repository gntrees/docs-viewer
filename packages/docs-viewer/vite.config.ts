import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const entry = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

/**
 * Peer dependencies stay out of the bundle. `shiki/…` subpaths (`shiki/core`,
 * `shiki/langs/*`, `shiki/themes/*`, `shiki/engine/*`) matter too: without them the
 * published package would inline Shiki's core instead of leaving it to the app.
 */
const EXTERNAL = [
  "@panzoom/panzoom",
  "brotli-dec-wasm",
  "hls.js",
  "marked",
  "node-unrar-js",
  "preact",
  "preact/hooks",
  "preact/jsx-runtime",
  "react",
  "react-dom",
  "react/jsx-runtime",
  "shiki",
  "svelte",
  "vue",
  "solid-js",
  "solid-js/web",
];

export default defineConfig({
  plugins: [dts({ include: ["src"], exclude: ["src/test"], tsconfigPath: "./tsconfig.json" })],
  build: {
    target: "es2022",
    // No sourcemaps in the published tarball: the wrappers are tiny and the maps
    // would dominate the package size (~600 kB unpacked) for little benefit.
    sourcemap: false,
    lib: {
      entry: {
        index: entry("./src/entry/index.ts"),
        react: entry("./src/wrapper/react.tsx"),
        preact: entry("./src/wrapper/preact.ts"),
        vue: entry("./src/wrapper/vue.ts"),
        svelte: entry("./src/wrapper/svelte.ts"),
        solid: entry("./src/wrapper/solid.ts"),
        standalone: entry("./src/entry/standalone.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: (id: string): boolean => EXTERNAL.includes(id) || id.startsWith("shiki/"),
    },
  },
});
