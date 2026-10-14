import { initTheme } from "./theme";
import { buildOverview, sections, type Block, type DocSection } from "./docs-content";
import { markdownFileName, sectionToMarkdown } from "./docs-markdown";

const GITHUB_URL = "https://github.com/gntrees/docs-viewer";
const GITHUB_ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>';

initTheme();

/** Render a text run with `inline code`, **bold** and [links](url) as real DOM nodes. */
function appendInline(parent: HTMLElement, text: string): void {
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parent.appendChild(document.createTextNode(text.slice(last, match.index)));
    }
    const token = match[0];
    if (token.startsWith("`")) {
      const code = document.createElement("code");
      code.textContent = token.slice(1, -1);
      parent.appendChild(code);
    } else if (token.startsWith("**")) {
      const strong = document.createElement("strong");
      strong.textContent = token.slice(2, -2);
      parent.appendChild(strong);
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (link) {
        const href = link[2] ?? "#";
        const anchor = document.createElement("a");
        anchor.textContent = link[1] ?? "";
        anchor.href = href;
        // Markdown files exist to be downloaded (e.g. for an agent), so a click
        // saves the file instead of navigating to the raw text.
        if (/\.md(?:[?#]|$)/.test(href)) {
          const name = href.split("/").pop() ?? "";
          anchor.setAttribute("download", name);
          anchor.setAttribute("title", `Download ${name}`);
          anchor.setAttribute("aria-label", `Download ${name}`);
        }
        parent.appendChild(anchor);
      }
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    parent.appendChild(document.createTextNode(text.slice(last)));
  }
}

function renderBlock(block: Block): HTMLElement {
  switch (block.type) {
    case "p": {
      const p = document.createElement("p");
      appendInline(p, block.text);
      return p;
    }
    case "h": {
      const h = document.createElement("h3");
      h.textContent = block.text;
      return h;
    }
    case "code": {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = block.code;
      pre.appendChild(code);
      return pre;
    }
    case "list": {
      const ul = document.createElement("ul");
      for (const item of block.items) {
        const li = document.createElement("li");
        appendInline(li, item);
        ul.appendChild(li);
      }
      return ul;
    }
    case "table": {
      const wrap = document.createElement("div");
      wrap.className = "table-wrap";
      const table = document.createElement("table");

      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      for (const heading of block.head) {
        const th = document.createElement("th");
        th.textContent = heading;
        headRow.appendChild(th);
      }
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      for (const row of block.rows) {
        const tr = document.createElement("tr");
        for (const cell of row) {
          const td = document.createElement("td");
          td.textContent = cell;
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);

      wrap.appendChild(table);
      return wrap;
    }
    default:
      return document.createElement("div");
  }
}

/** Download / Copy buttons for a section's markdown file. */
function renderActions(section: DocSection): HTMLElement {
  const file = markdownFileName(section);

  const row = document.createElement("div");
  row.className = "docs-actions";

  const download = document.createElement("a");
  download.className = "btn ghost";
  download.href = `./${file}`;
  download.setAttribute("download", file);
  download.textContent = "Download .md";
  row.appendChild(download);

  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "btn ghost";
  copy.textContent = "Copy markdown";
  copy.addEventListener("click", () => void copyMarkdown(section, copy));
  row.appendChild(copy);

  // The Overview doubles as the landing page for the project, so it links out.
  if (section.id === "overview") {
    const github = document.createElement("a");
    github.className = "btn ghost";
    github.href = GITHUB_URL;
    github.target = "_blank";
    github.rel = "noopener";
    github.innerHTML = `${GITHUB_ICON}<span>GitHub</span>`;
    row.appendChild(github);
  }

  return row;
}

async function copyMarkdown(section: DocSection, button: HTMLButtonElement): Promise<void> {
  const markdown = sectionToMarkdown(section);
  try {
    await navigator.clipboard.writeText(markdown);
  } catch {
    const area = document.createElement("textarea");
    area.value = markdown;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
    } catch {
      // Ignore — the markdown is also reachable via the Download link.
    }
    area.remove();
  }

  const original = button.textContent;
  button.textContent = "Copied!";
  window.setTimeout(() => {
    button.textContent = original;
  }, 1200);
}

const toc = document.getElementById("toc");
const content = document.getElementById("content");

if (toc && content) {
  // The synthetic Overview is always first and links to every section's `.md`.
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const allSections: DocSection[] = [
    buildOverview(sections, `${window.location.origin}${basePath}`),
    ...sections,
  ];

  const list = document.createElement("ol");
  const links = new Map<string, HTMLAnchorElement>();

  for (const section of allSections) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${section.id}`;
    link.textContent = section.title;
    li.appendChild(link);
    list.appendChild(li);
    links.set(section.id, link);
  }
  toc.appendChild(list);

  for (const section of allSections) {
    const element = document.createElement("section");
    element.id = section.id;
    const heading = document.createElement("h2");
    heading.textContent = section.title;
    element.appendChild(heading);
    element.appendChild(renderActions(section));
    for (const block of section.blocks) element.appendChild(renderBlock(block));
    content.appendChild(element);
  }

  if (typeof IntersectionObserver !== "undefined") {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          links.forEach((link, key) => {
            link.classList.toggle("active", key === id);
          });
        }
      },
      { rootMargin: "-70px 0px -65% 0px" },
    );
    for (const section of allSections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }
  }
}
