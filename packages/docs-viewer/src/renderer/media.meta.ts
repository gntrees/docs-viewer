import type { RenderContext, Renderer } from "../types/types";

/**
 * Metadata for the native media renderer; see `archive.meta.ts` for why it is
 * separate.
 */
export const mediaMeta = {
  id: "media",
  engine: "native",
  priority: 12,
  match: (ctx: RenderContext): boolean => ctx.kind === "video" || ctx.kind === "audio",
} satisfies Pick<Renderer, "id" | "engine" | "priority" | "match">;
