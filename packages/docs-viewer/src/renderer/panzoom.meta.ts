import type { RenderContext, Renderer } from "../types/types";

/**
 * Metadata for the panzoom image renderer; see `archive.meta.ts` for why it is
 * separate.
 */
export const panzoomMeta = {
  id: "panzoom",
  engine: "panzoom",
  priority: 12,
  match: (ctx: RenderContext): boolean => ctx.kind === "image",
} satisfies Pick<Renderer, "id" | "engine" | "priority" | "match">;
