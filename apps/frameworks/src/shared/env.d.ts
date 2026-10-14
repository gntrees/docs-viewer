/**
 * Ambient module declarations for single-file components.
 *
 * `tsc` does not understand `.vue`/`.svelte` files; `vue-tsc` / `svelte-check`
 * are needed for full types inside a component. These shims keep `tsc --noEmit`
 * happy for the (framework-agnostic) `.ts`/`.tsx` entry points that import them.
 */
declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare module "*.svelte" {
  import type { Component } from "svelte";

  const component: Component<Record<string, unknown>>;
  export default component;
}
