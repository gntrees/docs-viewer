/**
 * A shared top bar for the content renderers (text/code, table, video, audio).
 *
 * It shows the file name (a link to the source when there is a real URL), a
 * copy-link action, an optional view toggle (rendered ⇄ source) and a
 * copy-content action, plus an optional detail line (media format/duration/…).
 *
 * Kept framework-free and dependency-free; renderers build it directly.
 */

/** The two states of the optional view toggle (rendered output ⇄ raw source). */
export type ViewMode = "rendered" | "source";

export interface ContentBarToggle {
  active: ViewMode;
  onChange(next: ViewMode): void;
}

export interface ContentBarOptions {
  name: string;
  /** The document's original URL; the link actions are hidden for a local `blob:`. */
  source?: string;
  /** Text for the copy button; return `null` until loaded. Omit for no copy button. */
  getText?: () => string | null;
  /** Optional rendered ⇄ source toggle (currently only the table renderer). */
  toggle?: ContentBarToggle;
}

export interface ContentBarHandle {
  root: HTMLElement;
  /** A block below the title row (media detail line, future extras). */
  infoSlot: HTMLElement;
  /** Re-read `getText` to update the copy button's enabled state. */
  refresh(): void;
  /** Update the title (name/source) after a config change. */
  setTitle(name: string, source?: string): void;
}

const COPY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
const CHECK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
const LINK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
const EYE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
const CODE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>';

/** A source is copyable/linkable unless it is a local `blob:` (e.g. an archive member). */
function isCopyable(url: string | undefined): url is string {
  return typeof url === "string" && url !== "" && !url.startsWith("blob:");
}

function iconButton(label: string, icon: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "gnt-dv-bar-btn";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.innerHTML = icon;
  return button;
}

/** Copy `value`, flashing a check on `button` (restoring its icon afterwards). */
async function copyWithFeedback(button: HTMLButtonElement, value: string): Promise<void> {
  const restore = button.innerHTML;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Clipboard access can be blocked; still show the feedback.
  }
  button.innerHTML = CHECK_ICON;
  button.dataset.copied = "true";
  window.setTimeout(() => {
    if (button.dataset.copied !== "true") return;
    delete button.dataset.copied;
    button.innerHTML = restore;
  }, 1200);
}

export function contentBar(options: ContentBarOptions): ContentBarHandle {
  const root = document.createElement("div");
  root.className = "gnt-dv-bar";
  const main = document.createElement("div");
  main.className = "gnt-dv-bar-main";
  const infoSlot = document.createElement("div");
  infoSlot.className = "gnt-dv-bar-info";
  root.append(main, infoSlot);

  let name = options.name;
  let source = options.source;

  const linkButton = iconButton("Copy link", LINK_ICON);
  linkButton.addEventListener("click", () => {
    if (isCopyable(source)) void copyWithFeedback(linkButton, source);
  });

  const copyButton = options.getText ? iconButton("Copy content", COPY_ICON) : null;
  if (copyButton && options.getText) {
    const getText = options.getText;
    copyButton.addEventListener("click", () => {
      const text = getText();
      if (text != null) void copyWithFeedback(copyButton, text);
    });
  }

  let toggleButton: HTMLButtonElement | null = null;
  if (options.toggle) {
    const toggle = options.toggle;
    const state: { active: ViewMode } = { active: toggle.active };
    toggleButton = iconButton("", CODE_ICON);
    const syncToggle = (): void => {
      const label = state.active === "rendered" ? "View source" : "View rendered";
      toggleButton!.innerHTML = state.active === "rendered" ? CODE_ICON : EYE_ICON;
      toggleButton!.title = label;
      toggleButton!.setAttribute("aria-label", label);
      toggleButton!.dataset.mode = state.active;
    };
    toggleButton.addEventListener("click", () => {
      state.active = state.active === "rendered" ? "source" : "rendered";
      syncToggle();
      toggle.onChange(state.active);
    });
    syncToggle();
  }

  let titleEl: HTMLElement | null = null;
  const swapTitle = (next: HTMLElement): void => {
    if (titleEl) titleEl.replaceWith(next);
    else main.prepend(next);
    titleEl = next;
  };
  const renderTitle = (): void => {
    if (isCopyable(source)) {
      const link = document.createElement("a");
      link.className = "gnt-dv-bar-name";
      link.textContent = name;
      link.title = name;
      link.href = source;
      link.target = "_blank";
      link.rel = "noopener";
      swapTitle(link);
      return;
    }
    const span = document.createElement("span");
    span.className = "gnt-dv-bar-name";
    span.textContent = name;
    span.title = name;
    swapTitle(span);
  };
  renderTitle();

  main.append(linkButton);
  const grow = document.createElement("span");
  grow.className = "gnt-dv-bar-grow";
  main.appendChild(grow);
  if (toggleButton) main.appendChild(toggleButton);
  if (copyButton) main.appendChild(copyButton);

  const refresh = (): void => {
    linkButton.hidden = !isCopyable(source);
    if (copyButton && options.getText) copyButton.disabled = options.getText() == null;
  };
  refresh();

  return {
    root,
    infoSlot,
    refresh,
    setTitle(nextName: string, nextSource?: string): void {
      name = nextName;
      source = nextSource;
      renderTitle();
      refresh();
    },
  };
}
