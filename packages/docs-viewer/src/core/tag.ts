/**
 * The custom-element tag name, in a dependency-free module.
 *
 * It lives here (rather than in `element.ts`) so renderers can create a nested
 * `<gnt-docs-viewer>` without importing the element module — which would form a
 * cycle (`renderers/index` ← `element.ts`).
 */
export const TAG = "gnt-docs-viewer";
