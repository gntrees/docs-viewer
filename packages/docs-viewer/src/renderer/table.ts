import type { Renderer } from "../types/types";
import { contentBar, type ViewMode } from "../ui/content-bar";
import { highlightCode, shikiLangForExt, shikiTheme } from "./shiki";

/**
 * Delimited-text table renderer (`engine: "table"`).
 *
 * Handles `.csv`/`.tsv`/`.tab` (kind `table`) with a small self-contained
 * RFC 4180 parser — no dependency. It fetches the file (so it needs CORS),
 * sniffs the delimiter, renders a native `<table>` with a sticky header and
 * caps the rows for performance; the rest can be revealed with "Load all".
 * If anything fails it calls `ctx.fail()`, so `auto` falls back to `shiki`
 * (raw highlighted text).
 */

/** Rows rendered up front; the remainder is revealed by the "Load all" button. */
export const TABLE_MAX_ROWS = 1000;

/** Delimiters tried, in preference order, when sniffing the sample lines. */
const DELIMITERS = ["\t", ",", ";", "|"] as const;

interface ParsedTable {
  header: string[];
  body: string[][];
}

/**
 * Drop leading blank lines and `#` comment lines (a common header preamble) so
 * the first real line becomes the table header — e.g. the mtcars TSV starts with
 * `# Name: …` lines before its tab-separated header.
 */
function stripLeadingComments(text: string): string {
  const lines = text.split(/\r\n|\r|\n/);
  let start = 0;
  while (start < lines.length) {
    const line = lines[start]!.trim();
    if (line === "" || line.startsWith("#")) start += 1;
    else break;
  }
  return lines.slice(start).join("\n");
}

/** Count `delimiter` occurrences outside quoted regions on a single line. */
function countDelimiters(line: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && char === delimiter) {
      count += 1;
    }
  }
  return count;
}

/** Choose a delimiter by scanning the first few non-empty lines. */
export function sniffDelimiter(text: string): string {
  const lines = text
    .split(/\r\n|\r|\n/)
    .filter((line) => line.trim() !== "")
    .slice(0, 20);
  let best = ",";
  let bestScore = 0;
  for (const delimiter of DELIMITERS) {
    let score = 0;
    for (const line of lines) score = Math.max(score, countDelimiters(line, delimiter));
    if (score > bestScore) {
      bestScore = score;
      best = delimiter;
    }
  }
  return best;
}

/**
 * Parse delimited text into rows of cells. Handles quoted fields (including
 * embedded delimiters, newlines and `""` escapes) and CRLF/CR/LF line endings.
 */
export function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = (): void => {
    row.push(field);
    field = "";
  };
  const pushRow = (): void => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      pushField();
    } else if (char === "\n") {
      pushRow();
    } else if (char === "\r") {
      if (text[i + 1] === "\n") i += 1;
      pushRow();
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) pushRow();

  return rows;
}

/** Split into a header row and body rows, skipping a comment/blank preamble. */
export function parseTable(text: string): ParsedTable {
  const clean = stripLeadingComments(text.replace(/^\uFEFF/, ""));
  if (clean.trim() === "") return { header: [], body: [] };
  const delimiter = sniffDelimiter(clean);
  const rows = parseDelimited(clean, delimiter).filter(
    (row) => !(row.length === 1 && row[0] === ""),
  );
  return { header: rows[0] ?? [], body: rows.slice(1) };
}

/** A cell that is purely a number, so it can be right-aligned. */
function isNumeric(value: string): boolean {
  return value !== "" && /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value.trim());
}

export const tableRenderer: Renderer = {
  id: "table",
  engine: "table",
  priority: 16,
  match: (ctx) => ctx.kind === "table",
  mount(container, ctx) {
    const root = document.createElement("div");
    root.className = "gnt-dv-table";
    let raw: string | null = null;
    let mode: ViewMode = "rendered";
    const bar = contentBar({
      name: ctx.name,
      source: ctx.source ?? ctx.displayUrl,
      getText: () => raw,
      toggle: {
        active: "rendered",
        onChange(next): void {
          mode = next;
          paint();
        },
      },
    });
    root.appendChild(bar.root);
    const bodyEl = document.createElement("div");
    bodyEl.className = "gnt-dv-table-body";
    root.appendChild(bodyEl);
    container.appendChild(root);

    const showPlain = (text: string): void => {
      const pre = document.createElement("pre");
      pre.className = "gnt-dv-text";
      pre.textContent = text;
      bodyEl.replaceChildren(pre);
    };
    showPlain("Loading…");

    const renderTable = (text: string): void => {
      const { header, body: rows } = parseTable(text);
      if (header.length === 0) {
        showPlain(text);
        return;
      }

      const wrap = document.createElement("div");
      wrap.className = "gnt-dv-table-wrap";

      const table = document.createElement("table");
      table.className = "gnt-dv-table-grid";

      const head = document.createElement("thead");
      const headRow = document.createElement("tr");
      for (const cell of header) {
        const th = document.createElement("th");
        th.textContent = cell;
        headRow.appendChild(th);
      }
      head.appendChild(headRow);
      table.appendChild(head);

      const tbody = document.createElement("tbody");
      table.appendChild(tbody);

      let columns = header.length;
      for (const row of rows) if (row.length > columns) columns = row.length;
      const makeRow = (cells: string[]): HTMLTableRowElement => {
        const tr = document.createElement("tr");
        for (let c = 0; c < columns; c++) {
          const td = document.createElement("td");
          const value = cells[c] ?? "";
          td.textContent = value;
          if (isNumeric(value)) td.className = "gnt-dv-num";
          tr.appendChild(td);
        }
        return tr;
      };

      for (const cells of rows.slice(0, TABLE_MAX_ROWS)) tbody.appendChild(makeRow(cells));
      wrap.appendChild(table);
      bodyEl.replaceChildren(wrap);

      if (rows.length > TABLE_MAX_ROWS) {
        const note = document.createElement("div");
        note.className = "gnt-dv-table-note";

        const label = document.createElement("span");
        label.textContent = `Showing ${TABLE_MAX_ROWS} of ${rows.length} rows.`;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "gnt-dv-table-action";
        button.textContent = "Load all";
        button.addEventListener("click", () => {
          const frag = document.createDocumentFragment();
          for (const cells of rows.slice(TABLE_MAX_ROWS)) frag.appendChild(makeRow(cells));
          tbody.appendChild(frag);
          note.remove();
        });

        note.append(label, button);
        bodyEl.appendChild(note);
      }
    };

    /** Paint the current view: the rendered `<table>` or the Shiki-highlighted source. */
    const paint = (): void => {
      if (raw == null) return;
      if (mode === "source") renderSource(raw);
      else renderTable(raw);
    };

    const controller = new AbortController();
    let disposed = false;
    let sourceToken = 0;

    /** Source view: rendered with the same Shiki styling as text/code, plain fallback first. */
    const renderSource = (text: string): void => {
      const token = ++sourceToken;
      showPlain(text);
      void highlightCode(text, shikiLangForExt(ctx.ext), shikiTheme(ctx.config))
        .then((html) => {
          if (disposed || token !== sourceToken || mode !== "source") return;
          // Same scroller wrapper as the text/code renderer, so the source view
          // scrolls on our own div instead of inside the highlighted pre.
          const scroll = document.createElement("div");
          scroll.className = "gnt-dv-code-scroll gnt-dv-code-block";
          scroll.innerHTML = html;
          bodyEl.replaceChildren(scroll);
        })
        .catch(() => {
          // Highlighting is best-effort; the plain text stays as a fallback.
        });
    };

    void (async () => {
      try {
        const response = await fetch(ctx.displayUrl, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`.trim());
        }
        raw = await response.text();
        if (disposed) return;
        bar.refresh();
        paint();
      } catch (error) {
        if (disposed) return;
        ctx.fail?.(error instanceof Error ? error : new Error(String(error)));
      }
    })();

    return {
      destroy() {
        disposed = true;
        controller.abort();
        root.remove();
      },
    };
  },
};
