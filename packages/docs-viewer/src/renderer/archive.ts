import { extractArchiveEntry, listArchive, type ArchiveEntry } from "../core/archive/archive";
import { detect } from "../core/detect";
import { TAG } from "../core/tag";
import type { FileKind, Renderer } from "../core/types";

/**
 * Archive renderer (`engine: "archive"`) — a Google-Drive-like browser for ZIP,
 * RAR and TAR archives.
 *
 * A top-level archive starts as a single "closed" file; clicking it extracts and
 * reveals the listing. The listing has a single breadcrumb header (with a
 * copy-path button and an item count), a filter box and a sortable table.
 * Navigating a folder **or** a nested archive extends that one breadcrumb, and
 * opening a member renders a nested `<gnt-docs-viewer>` below the path — so
 * nothing ever leaves the page. Folders are not deeply pre-fetched: nested
 * archives are extracted on demand from the outermost archive's bytes.
 */

/** Members above this size are not auto-previewed; a "Preview" action is shown instead. */
const PREVIEW_MAX_BYTES = 20 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const isArchiveName = (name: string): boolean => /\.(zip|rar|tar|tgz|tar\.gz|gz)$/i.test(name);

const SVG_NS = "http://www.w3.org/2000/svg";

/** Inline SVG icons (no dependency). `filled` icons paint solid with `currentColor`. */
const ICON_FOLDER =
  '<path d="M4 6a2 2 0 0 1 2-2h3.1a2 2 0 0 1 1.6.8L12 6.6H18a2 2 0 0 1 2 2v8.6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"/>';
const ICON_FILE =
  '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>';
const ICON_ARCHIVE =
  '<path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>';
const ICON_COPY =
  '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>';
const ICON_CHECK = '<path d="M20 6 9 17l-5-5"/>';
const ICON_BACK = '<path d="m15 18-6-6 6-6"/>';
const ICON_CHEVRON_UP = '<path d="m18 15-6-6-6 6"/>';
const ICON_CHEVRON_DOWN = '<path d="m6 9 6 6 6-6"/>';
const ICON_CHEVRONS_UP_DOWN = '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>';
const ICON_OPEN =
  '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>';
const ICON_DOWNLOAD =
  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>';

function icon(inner: string, filled = false): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", filled ? "currentColor" : "none");
  svg.setAttribute("stroke", filled ? "none" : "currentColor");
  svg.setAttribute("stroke-width", "1.75");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = inner;
  return svg;
}

const iconFor = (entry: ArchiveEntry): string =>
  entry.directory ? ICON_FOLDER : isArchiveName(entry.name) ? ICON_ARCHIVE : ICON_FILE;

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
};

/** Show C0/DEL control characters as Unicode control pictures (e.g. `\t` → ␉). */
function displayName(name: string): string {
  return name.replace(/[\u0000-\u001f\u007f]/g, (char) =>
    char === "\u007f" ? "\u2421" : String.fromCharCode(0x2400 + char.charCodeAt(0)),
  );
}

/** A standalone `ArrayBuffer` copy of the bytes (seeds the next nested extraction). */
function toBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
    ? (bytes.buffer as ArrayBuffer)
    : (bytes.slice().buffer as ArrayBuffer);
}

/** A lightweight table: a sticky header row plus a body we repaint on demand. */
function buildGrid(cells: Array<HTMLElement | string>): {
  wrap: HTMLElement;
  tbody: HTMLElement;
  addRow: (cells: Array<HTMLElement | string>) => HTMLTableRowElement;
} {
  const wrap = el("div", "gnt-dv-archive-wrap");
  const table = el("table", "gnt-dv-table-grid gnt-dv-archive-grid");
  const head = el("thead");
  const headRow = el("tr");
  for (const cell of cells) {
    const th = el("th");
    if (typeof cell === "string") th.textContent = cell;
    else th.appendChild(cell);
    headRow.appendChild(th);
  }
  head.appendChild(headRow);
  table.appendChild(head);
  const tbody = el("tbody");
  table.appendChild(tbody);
  wrap.appendChild(table);

  const addRow = (values: Array<HTMLElement | string>): HTMLTableRowElement => {
    const tr = el("tr");
    for (const value of values) {
      const td = el("td");
      if (typeof value === "string") td.textContent = value;
      else td.appendChild(value);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
    return tr;
  };

  return { wrap, tbody, addRow };
}

export const archiveRenderer: Renderer = {
  id: "archive",
  engine: "archive",
  priority: 16,
  match: (ctx) => ctx.kind === "archive",
  mount(container, ctx) {
    const root = el("div", "gnt-dv-archive");
    container.appendChild(root);

    const archiveUrl = ctx.config.source;
    const entryBase = ctx.config.entryBase;
    const archiveName = ctx.name;
    const shareable = Boolean(archiveUrl) && !archiveUrl?.startsWith("blob:");
    /** A deep-linked member path (from the outermost archive), if any. */
    const entryPath = (ctx.config.entry ?? "").replace(/^\/+/, "").replace(/\/+$/, "");

    const controller = new AbortController();
    let disposed = false;

    /** Bytes of the outermost archive (fetched once); nested archives are slices. */
    let rootBytes: ArrayBuffer | null = null;

    /**
     * The drilled path from the outermost archive. A `dir` stays within the
     * current archive; an `archive` step opens a nested archive extracted from
     * its parent — both extend the single breadcrumb.
     */
    type Step =
      | { kind: "dir"; name: string }
      | { kind: "archive"; name: string; bytes: ArrayBuffer; entries: ArchiveEntry[] };

    interface Preview {
      name: string;
      /** Full member path from the outermost archive (for the `?entry=` deep link). */
      memberPath: string;
      kind: FileKind;
      bytes: Uint8Array;
      size: number;
      url: string;
      revoke: () => void;
      mounted: boolean;
    }

    let steps: Step[] = [];
    let topEntries: ArchiveEntry[] | null = null;
    let preview: Preview | null = null;
    let opened = false;
    let filter = "";
    type SortKey = "name" | "modified" | "size";
    let sortKey: SortKey = "name";
    let sortDir: "asc" | "desc" = "asc";

    /** Bytes of the archive that the current listing lives in. */
    const archiveBytes = (): ArrayBuffer => {
      for (let index = steps.length - 1; index >= 0; index -= 1) {
        const step = steps[index];
        if (step && step.kind === "archive") return step.bytes;
      }
      return rootBytes as ArrayBuffer;
    };

    /** Entries of the archive that the current listing lives in. */
    const archiveEntries = (): ArchiveEntry[] => {
      for (let index = steps.length - 1; index >= 0; index -= 1) {
        const step = steps[index];
        if (step && step.kind === "archive") return step.entries;
      }
      return topEntries ?? [];
    };

    /** Folder path *within* the current archive (dirs after the last archive step). */
    const currentPath = (): string[] => {
      const out: string[] = [];
      for (let index = steps.length - 1; index >= 0; index -= 1) {
        const step = steps[index];
        if (!step) continue;
        if (step.kind === "archive") break;
        out.unshift(step.name);
      }
      return out;
    };

    /** Absolute viewer URL that opens `fullPath` in a new page; `null` when local. */
    const entryUrl = (fullPath: string): string | null => {
      if (!shareable || !archiveUrl) return null;
      let url: URL | null = null;
      try {
        if (entryBase) url = new URL(entryBase);
        else if (globalThis.location) url = new URL(globalThis.location.href);
      } catch {
        return null;
      }
      if (!url) return null;
      url.search = "";
      url.hash = "";
      url.searchParams.set("file", archiveUrl);
      url.searchParams.set("entry", fullPath);
      return url.toString();
    };

    /** A breadcrumb segment: label + click target (`onClick` absent on the active one). */
    interface Crumb {
      label: string;
      onClick?: () => void;
    }

    const clearPreview = (): void => {
      preview?.revoke();
      preview = null;
    };

    const copyText = async (button: HTMLButtonElement, value: string): Promise<void> => {
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        // Ignore: the path stays visible in the breadcrumb.
      }
      button.replaceChildren(icon(ICON_CHECK));
      button.dataset.copied = "true";
      setTimeout(() => {
        button.replaceChildren(icon(ICON_COPY));
        delete button.dataset.copied;
      }, 1200);
    };

    const buildHead = (
      crumbs: Crumb[],
      subtitle: string,
      onBack: (() => void) | null,
      copyValue: string,
      trailing?: HTMLElement,
    ): HTMLElement => {
      const head = el("div", "gnt-dv-archive-head");

      const back = el("button", "gnt-dv-archive-back");
      back.type = "button";
      back.appendChild(icon(ICON_BACK));
      back.setAttribute("aria-label", "Back");
      if (onBack) back.addEventListener("click", onBack);
      else {
        back.disabled = true;
        back.setAttribute("aria-disabled", "true");
      }

      const nav = el("nav", "gnt-dv-archive-crumbs");
      crumbs.forEach((crumb, index) => {
        if (index > 0) nav.appendChild(el("span", "gnt-dv-archive-sep")).textContent = "/";
        if (crumb.onClick) {
          const button = el("button", "gnt-dv-archive-crumb");
          button.type = "button";
          button.textContent = crumb.label;
          button.title = crumb.label;
          button.addEventListener("click", crumb.onClick);
          nav.appendChild(button);
        } else {
          const current = el("span", "gnt-dv-archive-crumb");
          current.dataset.active = "true";
          current.textContent = crumb.label;
          current.title = crumb.label;
          nav.appendChild(current);
        }
      });

      const copy = el("button", "gnt-dv-archive-copy");
      copy.type = "button";
      copy.title = "Copy path";
      copy.setAttribute("aria-label", "Copy path");
      copy.appendChild(icon(ICON_COPY));
      copy.addEventListener("click", () => void copyText(copy, copyValue));

      const subEl = el("span", "gnt-dv-archive-sub");
      subEl.textContent = subtitle;

      head.append(back, nav, copy, subEl);
      if (trailing) head.appendChild(trailing);
      return head;
    };

    /** The breadcrumb for the current location (listing folder or preview file). */
    const crumbs = (): Crumb[] => {
      const list: Crumb[] = [
        {
          label: displayName(archiveName),
          onClick: steps.length
            ? () => {
                clearPreview();
                steps = [];
                render();
              }
            : undefined,
        },
      ];
      steps.forEach((step, index) => {
        const isLast = index === steps.length - 1;
        list.push({
          label: displayName(step.name),
          onClick:
            isLast && !preview
              ? undefined
              : () => {
                  clearPreview();
                  steps = steps.slice(0, index + 1);
                  render();
                },
        });
      });
      if (preview) list.push({ label: displayName(preview.name) });
      return list;
    };

    /** The path shown/copied in the header (joined across nested archives). */
    const copiedPath = (): string => {
      const inner = preview ? preview.memberPath : steps.map((step) => step.name).join("/");
      return [archiveName, inner].filter(Boolean).join("/");
    };

    const onBack = (): void => {
      if (preview) {
        clearPreview();
        render();
      } else if (steps.length) {
        steps = steps.slice(0, -1);
        render();
      }
    };

    /** Download a member that is already in memory (the open preview). */
    const downloadPreview = (): void => {
      if (!preview) return;
      const url = URL.createObjectURL(new Blob([preview.bytes as BlobPart]));
      const anchor = el("a");
      anchor.href = url;
      anchor.download = preview.name;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    };

    /** Immediate children of the current folder (unsorted). */
    const children = (): Array<{ name: string; dir: boolean; entry?: ArchiveEntry }> => {
      const path = currentPath();
      const prefix = path.length ? `${path.join("/")}/` : "";
      const map = new Map<string, { name: string; dir: boolean; entry?: ArchiveEntry }>();
      for (const entry of archiveEntries()) {
        if (prefix && !entry.name.startsWith(prefix)) continue;
        const rest = entry.name.slice(prefix.length);
        if (!rest) continue;
        const slash = rest.indexOf("/");
        if (slash === -1) {
          // A real file, or a real (explicitly stored) directory entry.
          map.set(rest, { name: rest, dir: entry.directory, entry });
        } else {
          // A folder inferred from a member path (`dir/file`); keep any real entry.
          const dir = rest.slice(0, slash);
          if (!map.has(dir)) map.set(dir, { name: dir, dir: true });
        }
      }
      return [...map.values()];
    };

    /** Folders first, then by the active sort key/direction. */
    const sortRows = (
      list: Array<{ name: string; dir: boolean; entry?: ArchiveEntry }>,
    ): Array<{ name: string; dir: boolean; entry?: ArchiveEntry }> => {
      const sign = sortDir === "asc" ? 1 : -1;
      const time = (entry?: ArchiveEntry): number => {
        const parsed = entry?.modified ? Date.parse(entry.modified) : Number.NaN;
        return Number.isNaN(parsed) ? 0 : parsed;
      };
      return [...list].sort((a, b) => {
        if (a.dir !== b.dir) return a.dir ? -1 : 1;
        let compare = 0;
        if (sortKey === "size") compare = (a.entry?.size ?? 0) - (b.entry?.size ?? 0);
        else if (sortKey === "modified") compare = time(a.entry) - time(b.entry);
        else compare = a.name.localeCompare(b.name);
        return compare * sign;
      });
    };

    const openDir = (name: string): void => {
      steps = [...steps, { kind: "dir", name }];
      filter = "";
      render();
    };

    /** Try to open `name` as a nested archive; `false` when it is not one. */
    const openNestedArchive = async (name: string): Promise<boolean> => {
      const rel = [...currentPath(), name].join("/");
      try {
        const { bytes } = await extractArchiveEntry(archiveBytes(), rel);
        const listing = await listArchive(toBuffer(bytes));
        if (disposed) return true;
        steps = [...steps, { kind: "archive", name, bytes: toBuffer(bytes), entries: listing.entries }];
        filter = "";
        render();
        return true;
      } catch {
        return false;
      }
    };

    /** Extract a member and render it in a nested viewer below the path. */
    const openFile = async (name: string): Promise<void> => {
      // `rel` is relative to the *current* archive (for extraction); `memberPath`
      // is the full path from the outermost archive (for the `?entry=` deep link).
      // The folder segments are already among `steps`, so never add them twice.
      const rel = [...currentPath(), name].join("/");
      const memberPath = [...steps.map((step) => step.name), name].join("/");
      try {
        const { bytes, name: base } = await extractArchiveEntry(archiveBytes(), rel);
        if (disposed) return;
        clearPreview();
        const info = detect(base, undefined);
        // The blob needs the member's MIME type: an iframe renders a PDF (and a
        // browser picks a sane handler) only when the blob carries `application/pdf`.
        const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: info.mime }));
        preview = {
          name: base,
          memberPath,
          kind: info.kind,
          bytes,
          size: bytes.byteLength,
          url,
          revoke: () => URL.revokeObjectURL(url),
          mounted: bytes.byteLength <= PREVIEW_MAX_BYTES,
        };
        filter = "";
        render();
      } catch (error) {
        if (disposed) return;
        ctx.fail?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    /** Open a member: directories drill in, nested archives list, files preview. */
    const openMember = async (child: { name: string; dir: boolean }): Promise<void> => {
      if (child.dir) {
        openDir(child.name);
        return;
      }
      if (isArchiveName(child.name) && (await openNestedArchive(child.name))) return;
      await openFile(child.name);
    };

    /**
     * Reconstruct the drilled state for a deep-linked `entry` path, so opening a
     * member URL keeps the archive's path section (breadcrumb) and shows the member
     * preview below it. Best effort: an unresolvable segment stops the walk.
     */
    const navigateTo = async (target: string): Promise<void> => {
      const segments = target.split("/").filter(Boolean);
      for (let index = 0; index < segments.length; index += 1) {
        const segment = segments[index];
        if (!segment) continue;
        const isLast = index === segments.length - 1;
        const child = children().find((candidate) => candidate.name === segment);
        if (child?.dir) {
          openDir(segment);
          continue;
        }
        if (isLast) {
          if (!(isArchiveName(segment) && (await openNestedArchive(segment)))) {
            await openFile(segment);
          }
          return;
        }
        if (!(await openNestedArchive(segment))) return;
      }
    };

    /** A centred message box with an optional action button (no preview available). */
    const gateBox = (
      text: string,
      action: { label: string; onClick: () => void } | null,
    ): HTMLElement => {
      const box = el("div", "gnt-dv-archive-gate");
      const info = el("p", "gnt-dv-archive-gate-text");
      info.textContent = text;
      box.appendChild(info);
      if (action) {
        const button = el("button", "gnt-dv-archive-gate-button");
        button.type = "button";
        button.textContent = action.label;
        button.addEventListener("click", action.onClick);
        box.appendChild(button);
      }
      return box;
    };

    /** The nested viewer (or a gate) for the open file. */
    const renderPreview = (): HTMLElement => {
      const wrap = el("div", "gnt-dv-archive-preview");
      const current = preview;
      if (!current) return wrap;

      // Office files are served by remote viewers that need a publicly reachable
      // URL — impossible for an in-archive blob, so offer a download instead.
      if (current.kind === "office") {
        wrap.appendChild(
          gateBox(
            `${displayName(current.name)} — Word/Excel/PowerPoint can't be previewed inline from an archive. Download it to open in your office app.`,
            null,
          ),
        );
        return wrap;
      }

      if (!current.mounted) {
        wrap.appendChild(
          gateBox(`${formatSize(current.size)} — too large to preview automatically.`, {
            label: "Preview",
            onClick: () => {
              current.mounted = true;
              render();
            },
          }),
        );
        return wrap;
      }

      const viewer = document.createElement(TAG) as HTMLElement & { config: unknown };
      viewer.style.display = "block";
      viewer.style.width = "100%";
      viewer.style.height = "100%";
      viewer.config = { source: current.url, name: current.name, theme: ctx.config.theme };
      wrap.appendChild(viewer);
      return wrap;
    };

    /** Header actions for the open preview: open-in-new-page (deep link) + download. */
    const previewActions = (): HTMLElement => {
      const bar = el("div", "gnt-dv-archive-actions");
      const current = preview;
      if (!current) return bar;
      // A deep link only helps when the target can render on its own page; office
      // files cannot (see `renderPreview`), so only offer the download there.
      const url = current.kind === "office" ? null : entryUrl(current.memberPath);
      if (url) {
        const open = el("a", "gnt-dv-archive-action");
        open.href = url;
        open.target = "_blank";
        open.rel = "noopener";
        open.title = "Open in new page";
        open.setAttribute("aria-label", "Open in new page");
        open.appendChild(icon(ICON_OPEN));
        bar.appendChild(open);
      }
      const download = el("button", "gnt-dv-archive-action");
      download.type = "button";
      download.title = "Download";
      download.setAttribute("aria-label", "Download");
      download.appendChild(icon(ICON_DOWNLOAD));
      download.addEventListener("click", downloadPreview);
      bar.appendChild(download);
      return bar;
    };

    const render = (): void => {
      if (!opened) return;
      const list = children();

      const head = buildHead(
        crumbs(),
        preview ? formatSize(preview.size) : `${list.length} item${list.length === 1 ? "" : "s"}`,
        preview || steps.length ? onBack : null,
        copiedPath(),
        preview ? previewActions() : undefined,
      );

      if (preview) {
        root.replaceChildren(head, renderPreview());
        return;
      }

      const search = el("input", "gnt-dv-archive-search") as HTMLInputElement;
      search.type = "search";
      search.placeholder = "Filter…";
      search.value = filter;
      search.setAttribute("aria-label", "Filter files");
      head.appendChild(search);

      const sortHead = (label: string, key: SortKey): HTMLElement => {
        const active = sortKey === key;
        const button = el("button", "gnt-dv-archive-sort");
        button.type = "button";
        button.dataset.active = active ? "true" : "false";
        button.title = `Sort by ${label.toLowerCase()}`;
        const text = el("span", "gnt-dv-archive-sort-label");
        text.textContent = label;
        const arrow = el("span", "gnt-dv-archive-sort-arrow");
        arrow.appendChild(
          icon(
            active
              ? sortDir === "desc"
                ? ICON_CHEVRON_DOWN
                : ICON_CHEVRON_UP
              : ICON_CHEVRONS_UP_DOWN,
          ),
        );
        button.append(text, arrow);
        button.addEventListener("click", () => {
          if (sortKey === key) sortDir = sortDir === "asc" ? "desc" : "asc";
          else {
            sortKey = key;
            sortDir = "asc";
          }
          render();
        });
        return button;
      };

      const grid = buildGrid([
        sortHead("Name", "name"),
        sortHead("Last modified", "modified"),
        sortHead("Size", "size"),
      ]);

      const paint = (): void => {
        grid.tbody.replaceChildren();
        const needle = filter.trim().toLowerCase();
        const rows = sortRows(children());
        let shown = 0;
        for (const child of rows) {
          if (needle && !child.name.toLowerCase().includes(needle)) continue;

          const nameCell = el("span", "gnt-dv-archive-name");
          const iconEl = el("span", "gnt-dv-archive-icon");
          iconEl.appendChild(
            icon(child.dir ? ICON_FOLDER : child.entry ? iconFor(child.entry) : ICON_FILE, child.dir),
          );
          nameCell.appendChild(iconEl);

          const button = el("button", "gnt-dv-archive-link");
          button.type = "button";
          button.textContent = displayName(child.name);
          button.title = child.dir ? "Open folder" : "Open";
          button.addEventListener("click", () => void openMember(child));
          nameCell.appendChild(button);

          const row = grid.addRow([
            nameCell,
            formatDate(child.entry?.modified),
            child.dir ? "—" : formatSize(child.entry?.size ?? 0),
          ]);
          if (child.dir) row.className = "gnt-dv-archive-dir";
          row.lastElementChild?.classList.add("gnt-dv-num");
          shown += 1;
        }
        if (shown === 0) {
          const row = el("tr");
          const cell = el("td", "gnt-dv-archive-empty");
          cell.colSpan = 3;
          cell.textContent = needle ? "No matching files." : "This folder is empty.";
          row.appendChild(cell);
          grid.tbody.appendChild(row);
        }
      };
      paint();
      search.addEventListener("input", () => {
        filter = search.value;
        paint();
      });

      root.replaceChildren(head, grid.wrap);
    };

    const open = async (): Promise<void> => {
      const loading = el("div", "gnt-dv-archive-hint");
      loading.textContent = "Reading archive…";
      root.replaceChildren(loading);
      try {
        const response = await fetch(ctx.displayUrl, { signal: controller.signal });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim());
        const buffer = await response.arrayBuffer();
        const listing = await listArchive(buffer);
        if (disposed) return;
        rootBytes = buffer;
        topEntries = listing.entries;
        steps = [];
        clearPreview();
        filter = "";
        opened = true;
        if (entryPath) await navigateTo(entryPath);
        else render();
      } catch (error) {
        if (disposed) return;
        ctx.fail?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    /**
     * The initial, "closed" view: the archive itself as a single file. Clicking
     * it extracts and reveals the listing (Drive-like).
     */
    const showClosed = async (): Promise<void> => {
      const head = buildHead([{ label: displayName(archiveName) }], "1 item", null, archiveName);
      const grid = buildGrid(["Name", "Last modified", "Size"]);

      const nameCell = el("span", "gnt-dv-archive-name");
      const iconEl = el("span", "gnt-dv-archive-icon");
      iconEl.appendChild(icon(ICON_ARCHIVE));
      const link = el("button", "gnt-dv-archive-link");
      link.type = "button";
      link.textContent = displayName(archiveName);
      link.title = "Extract and list contents";
      link.addEventListener("click", () => void open());
      nameCell.append(iconEl, link);

      const row = grid.addRow([nameCell, "—", "—"]);
      row.className = "gnt-dv-archive-file";
      row.lastElementChild?.classList.add("gnt-dv-num");

      root.replaceChildren(head, grid.wrap);

      // HEAD only fills the size/date columns; never blocks opening.
      try {
        const response = await fetch(archiveUrl ?? ctx.displayUrl, {
          method: "HEAD",
          signal: controller.signal,
        });
        if (disposed) return;
        const cells = row.querySelectorAll("td");
        const length = Number(response.headers.get("content-length"));
        if (cells[1]) {
          cells[1].textContent = formatDate(response.headers.get("last-modified") ?? undefined);
        }
        if (cells[2] && Number.isFinite(length)) cells[2].textContent = formatSize(length);
      } catch {
        // Best-effort metadata only.
      }
    };

    // A nested archive (or a deep-linked `entry`) opens straight into its listing;
    // a top-level archive starts as a closed file you click to extract.
    if (ctx.config.entry) void open();
    else void showClosed();

    return {
      destroy() {
        disposed = true;
        controller.abort();
        clearPreview();
        root.remove();
      },
    };
  },
};
