import type { RenderContext, Renderer } from "../types/types";

/**
 * Metadata for the font renderer; see `archive.meta.ts` for why it is separate.
 */
export const fontMeta = {
  id: "font",
  engine: "font",
  priority: 16,
  match: (ctx: RenderContext): boolean => ctx.kind === "font",
} satisfies Pick<Renderer, "id" | "engine" | "priority" | "match">;
