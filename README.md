# gntrees-docs-viewer

Monorepo for a framework-agnostic document viewer.

```
apps/
  web/                Plain Vite site — home page + docs + live demo
packages/
  docs-viewer/        @gntrees/docs-viewer — the library (Web Component)
examples/
  html/               Minimal plain-HTML, URL-driven example
```

## The library: `@gntrees/docs-viewer`

A Web Component (`<gnt-docs-viewer>`) with wrappers for React, Preact, Vue,
Svelte and Solid, and a `standalone` entry that renders from URL query
parameters. See
[`packages/docs-viewer/README.md`](packages/docs-viewer/README.md) for the full
API, configuration and renderer docs.

Quick taste:

```html
<script type="module">
  import "@gntrees/docs-viewer";
</script>
<gnt-docs-viewer source="/report.pdf" engine="iframe"></gnt-docs-viewer>
```

Or straight from a URL:

```
/examples/html/?file=/report.pdf&engine=google-docs-viewer
```

## Commands

```sh
bun install

bun run viewer:build      # build the library to packages/docs-viewer/dist
bun run viewer:dev        # rebuild the library on change
bun run viewer:typecheck  # tsc --noEmit
bun run viewer:test       # vitest

bun run web:dev           # run the Vite site (home + /docs)
bun run web:build         # build the site to apps/web/dist
bun run example:serve     # serve the repo root for the plain-HTML example
```

The Vite site aliases the library to its TypeScript source, so `web:dev` works
without building the library first.
