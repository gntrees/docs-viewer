import type { Renderer } from "../core/types";

/**
 * PDF rendering via the browser's built-in PDF viewer in an `<iframe>`.
 *
 * This keeps the core dependency-free — no pdf.js. For custom controls, text
 * search or annotations, register your own renderer instead.
 */
export const pdfRenderer: Renderer = {
  id: "pdf",
  engine: "iframe",
  priority: 20,
  match: (ctx) => ctx.kind === "pdf",
  mount(container, ctx) {
    const frame = document.createElement("iframe");
    frame.className = "gnt-dv-frame";
    frame.title = ctx.name;
    let disposed = false;
    frame.addEventListener("error", () => {
      if (!disposed) ctx.fail?.(new Error(`The browser could not display "${ctx.name}".`));
    });
    frame.src = ctx.displayUrl;
    container.appendChild(frame);
    return {
      update(next) {
        frame.src = next.displayUrl;
        frame.title = next.name;
      },
      destroy() {
        disposed = true;
        frame.remove();
      },
    };
  },
};
