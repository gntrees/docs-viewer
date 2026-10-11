import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const entry = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [dts({ include: ["src"], tsconfigPath: "./tsconfig.json" })],
  build: {
    target: "es2022",
    sourcemap: true,
    lib: {
      entry: {
        index: entry("./src/index.ts"),
        react: entry("./src/react.tsx"),
        vue: entry("./src/vue.ts"),
        solid: entry("./src/solid.ts"),
        standalone: entry("./src/standalone.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "@panzoom/panzoom",
        "brotli-dec-wasm",
        "hls.js",
        "node-unrar-js",
        "react",
        "react-dom",
        "react/jsx-runtime",
        "shiki",
        "vue",
        "solid-js",
        "solid-js/web",
      ],
    },
  },
});
