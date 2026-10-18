import type { RenderContext, Renderer, RendererInstance } from "../types/types";

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

/** What a lazy renderer can announce before its implementation is loaded. */
export interface LazyRendererSpec
  extends Pick<Renderer, "id" | "engine" | "priority" | "requiresPublicUrl" | "match"> {
  /** Imports the module that owns the real renderer. */
  load(): Promise<Renderer>;
}

/**
 * A renderer whose implementation is imported the first time it is used.
 *
 * The metadata above stays local so the registry can rank candidates without the
 * module; `load()` resolves it ahead of `mount()`, which the element awaits so the
 * real renderer still builds its DOM synchronously — no empty frame. A caller that
 * mounts *without* awaiting `load()` gets the implementation as soon as it lands,
 * and a failed load is reported through `ctx.fail()` like any other renderer error.
 */
export function lazyRenderer(spec: LazyRendererSpec): Renderer {
  let resolved: Renderer | null = null;
  let pending: Promise<Renderer> | null = null;

  const resolve = (): Promise<Renderer> => {
    if (resolved) return Promise.resolve(resolved);
    if (!pending) {
      pending = spec.load().then(
        (renderer) => {
          resolved = renderer;
          return renderer;
        },
        (error: unknown) => {
          pending = null;
          throw error;
        },
      );
    }
    return pending;
  };

  return {
    id: spec.id,
    engine: spec.engine,
    priority: spec.priority,
    requiresPublicUrl: spec.requiresPublicUrl,
    match: spec.match,
    load: async () => {
      await resolve();
    },
    mount(container, ctx): RendererInstance {
      if (resolved) return resolved.mount(container, ctx);

      let inner: RendererInstance | null = null;
      let disposed = false;
      let latest = ctx;
      void resolve().then(
        (renderer) => {
          if (!disposed) inner = renderer.mount(container, latest);
        },
        (error: unknown) => {
          if (disposed) return;
          latest.fail?.(error instanceof Error ? error : new Error(String(error)));
        },
      );

      return {
        update(next) {
          latest = next;
          return inner?.update?.(next);
        },
        destroy() {
          disposed = true;
          inner?.destroy();
          inner = null;
        },
      };
    },
  };
}
