import { defineConfig } from "vitest/config";

export default defineConfig({
  // Framework client builds must be picked up: `solid-js` / `solid-js/web`
  // resolve to no-op server builds under the default "node" export condition,
  // which would make the wrapper tests unable to mount. These are the same
  // conditions a browser bundler uses.
  resolve: {
    conditions: ["browser", "import", "module", "default"],
  },
  test: {
    environment: "happy-dom",
    include: ["src/test/**/*.test.ts"],
    restoreMocks: true,
  },
});
