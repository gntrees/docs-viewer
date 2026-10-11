import type { Block, DocSection } from "./docs-content";

/**
 * Turn the documentation structure into markdown.
 *
 * `docs-content.ts` stays the single source of truth: the docs page renders the
 * same `Block`s, and this module is the inverse of that renderer. It is imported
 * both by the client (Copy / Download buttons) and by the Vite plugin that emits
 * the `.md` files, so the shown text and the files can never diverge.
 */

const FENCE = "```";

function blockToMarkdown(block: Block): string {
  switch (block.type) {
    case "p":
      return block.text;
    case "h":
      return `## ${block.text}`;
    case "code":
      return `${FENCE}\n${block.code}\n${FENCE}`;
    case "list":
      return block.items.map((item) => `- ${item}`).join("\n");
    case "table": {
      const head = `| ${block.head.join(" | ")} |`;
      const separator = `| ${block.head.map(() => "---").join(" | ")} |`;
      const rows = block.rows.map((row) => `| ${row.join(" | ")} |`);
      return [head, separator, ...rows].join("\n");
    }
  }
}

/** JSON-quote a value so it is always a valid YAML scalar. */
function yaml(value: string): string {
  return JSON.stringify(value);
}

/** The file name a section is served and downloaded as (the overview is `index.md`). */
export function markdownFileName(section: DocSection): string {
  return section.id === "overview" ? "index.md" : `${section.id}.md`;
}

/** A standalone markdown document for one section, with YAML frontmatter. */
export function sectionToMarkdown(section: DocSection): string {
  const frontmatter = ["---", `title: ${yaml(section.title)}`];
  if (section.description) frontmatter.push(`description: ${yaml(section.description)}`);
  frontmatter.push("---");

  const body = section.blocks.map(blockToMarkdown).join("\n\n");
  return `${frontmatter.join("\n")}\n\n# ${section.title}\n\n${body}\n`;
}

/** Every section concatenated into a single markdown file. */
export function docsToMarkdown(docs: DocSection[]): string {
  const header = "# @gntrees/docs-viewer\n\nThe complete reference in one file.\n";
  return [header, ...docs.map(sectionToMarkdown)].join("\n\n");
}

/**
 * The Overview as a plain `llms.txt`: the sections' map for an agent, without
 * the markdown frontmatter (the file is served as `text/plain`).
 */
export function overviewToLlmsTxt(section: DocSection): string {
  const body = section.blocks.map(blockToMarkdown).join("\n\n");
  return `# ${section.title}\n\n${body}\n`;
}
