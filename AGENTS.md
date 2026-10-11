# Agent rules

## Testing

**Do not run the full test suite by default.** Run only the test(s) relevant to the
files you changed, then stop. Only run the whole suite when the user explicitly asks
for it, or when the change touches shared/core code that many test files depend on
(e.g. `src/core/types.ts`, `src/core/config.ts`, `src/index.ts`).

Rationale: each test file spins up its own happy-dom environment and the Shiki tests
load the highlighter, so a full run takes ~15s and is mostly redundant for a focused
change. A single file runs in ~2s.

### Run targeted tests

From the repo root, pass file filters to Vitest after `--`:

```sh
bun run --filter @gntrees/docs-viewer test -- tests/detect.test.ts
bun run --filter @gntrees/docs-viewer test -- tests/detect.test.ts tests/shiki.test.ts
```

Filter by test name with `-t`:

```sh
bun run --filter @gntrees/docs-viewer test -- -t "detect"
```

### Which test file to run

| Changed source | Test file |
| --- | --- |
| `src/core/detect.ts` | `tests/detect.test.ts` |
| `src/core/config.ts` | `tests/config.test.ts` |
| `src/core/preflight.ts` | `tests/preflight.test.ts` |
| `src/core/registry.ts` | `tests/registry.test.ts` |
| `src/element.ts` | `tests/element.test.ts` |
| `src/renderers/shiki.ts` | `tests/shiki.test.ts` |
| `src/renderers/remote.ts` | `tests/remote.test.ts` |

The `apps/web` site has no test suite — verify it with `bun run web:typecheck` and
`bun run web:build` instead.

## UI changes

**Do not verify UI changes with a browser — the user reviews anything visual.**
For any change that affects appearance or layout (CSS, HTML, page markup, viewer
chrome, theme, spacing, etc.), stop after the static checks and leave the visual
verification to the user:

```sh
bun run web:typecheck
bun run web:build
```

Do **not** launch a browser for this, including headless Chrome (`--screenshot`,
`--dump-dom`), screenshots, DOM probes, or `vite preview`. Starting the dev server
is fine when asked (bound it with a timeout so it doesn't hang), but do not drive it
with a browser or second-guess the result visually.

Rationale: the user wants to review UI changes themselves, so browser/screenshot
checks are wasted work (and headless rendering is unreliable here). Keep the loop to
typecheck + build unless the user explicitly asks for a browser check.
