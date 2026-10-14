import type { Renderer } from "../core/types";

/** Native `<img>` rendering for raster and vector images. */
export const imageRenderer: Renderer = {
  id: "image",
  engine: "native",
  priority: 10,
  match: (ctx) => ctx.kind === "image",
  mount(container, ctx) {
    const img = document.createElement("img");
    img.className = "gnt-dv-media";
    img.alt = ctx.name;

    let disposed = false;
    // Some formats (TIFF, HEIC, …) are not decodable by every browser — report
    // failure so the viewer can fall back to the next renderer.
    img.addEventListener("error", () => {
      if (!disposed) ctx.fail?.(new Error(`The browser could not display "${ctx.name}".`));
    });

    img.src = ctx.displayUrl;
    container.appendChild(img);

    return {
      update(next) {
        img.alt = next.name;
        img.src = next.displayUrl;
      },
      destroy() {
        disposed = true;
        img.remove();
      },
    };
  },
};
