import type { Renderer } from "../core/types";

/** Last-resort renderer: a message and a download link. Never fails to match. */
export const unsupportedRenderer: Renderer = {
  id: "unsupported",
  priority: -1000,
  match: () => true,
  mount(container, ctx) {
    const wrap = document.createElement("div");
    wrap.className = "gnt-dv-fallback";

    const message = document.createElement("p");
    message.textContent = `No preview available for "${ctx.name}".`;

    const link = document.createElement("a");
    link.href = ctx.displayUrl;
    link.download = ctx.name;
    link.rel = "noopener";
    link.textContent = "Download file";

    wrap.append(message, link);
    container.appendChild(wrap);

    return {
      update(next) {
        link.href = next.displayUrl;
        link.download = next.name;
      },
      destroy() {
        wrap.remove();
      },
    };
  },
};
