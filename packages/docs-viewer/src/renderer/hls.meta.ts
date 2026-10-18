import type { RenderContext, Renderer } from "../types/types";

/** Extensions the HLS renderer claims (everything else stays with `native`). */
export const HLS_EXT = /^(m3u8|m3u)$/i;

/**
 * Metadata for the HLS renderer; see `archive.meta.ts` for why it is separate.
 */
export const hlsMeta = {
  id: "hls",
  engine: "hls",
  priority: 13,
  match: (ctx: RenderContext): boolean => ctx.kind === "video" && HLS_EXT.test(ctx.ext),
} satisfies Pick<Renderer, "id" | "engine" | "priority" | "match">;
