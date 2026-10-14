import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  // Enables TypeScript in `<script lang="ts">` blocks.
  preprocess: vitePreprocess(),
};
