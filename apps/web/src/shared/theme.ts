const STORAGE_KEY = "gnt-docs-viewer-theme";

/** Dispatched after the theme changes, so listeners (e.g. Shiki) can re-render. */
export const THEME_CHANGE_EVENT = "gnt-theme-change";

/** Wire up the theme toggle, persisting the choice in localStorage. */
export function initTheme(): void {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") {
    document.documentElement.dataset.theme = saved;
  }

  const button = document.getElementById("theme-toggle");
  button?.addEventListener("click", () => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const current = document.documentElement.dataset.theme ?? (prefersDark ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem(STORAGE_KEY, next);
    document.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme: next } }));
  });
}
