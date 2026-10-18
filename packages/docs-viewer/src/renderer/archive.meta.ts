import type { RenderContext, Renderer } from "../types/types";

/**
 * Metadata for the archive renderer.
 *
 * It lives apart from `archive.ts` so the registry can rank the renderer without
 * importing the (heavy) archive browser. `archive.ts` spreads this object into the
 * renderer it exports, so there is still one source of truth — the guard test in
 * `test/registry.test.ts` fails if the two ever drift apart.
 */
export const archiveMeta = {
  id: "archive",
  engine: "archive",
  priority: 16,
  match: (ctx: RenderContext): boolean => ctx.kind === "archive",
} satisfies Pick<Renderer, "id" | "engine" | "priority" | "match">;
