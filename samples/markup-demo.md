# Markup demo

A single sample that exercises the **markup** renderer: headings, lists, tables,
code, quotes, links and images. Toggle the content bar's eye/code button to see
the *source* (Shiki-highlighted Markdown).

## Text & emphasis

Regular paragraph text with **bold**, _italic_, ~~strikethrough~~, `inline code`,
and a [link to the Shiki docs](https://shiki.style).

> Blockquotes render with a left border and muted colour.
>
> — the markup renderer

## Lists

- Unordered item
- Another item
  - Nested item
  - One more

1. Ordered item
2. Second item

- [x] Task list item (GFM)
- [ ] A pending task

## Table (GFM)

| Feature   | Engine          | Notes                          |
| --------- | --------------- | ------------------------------ |
| Rendered  | `markup`        | Default view                   |
| Source    | `shiki`         | Highlighted Markdown           |
| Fallback  | `google-docs-viewer` | Only for absolute URLs     |

## Code

```ts
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

```sh
bun add @gntrees/docs-viewer
```

## Image & rule

![SVG logo](https://upload.wikimedia.org/wikipedia/commons/0/02/SVG_logo.svg)

---

Rendered inside a sandboxed iframe, so any script in a document can never run.
