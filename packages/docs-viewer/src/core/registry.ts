import type { RenderContext, Renderer } from "./types";

/**
 * Ordered collection of renderers. The highest-priority renderer whose `match`
 * returns `true` wins; renderers that throw during `match` are skipped.
 */
export class RendererRegistry {
  #renderers: Renderer[] = [];

  register(renderer: Renderer): this {
    this.#renderers = this.#renderers.filter((entry) => entry.id !== renderer.id);
    this.#renderers.push(renderer);
    return this;
  }

  unregister(id: string): this {
    this.#renderers = this.#renderers.filter((entry) => entry.id !== id);
    return this;
  }

  list(): readonly Renderer[] {
    return [...this.#renderers];
  }

  /** All renderers that match `ctx`, ordered by descending priority. */
  candidates(ctx: RenderContext): Renderer[] {
    return this.#renderers
      .filter((renderer) => {
        try {
          return renderer.match(ctx);
        } catch {
          return false;
        }
      })
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  match(ctx: RenderContext): Renderer | undefined {
    return this.candidates(ctx)[0];
  }
}
