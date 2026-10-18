import type { DocsViewerElement, Engine, ViewerConfig } from "@gntrees/docs-viewer";
import { parseQuery } from "@gntrees/docs-viewer/core/config";
import { TAG } from "@gntrees/docs-viewer/core/tag";
import { THEME_CHANGE_EVENT } from "../shared/theme";

const REMOTE_PATTERN = /\.(docx|pptx|xlsx|doc|ppt|xls|odt|odp|ods)$/i;

interface Sample {
  label: string;
  url: string;
}
interface TypeGroup {
  key: string;
  label: string;
  samples: Sample[];
}
interface CodeLang {
  key: string;
  label: string;
  samples: Sample[];
}

/** Sentinel Type value that reveals the Language dropdown. */
const CODE_KEY = "code";

/** Type value for content-type based detection (sets `type: "auto"`). */
const AUTO_KEY = "auto";

/** Engine keys that make sense for each playground type (`auto` is added first). */
const ENGINES_BY_TYPE: Record<string, string[]> = {
  [AUTO_KEY]: [
    "iframe",
    "panzoom",
    "native",
    "shiki",
    "microsoft-docs-viewer",
    "google-docs-viewer",
  ],
  pdf: ["iframe", "google-docs-viewer"],
  word: ["microsoft-docs-viewer", "google-docs-viewer"],
  excel: ["microsoft-docs-viewer", "google-docs-viewer"],
  powerpoint: ["microsoft-docs-viewer", "google-docs-viewer"],
  image: ["panzoom", "native", "google-docs-viewer"],
  video: ["native", "google-docs-viewer"],
  audio: ["native"],
  text: ["shiki", "google-docs-viewer"],
  table: ["table", "shiki", "google-docs-viewer"],
  markup: ["markup", "shiki", "google-docs-viewer"],
  font: ["font", "google-docs-viewer"],
  archive: ["archive", "google-docs-viewer"],
  [CODE_KEY]: ["shiki", "google-docs-viewer"],
};

/** Human labels for the Engine select. */
const ENGINE_LABELS: Record<string, string> = {
  auto: "auto (recommended)",
  iframe: "iframe — native PDF",
  panzoom: "panzoom — image zoom/pan",
  native: "native — plain <img>",
  shiki: "shiki — code highlight",
  table: "table — CSV/TSV grid",
  markup: "markup — HTML / Markdown",
  font: "font — specimen",
  archive: "archive — ZIP/RAR/TAR listing",
  hls: "hls — HLS.js streaming",
  "microsoft-docs-viewer": "microsoft-docs-viewer",
  "google-docs-viewer": "google-docs-viewer",
};

/** Frameworks offered in the code-preview dropdown, with their Shiki language id. */
const FRAMEWORKS: Array<{ key: string; label: string; lang: string }> = [
  { key: "html", label: "Plain JS / HTML", lang: "html" },
  { key: "react", label: "React", lang: "tsx" },
  { key: "preact", label: "Preact", lang: "tsx" },
  { key: "vue", label: "Vue", lang: "vue" },
  { key: "svelte", label: "Svelte", lang: "svelte" },
  { key: "solid", label: "Solid", lang: "tsx" },
];

/** Non-code file types (all samples are public https URLs). */
const TYPES: TypeGroup[] = [
  {
    key: AUTO_KEY,
    label: "Auto (detect)",
    samples: [
      {
        label: "JPEG (no extension)",
        url: "https://httpbingo.org/image/jpeg",
      },
      {
        label: "PNG (no extension)",
        url: "https://httpbingo.org/image/png",
      },
      {
        label: "SVG (no extension)",
        url: "https://httpbingo.org/image/svg",
      },
      {
        label: "Plain text (no extension)",
        url: "https://httpbingo.org/base64/SFRUUEJJTiBpcyBhd2Vzb21l",
      },
      {
        label: "JSON (no extension)",
        url: "https://httpbingo.org/json",
      },
      {
        label: "PDF",
        url: "https://www.orimi.com/pdf-test.pdf",
      },
      {
        label: "Word (docx)",
        url: "https://filesamples.com/samples/document/docx/sample2.docx",
      },
      {
        label: "Excel (xlsx)",
        url: "https://filesamples.com/samples/document/xlsx/sample2.xlsx",
      },
      {
        label: "PowerPoint (pptx)",
        url: "https://raw.githubusercontent.com/apache/poi/trunk/test-data/slideshow/pie-chart.pptx",
      },
    ],
  },
  {
    key: "pdf",
    label: "PDF",
    samples: [
      {
        label: "pdf.js sample",
        url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
      },
      {
        label: "pdfobject sample",
        url: "https://pdfobject.com/pdf/sample.pdf",
      },
      {
        label: "css4.pub textbook",
        url: "https://css4.pub/2015/textbook/somatosensory.pdf",
      },
    ],
  },
  {
    key: "word",
    label: "Docs (Word)",
    samples: [
      { label: "Calibre demo", url: "https://calibre-ebook.com/downloads/demos/demo.docx" },
      {
        label: "filesamples sample1",
        url: "https://filesamples.com/samples/document/docx/sample1.docx",
      },
      {
        label: "filesamples sample3",
        url: "https://filesamples.com/samples/document/docx/sample3.docx",
      },
    ],
  },
  {
    key: "excel",
    label: "Excel",
    samples: [
      {
        label: "filesamples sample1",
        url: "https://filesamples.com/samples/document/xlsx/sample1.xlsx",
      },
      {
        label: "filesamples sample3",
        url: "https://filesamples.com/samples/document/xlsx/sample3.xlsx",
      },
      {
        label: "Apache POI SampleSS",
        url: "https://raw.githubusercontent.com/apache/poi/trunk/test-data/spreadsheet/SampleSS.xlsx",
      },
    ],
  },
  {
    key: "powerpoint",
    label: "PPT (PowerPoint)",
    samples: [
      {
        label: "Apache POI SampleShow",
        url: "https://raw.githubusercontent.com/apache/poi/trunk/test-data/slideshow/SampleShow.pptx",
      },
      {
        label: "Apache POI bar-chart",
        url: "https://raw.githubusercontent.com/apache/poi/trunk/test-data/slideshow/bar-chart.pptx",
      },
    ],
  },
  {
    key: "image",
    label: "Image",
    samples: [
      {
        label: "Wikimedia PNG (transparency)",
        url: "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png",
      },
      {
        label: "Wikimedia JPEG (portrait)",
        url: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Gull_portrait_ca_usa.jpg",
      },
      {
        label: "Large JPEG (pan/zoom)",
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Fronalpstock_big.jpg/1280px-Fronalpstock_big.jpg",
      },
      {
        label: "Animated GIF",
        url: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Newtons_cradle_animation_book_2.gif",
      },
      {
        label: "Animated GIF (transparent)",
        url: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Animhorse.gif",
      },
      {
        label: "Animated GIF (large, ~1 MB)",
        url: "https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif",
      },
      {
        label: "SVG (vector)",
        url: "https://upload.wikimedia.org/wikipedia/commons/0/02/SVG_logo.svg",
      },
      {
        label: "Photoshop PSD (Google fallback)",
        url: "https://raw.githubusercontent.com/psd-tools/psd-tools/main/tests/psd_files/1layer.psd",
      },
      {
        label: "AutoCAD DXF (Google fallback)",
        url: "https://raw.githubusercontent.com/mozman/ezdxf/master/examples/edgeminer/1_polylines.dxf",
      },
    ],
  },
  {
    key: "video",
    label: "Video",
    samples: [
      {
        label: "Big Buck Bunny (10s)",
        url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
      },
      {
        label: "Jellyfish (10s)",
        url: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4",
      },
      {
        label: "Big Buck Bunny 1080p (heavy, ~30 MB)",
        url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_30MB.mp4",
      },
      {
        label: "HLS stream — Mux x36xhzz (.m3u8)",
        url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      },
      {
        label: "HLS stream — Tears of Steel (.m3u8)",
        url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
      },
      {
        label: "Live HLS video (seek: buffer only)",
        url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
      },
    ],
  },
  {
    key: "audio",
    label: "Audio",
    samples: [
      {
        label: "Short MP3 (MDN, ~39 KB)",
        url: "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
      },
      {
        label: "Short OGG (Google sounds, ~25 KB)",
        url: "https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg",
      },
      {
        label: "Example OGG (Wikimedia, ~105 KB)",
        url: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg",
      },
      {
        label: "SoundHelix Song 1 (heavy, ~8.9 MB)",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      },
      {
        label: "Live audio stream (buffer-only seek)",
        url: "https://stream.radioparadise.com/mp3-128",
      },
    ],
  },
  {
    key: "text",
    label: "Text",
    samples: [
      {
        label: "Django py3.txt",
        url: "https://raw.githubusercontent.com/django/django/main/tests/requirements/py3.txt",
      },
      {
        label: "express package.json",
        url: "https://raw.githubusercontent.com/expressjs/express/master/package.json",
      },
    ],
  },
  {
    key: "table",
    label: "Table",
    samples: [
      {
        label: "mtcars TSV (small)",
        url: "https://raw.githubusercontent.com/plotly/datasets/master/Dash_Bio/Chromosomal/clustergram_mtcars.tsv",
      },
      {
        label: "Apple stock CSV",
        url: "https://raw.githubusercontent.com/plotly/datasets/master/2014_apple_stock.csv",
      },
      {
        label: "US airport traffic CSV",
        url: "https://raw.githubusercontent.com/plotly/datasets/master/2011_february_us_airport_traffic.csv",
      },
      {
        label: "Global super store TSV (1k rows)",
        url: "https://raw.githubusercontent.com/plotly/datasets/master/global_super_store_orders.tsv",
      },
      {
        label: "Earthquakes CSV (heavy, ~23k rows)",
        url: "https://raw.githubusercontent.com/plotly/datasets/master/earthquakes-23k.csv",
      },
    ],
  },
  {
    key: "markup",
    label: "Markup (HTML / Markdown)",
    samples: [
      {
        label: "markup-demo.md (headings, table, code, task list)",
        url: "https://raw.githubusercontent.com/gntrees/docs-viewer/gh-pages/samples/markup-demo.md",
      },
      {
        label: "markup-demo.html (self-contained page)",
        url: "https://raw.githubusercontent.com/gntrees/docs-viewer/gh-pages/samples/markup-demo.html",
      },
      {
        label: "MDN beginner-html-site (index.html)",
        url: "https://raw.githubusercontent.com/mdn/beginner-html-site/gh-pages/index.html",
      },
      {
        label: "TypeScript README.md",
        url: "https://raw.githubusercontent.com/microsoft/TypeScript/main/README.md",
      },
      {
        label: "github/gitignore README.md",
        url: "https://raw.githubusercontent.com/github/gitignore/main/README.md",
      },
    ],
  },
  {
    key: "font",
    label: "Font",
    samples: [
      {
        label: "Lato Regular TTF",
        url: "https://raw.githubusercontent.com/google/fonts/main/ofl/lato/Lato-Regular.ttf",
      },
      {
        label: "IBM Plex Sans Regular TTF",
        url: "https://raw.githubusercontent.com/IBM/plex/master/packages/plex-sans/fonts/complete/ttf/IBMPlexSans-Regular.ttf",
      },
      {
        label: "IBM Plex Sans Regular OTF",
        url: "https://raw.githubusercontent.com/IBM/plex/master/packages/plex-sans/fonts/complete/otf/IBMPlexSans-Regular.otf",
      },
      {
        label: "IBM Plex Sans Regular WOFF2",
        url: "https://raw.githubusercontent.com/IBM/plex/master/packages/plex-sans/fonts/complete/woff2/IBMPlexSans-Regular.woff2",
      },
    ],
  },
  {
    key: "archive",
    label: "Archive",
    samples: [
      {
        label: "archive-demo.zip (docs, csv, video, office, nested)",
        url: "https://raw.githubusercontent.com/gntrees/docs-viewer/gh-pages/samples/archive-demo.zip",
      },
      {
        label: "corpus.zip (nested archives)",
        url: "https://raw.githubusercontent.com/libarchive/libarchive/master/contrib/oss-fuzz/corpus.zip",
      },
      {
        label: "zipdir.zip (folders)",
        url: "https://raw.githubusercontent.com/python/cpython/main/Lib/test/archivetestdata/zipdir.zip",
      },
      {
        label: "Mixed Paths.zip",
        url: "https://raw.githubusercontent.com/nodejs/node/main/deps/zlib/google/test/data/Mixed%20Paths.zip",
      },
      {
        label: "empty.zip (0 items)",
        url: "https://raw.githubusercontent.com/nodejs/node/main/deps/zlib/google/test/data/empty.zip",
      },
      {
        label: "FolderTest.rar (folders)",
        url: "https://raw.githubusercontent.com/YuJianrong/node-unrar.js/master/testFiles/FolderTest.rar",
      },
      {
        label: "FileEncByName.rar (encrypted)",
        url: "https://raw.githubusercontent.com/YuJianrong/node-unrar.js/master/testFiles/FileEncByName.rar",
      },
      {
        label: "WithComment.rar",
        url: "https://raw.githubusercontent.com/YuJianrong/node-unrar.js/master/testFiles/WithComment.rar",
      },
      {
        label: "testtar.tar (TAR, long names, PAX)",
        url: "https://raw.githubusercontent.com/python/cpython/3.11/Lib/test/testtar.tar",
      },
    ],
  },
];

/** Every code file type, shown in the Language dropdown when Type is "Code". */
const CODE_LANGS: CodeLang[] = [
  {
    key: "typescript",
    label: "TypeScript",
    samples: [
      {
        label: "vitest cli.ts",
        url: "https://raw.githubusercontent.com/vitest-dev/vitest/main/packages/vitest/src/node/cli.ts",
      },
      {
        label: "type-fest except.d.ts",
        url: "https://raw.githubusercontent.com/sindresorhus/type-fest/main/source/except.d.ts",
      },
    ],
  },
  {
    key: "javascript",
    label: "JavaScript",
    samples: [
      {
        label: "express lib/express.js",
        url: "https://raw.githubusercontent.com/expressjs/express/master/lib/express.js",
      },
      {
        label: "express lib/application.js",
        url: "https://raw.githubusercontent.com/expressjs/express/master/lib/application.js",
      },
    ],
  },
  {
    key: "json",
    label: "JSON",
    samples: [
      {
        label: "type-fest package.json",
        url: "https://raw.githubusercontent.com/sindresorhus/type-fest/main/package.json",
      },
      {
        label: "vitest package.json",
        url: "https://raw.githubusercontent.com/vitest-dev/vitest/main/package.json",
      },
    ],
  },
  {
    key: "markdown",
    label: "Markdown",
    samples: [
      {
        label: "vitest README.md",
        url: "https://raw.githubusercontent.com/vitest-dev/vitest/main/README.md",
      },
      {
        label: "type-fest readme.md",
        url: "https://raw.githubusercontent.com/sindresorhus/type-fest/main/readme.md",
      },
    ],
  },
  {
    key: "html",
    label: "HTML",
    samples: [
      {
        label: "HTML5 Boilerplate index.html",
        url: "https://raw.githubusercontent.com/h5bp/html5-boilerplate/main/dist/index.html",
      },
    ],
  },
  {
    key: "css",
    label: "CSS",
    samples: [
      {
        label: "normalize.css",
        url: "https://raw.githubusercontent.com/necolas/normalize.css/master/normalize.css",
      },
    ],
  },
  {
    key: "python",
    label: "Python",
    samples: [
      {
        label: "requests __init__.py",
        url: "https://raw.githubusercontent.com/psf/requests/main/src/requests/__init__.py",
      },
      {
        label: "requests api.py",
        url: "https://raw.githubusercontent.com/psf/requests/main/src/requests/api.py",
      },
    ],
  },
  {
    key: "go",
    label: "Go",
    samples: [
      {
        label: "golang/example hello.go",
        url: "https://raw.githubusercontent.com/golang/example/master/hello/hello.go",
      },
      {
        label: "gin gin.go",
        url: "https://raw.githubusercontent.com/gin-gonic/gin/master/gin.go",
      },
    ],
  },
  {
    key: "rust",
    label: "Rust",
    samples: [
      {
        label: "TheAlgorithms bubble_sort.rs",
        url: "https://raw.githubusercontent.com/TheAlgorithms/Rust/master/src/sorting/bubble_sort.rs",
      },
      {
        label: "TheAlgorithms merge_sort.rs",
        url: "https://raw.githubusercontent.com/TheAlgorithms/Rust/master/src/sorting/merge_sort.rs",
      },
    ],
  },
  {
    key: "shell",
    label: "Shell",
    samples: [
      {
        label: "oh-my-zsh install.sh",
        url: "https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh",
      },
      {
        label: "oh-my-zsh oh-my-zsh.sh",
        url: "https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/oh-my-zsh.sh",
      },
    ],
  },
];

const DEFAULT_TYPE = AUTO_KEY;
const DEFAULT_SOURCE = "https://httpbingo.org/image/jpeg";

/** URL-safe base64 of a UTF-8 string (matches the library's `?config=` decoder). */
function encodeBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * The viewer module is imported on demand: importing it registers the custom
 * element, and its exported `highlightCode` is the very same lazy Shiki the viewer
 * uses for code documents. One loader means the landing page never bundles Shiki
 * twice — and, because it is only reached on activation, never loads it at all
 * until the playground is actually used.
 */
type ViewerModule = typeof import("@gntrees/docs-viewer");
let viewerModulePromise: Promise<ViewerModule> | null = null;

function loadViewerModule(): Promise<ViewerModule> {
  if (!viewerModulePromise) viewerModulePromise = import("@gntrees/docs-viewer");
  return viewerModulePromise;
}

/** Shiki theme matching the active page theme. */
function shikiTheme(): string {
  const attr = document.documentElement.dataset.theme;
  if (attr === "dark") return "github-dark";
  if (attr === "light") return "github-light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "github-dark" : "github-light";
}

/** Build a ready-to-paste usage snippet for `framework` from the current config. */
function buildSnippet(framework: string, config: Record<string, unknown>): string {
  const json = JSON.stringify(config, null, 2);
  switch (framework) {
    case "react":
      return `import { DocsViewer } from "@gntrees/docs-viewer/react";

const config = ${json};

export function App() {
  return <DocsViewer {...config} />;
}`;
    case "preact":
      return `import { DocsViewer } from "@gntrees/docs-viewer/preact";

const config = ${json};

export function App() {
  return <DocsViewer {...config} />;
}`;
    case "solid":
      return `import { DocsViewer } from "@gntrees/docs-viewer/solid";

const config = ${json};

export function App() {
  return <DocsViewer {...config} />;
}`;
    case "svelte":
      return `<script>
import { docsViewer } from "@gntrees/docs-viewer/svelte";

const config = ${json};
</script>

<div style="height: 100%" use:docsViewer={config}></div>`;
    case "vue":
      return `<script setup>
import { DocsViewer } from "@gntrees/docs-viewer/vue";

const config = ${json};
</script>

<template>
  <DocsViewer :config="config" />
</template>`;
    default:
      return `<script type="module">
import "@gntrees/docs-viewer";

const config = ${json};

document.querySelector("gnt-docs-viewer").config = config;
</script>

<gnt-docs-viewer></gnt-docs-viewer>`;
  }
}

/**
 * Drop keys whose value equals the built-in default, so a config blob only carries
 * meaningful (non-default) settings.
 */
function pruneDefaults<T extends object>(value: T | undefined, defaults: object): T | null {
  if (!value) return null;
  const fallback = defaults as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val === undefined || val === null || val === "") continue;
    if (key in fallback && JSON.stringify(val) === JSON.stringify(fallback[key])) continue;
    out[key] = val;
  }
  return Object.keys(out).length > 0 ? (out as T) : null;
}

/** Documented defaults for every renderer option (used to prune the config blob). */
const FULL_DEFAULTS = {
  code: { theme: null, lang: null },
  image: { fullscreen: true },
  video: { controls: true, autoplay: false, muted: false, loop: false, poster: null, info: true },
  markup: { sandbox: true, baseUrl: null, gfm: true },
};

/**
 * The advanced config blob. It carries the *advanced* universal knobs
 * (`name`/`entry`/`entryBase`, which the archive resolves automatically and so
 * are no longer needed as readable query params) plus the type-specific options
 * (`code`/`image`/`video`). Only non-empty / non-default values are kept.
 */
function configBlob(state: ViewerConfig): ViewerConfig | null {
  const blob: ViewerConfig = {};
  const name = state.name?.trim();
  if (name) blob.name = name;
  const entry = state.entry?.trim();
  if (entry) blob.entry = entry;
  const entryBase = state.entryBase?.trim();
  if (entryBase) blob.entryBase = entryBase;
  const code = pruneDefaults(state.code, FULL_DEFAULTS.code);
  if (code) blob.code = code;
  const image = pruneDefaults(state.image, FULL_DEFAULTS.image);
  if (image) blob.image = image;
  const video = pruneDefaults(state.video, FULL_DEFAULTS.video);
  if (video) blob.video = video;
  const markup = pruneDefaults(state.markup, FULL_DEFAULTS.markup);
  if (markup) blob.markup = markup;
  return Object.keys(blob).length > 0 ? blob : null;
}

/**
 * The complete config for the JSON editor: every key the viewer understands,
 * filled from the current `state` (so it always matches the current filter).
 * Universal knobs use their query-param names; the rest match `ViewerConfig`.
 */
function fullConfig(state: ViewerConfig): Record<string, unknown> {
  const name = state.name?.trim();
  const entry = state.entry?.trim();
  const entryBase = state.entryBase?.trim();
  return {
    file: state.source ?? null,
    type: state.type ?? AUTO_KEY,
    engine: state.engine ?? "auto",
    theme: state.theme ?? "auto",
    loader: state.loader ?? "auto",
    credentials: state.credentials ?? "same-origin",
    preflight: state.preflight ?? true,
    name: name ? name : null,
    entry: entry ? entry : null,
    entryBase: entryBase ? entryBase : null,
    code: { ...FULL_DEFAULTS.code, ...state.code },
    image: { ...FULL_DEFAULTS.image, ...state.image },
    video: { ...FULL_DEFAULTS.video, ...state.video },
    markup: { ...FULL_DEFAULTS.markup, ...state.markup },
  };
}

/**
 * The config for the generated usage snippet: the same *complete* config as the
 * advanced JSON editor (defaults filled in), with the query-param `file` key
 * mapped to the `source` prop so the snippet is valid code.
 */
function codeConfig(state: ViewerConfig): Record<string, unknown> {
  const { file, ...rest } = fullConfig(state);
  return { source: file ?? null, ...rest };
}

/**
 * URL-driven playground with a full config editor.
 *
 * A single `state` object is the source of truth: the shortcut controls (Type,
 * Language, Sample, Engine, Theme) and the advanced JSON editor both mutate it,
 * and everything is reflected in the preview plus the usage code. The shareable
 * URL puts the universal scalar knobs in the query string (`?file=…&type=…&engine=…`)
 * and the advanced/type-specific config (`name`/`entry`/`entryBase` plus
 * `code`/`image`/`video`) in a base64url `?config=` blob. The JSON editor shows
 * the *complete* config (query knobs + blob) and re-splits it on apply.
 */
export function initPlayground(host: HTMLElement): void {
  const urlInput = document.getElementById("demo-url") as HTMLInputElement | null;
  const typeSelect = document.getElementById("demo-type") as HTMLSelectElement | null;
  const langField = document.getElementById("demo-lang-field");
  const langSelect = document.getElementById("demo-lang") as HTMLSelectElement | null;
  const sampleSelect = document.getElementById("demo-sample") as HTMLSelectElement | null;
  const engineSelect = document.getElementById("demo-engine") as HTMLSelectElement | null;
  const themeSelect = document.getElementById("demo-theme") as HTMLSelectElement | null;
  const shikiNote = document.getElementById("demo-shiki-note");
  const hint = document.getElementById("playground-hint");
  const linkEl = document.getElementById("playground-link");
  const openButton = document.getElementById("playground-open");
  const copyButton = document.getElementById("playground-copy") as HTMLButtonElement | null;
  const configArea = document.getElementById("demo-config") as HTMLTextAreaElement | null;
  const applyButton = document.getElementById("demo-config-apply") as HTMLButtonElement | null;
  const configError = document.getElementById("demo-config-error");
  const advancedToggle = document.getElementById("demo-advanced-toggle") as HTMLInputElement | null;
  const advancedDetails = document.getElementById("demo-advanced");
  const codeSelect = document.getElementById("playground-code-lang") as HTMLSelectElement | null;
  const codeOutput = document.getElementById("playground-code");

  // The viewer element (and the library behind it) is created lazily — see
  // `ensureViewer` — so the landing page does not pay for it before the playground
  // is on screen.
  let viewer: DocsViewerElement | null = null;
  let mountToken = 0;
  let activated = false;

  const setHint = (text: string): void => {
    if (hint) hint.textContent = text;
  };
  const setError = (text: string): void => {
    if (configError) configError.textContent = text;
  };

  /** Surface viewer failures in the playground hint (wired once the element exists). */
  function onViewerError(event: Event): void {
    const detail = (event as CustomEvent<{ error?: unknown }>).detail;
    const message = detail?.error instanceof Error ? detail.error.message : "Unknown error";
    setHint(`Failed to load: ${message}`);
  }

  /** Create the viewer on first use, after the library and its custom element load. */
  async function ensureViewer(): Promise<DocsViewerElement> {
    if (viewer) return viewer;
    await loadViewerModule();
    const element = document.createElement(TAG) as DocsViewerElement;
    element.style.display = "block";
    element.style.width = "100%";
    element.style.height = "100%";
    element.addEventListener("gnt-error", onViewerError);
    host.appendChild(element);
    viewer = element;
    return element;
  }

  const typeOf = (key: string): TypeGroup | undefined => TYPES.find((g) => g.key === key);
  const langOf = (key: string): CodeLang | undefined => CODE_LANGS.find((l) => l.key === key);

  /** Samples for the current Type/Language selection. */
  const samplesFor = (type: string, lang: string): Sample[] =>
    type === CODE_KEY ? langOf(lang)?.samples ?? [] : typeOf(type)?.samples ?? [];

  /** Map a sample URL back to the Type (+ Language) it belongs to. */
  function locate(url: string): { type: string; lang?: string } | undefined {
    const type = TYPES.find((g) => g.samples.some((s) => s.url === url));
    if (type) return { type: type.key };
    const lang = CODE_LANGS.find((l) => l.samples.some((s) => s.url === url));
    if (lang) return { type: CODE_KEY, lang: lang.key };
    return undefined;
  }

  let currentType = DEFAULT_TYPE;
  let currentLang = CODE_LANGS[0]?.key ?? "";
  // Single source of truth, seeded from the URL so shared links round-trip.
  let state: ViewerConfig = { ...parseQuery(window.location.search) };
  if (!state.source) state.source = DEFAULT_SOURCE;

  // The "Advanced settings" toggle only governs whether the advanced panel is shown.
  // Applied JSON is merged straight into `state` (the single source of truth)
  // rather than kept in a separate overlay, so the shortcut controls keep
  // working afterwards — the most recent edit always wins.
  let advancedEnabled = false;

  let currentFramework = FRAMEWORKS[0]?.key ?? "html";
  let codeToken = 0;
  let codeTimer: number | null = null;

  /** Fill the Type select (non-code types + the "Code" sentinel). */
  function populateTypes(): void {
    if (!typeSelect) return;
    typeSelect.replaceChildren();
    for (const entry of TYPES) {
      const option = document.createElement("option");
      option.value = entry.key;
      option.textContent = entry.label;
      typeSelect.appendChild(option);
    }
    const code = document.createElement("option");
    code.value = CODE_KEY;
    code.textContent = "Code";
    typeSelect.appendChild(code);
  }

  /** Fill the Language select (only meaningful when Type is "Code"). */
  function populateLangs(): void {
    if (!langSelect) return;
    langSelect.replaceChildren();
    for (const lang of CODE_LANGS) {
      const option = document.createElement("option");
      option.value = lang.key;
      option.textContent = lang.label;
      langSelect.appendChild(option);
    }
  }

  /** Fill the Framework select for the usage code preview. */
  function populateFrameworks(): void {
    if (!codeSelect) return;
    codeSelect.replaceChildren();
    for (const framework of FRAMEWORKS) {
      const option = document.createElement("option");
      option.value = framework.key;
      option.textContent = framework.label;
      codeSelect.appendChild(option);
    }
    codeSelect.value = currentFramework;
  }

  /** Render the snippet as plain text, inside a `<pre>` so its line breaks survive. */
  function showPlainSnippet(snippet: string): void {
    if (!codeOutput) return;
    const pre = document.createElement("pre");
    pre.textContent = snippet;
    codeOutput.replaceChildren(pre);
  }

  /** Re-highlight the usage snippet for the current config + framework. */
  async function renderCode(): Promise<void> {
    if (!codeOutput) return;
    const token = ++codeToken;
    const framework = FRAMEWORKS.find((entry) => entry.key === currentFramework) ?? FRAMEWORKS[0];
    const snippet = buildSnippet(framework?.key ?? "html", codeConfig(state));

    // Plain text until the playground is used: Shiki (~70 kB gzip) is not worth
    // loading for a block that sits below the fold on first paint.
    if (!activated) {
      showPlainSnippet(snippet);
      return;
    }

    try {
      const { highlightCode } = await loadViewerModule();
      const html = await highlightCode(snippet, framework?.lang ?? "html", shikiTheme());
      if (token === codeToken) codeOutput.innerHTML = html;
    } catch {
      if (token === codeToken) showPlainSnippet(snippet);
    }
  }

  /** Coalesce rapid updates (e.g. typing) into a single highlight pass. */
  function scheduleCode(): void {
    if (codeTimer !== null) window.clearTimeout(codeTimer);
    codeTimer = window.setTimeout(() => {
      codeTimer = null;
      void renderCode();
    }, 120);
  }

  /** Fill the sample select for the current type/language; select `url` when it belongs. */
  function populateSamples(url: string | null): void {
    if (!sampleSelect) return;
    const samples = samplesFor(currentType, currentLang);
    sampleSelect.replaceChildren();
    for (const sample of samples) {
      const option = document.createElement("option");
      option.value = sample.url;
      option.textContent = sample.label;
      sampleSelect.appendChild(option);
    }
    const custom = document.createElement("option");
    custom.value = "";
    custom.textContent = "Custom…";
    sampleSelect.appendChild(custom);
    sampleSelect.value = url && samples.some((s) => s.url === url) ? url : "";
  }

  /** Engines offered for the current type/sample (`auto` is always first). */
  function enginesFor(type: string, source: string): string[] {
    const engines = ENGINES_BY_TYPE[type] ?? [];
    // HLS only makes sense for `.m3u8` playlists, so expose it per sample.
    if (type === "video" && /\.m3u8?(\?|$)/i.test(source) && !engines.includes("hls")) {
      return ["auto", "hls", ...engines];
    }
    return ["auto", ...engines];
  }

  /** Rebuild the Engine select for the current type, reflecting `state.engine`. */
  function syncEngine(source: string): void {
    if (!engineSelect) return;
    const options = enginesFor(currentType, source);
    const requested = state.engine?.trim() ? state.engine : "auto";
    const valid = options.includes(requested);

    // Rebuild only when the option set actually changes.
    const current = Array.from(engineSelect.options).map((option) => option.value);
    if (current.length !== options.length || current.some((value, i) => value !== options[i])) {
      engineSelect.replaceChildren();
      for (const key of options) {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = ENGINE_LABELS[key] ?? key;
        engineSelect.appendChild(option);
      }
    }

    // An engine that does not fit the current type falls back to `auto`.
    if (!valid) state.engine = "auto";
    engineSelect.value = valid ? requested : "auto";
  }

  /**
   * Push the current `state` into every control, the JSON editor, the preview and
   * the shareable URL. Routing every update through one function keeps the filter
   * dropdowns, the File URL input, the config editor, the preview and the URL in
   * sync no matter which one the user touched.
   */
  function syncAll(syncHistory = true): void {
    const source = (state.source ?? "").trim();

    // Derive the Type/Language filter: a known sample URL wins; otherwise honour
    // an explicit `type` lock / `code.lang` from the URL or the JSON editor.
    const loc = locate(source);
    const lockedType = state.type?.trim();
    if (loc) {
      currentType = loc.type;
      if (loc.lang) currentLang = loc.lang;
    } else if (lockedType === CODE_KEY || (state.code?.lang && langOf(state.code.lang))) {
      currentType = CODE_KEY;
      if (state.code?.lang && langOf(state.code.lang)) currentLang = state.code.lang;
    } else if (lockedType && lockedType !== AUTO_KEY && TYPES.some((g) => g.key === lockedType)) {
      currentType = lockedType;
    } else {
      currentType = AUTO_KEY;
    }

    // Keep the invariant: `state.type` mirrors the Type lock (dropdown keys) so the
    // viewer detection is locked, and `code.lang` tracks the Language control.
    state.type = currentType === AUTO_KEY ? AUTO_KEY : currentType;
    if (currentType === CODE_KEY) {
      state.code = { ...state.code, lang: currentLang };
    } else if (state.code?.lang) {
      const code = { ...state.code };
      delete code.lang;
      state.code = code;
    }

    if (urlInput) urlInput.value = state.source ?? "";
    if (typeSelect) typeSelect.value = currentType;
    if (langField) langField.hidden = currentType !== CODE_KEY;
    if (langSelect) langSelect.value = currentLang;
    if (themeSelect) themeSelect.value = state.theme ?? "auto";
    // The Shiki note only matters for code/text, where the shiki engine applies.
    if (shikiNote) shikiNote.hidden = currentType !== CODE_KEY && currentType !== "text";
    if (advancedToggle) advancedToggle.checked = advancedEnabled;
    if (advancedDetails) advancedDetails.hidden = !advancedEnabled;
    populateSamples(source);
    syncEngine(source);
    refreshJson();
    scheduleCode();

    render(syncHistory);
  }

  /** Rewrite the JSON editor with the complete config for the current filter. */
  function refreshJson(): void {
    if (configArea) configArea.value = JSON.stringify(fullConfig(state), null, 2);
  }

  function query(): string {
    const params = new URLSearchParams();
    const source = (state.source ?? "").trim();
    if (source) params.set("file", source);

    // Universal scalar knobs → readable query params. Scalars always win over the
    // blob, so this is the single place they live; only non-defaults are emitted.
    const type = (state.type ?? "").trim();
    if (type && type !== AUTO_KEY) params.set("type", type);
    const engine = (state.engine ?? "").trim();
    if (engine && engine !== "auto") params.set("engine", engine);
    if (state.theme && state.theme !== "auto") params.set("theme", state.theme);
    if (state.loader && state.loader !== "auto") params.set("loader", state.loader);
    if (state.credentials && state.credentials !== "same-origin") {
      params.set("credentials", state.credentials);
    }
    if (state.preflight !== undefined && state.preflight !== true) {
      params.set("preflight", String(state.preflight));
    }

    // Advanced + type-specific config → one base64url blob, only when non-default.
    // `name`/`entry`/`entryBase` live here: the archive resolves its own paths, so
    // they are no longer needed as readable query params.
    const blob = configBlob(state);
    if (blob) params.set("config", encodeBase64Url(JSON.stringify(blob)));

    return params.toString();
  }

  const viewerUrl = (): string =>
    `${window.location.origin}${import.meta.env.BASE_URL}view/?${query()}`;

  function syncUrl(replaceHistory = true): void {
    if (linkEl) linkEl.textContent = viewerUrl();
    if (replaceHistory) {
      window.history.replaceState(null, "", `?${query()}${window.location.hash}`);
    }
  }

  function render(syncHistory: boolean): void {
    const source = (state.source ?? "").trim();
    // Archive member deep-links must point at the dedicated viewer route, so the
    // embedded viewer always gets an absolute `entryBase` (the advanced field
    // overrides it). It is injected at runtime only — never persisted into the URL.
    const entryBase =
      (state.entryBase ?? "").trim() || `${window.location.origin}${import.meta.env.BASE_URL}view/`;
    syncUrl(syncHistory);
    if (!source) {
      mountToken += 1; // cancel any in-flight mount
      if (viewer) viewer.config = {};
      setHint("Pick a type/sample or paste a document URL.");
      return;
    }
    const remoteEngine =
      state.engine === "microsoft-docs-viewer" || state.engine === "google-docs-viewer";
    setHint(
      REMOTE_PATTERN.test(source) || remoteEngine
        ? "Remote viewers fetch the file server-side and must be publicly reachable — localhost will not work."
        : "",
    );
    // Until the playground is on screen, keep the library out of the page: this is
    // what drops the viewer core (~28 kB gzip) and Shiki (~82 kB gzip) from the
    // landing page's first paint.
    if (!activated) return;
    void applyViewerConfig({ ...state, entryBase });
  }

  /** Assign `config` once the library and the custom element are ready. */
  async function applyViewerConfig(config: ViewerConfig): Promise<void> {
    const token = ++mountToken;
    try {
      const element = await ensureViewer();
      if (token === mountToken) element.config = config;
    } catch (error) {
      setHint(`Failed to load: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Turn on the expensive half (viewer mount + Shiki highlight) the first time the
   * playground is actually on screen, so the landing page's first paint carries the
   * static HTML/CSS only.
   */
  function activate(): void {
    if (activated) return;
    activated = true;
    render(false);
    scheduleCode();
  }

  /** Arm `activate` for the moment the playground enters the viewport. */
  function observeActivation(target: HTMLElement): void {
    if (typeof IntersectionObserver === "undefined") {
      activate();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        activate();
      }
    });
    observer.observe(target);
  }

  // -- shortcut controls mutate `state` --------------------------------------

  typeSelect?.addEventListener("change", () => {
    currentType = typeSelect.value;
    const first = samplesFor(currentType, currentLang)[0]?.url ?? "";
    if (first) state.source = first;
    syncAll();
  });
  langSelect?.addEventListener("change", () => {
    currentLang = langSelect.value;
    const first = samplesFor(currentType, currentLang)[0]?.url ?? "";
    if (first) state.source = first;
    syncAll();
  });
  sampleSelect?.addEventListener("change", () => {
    // "Custom…" has an empty value and clears the source so a URL can be typed.
    state.source = sampleSelect.value;
    syncAll();
  });
  urlInput?.addEventListener("input", () => {
    state.source = urlInput.value;
    syncAll();
  });
  engineSelect?.addEventListener("change", () => {
    state.engine = engineSelect.value as Engine;
    syncAll();
  });
  themeSelect?.addEventListener("change", () => {
    state.theme = themeSelect.value as ViewerConfig["theme"];
    syncAll();
  });
  codeSelect?.addEventListener("change", () => {
    currentFramework = codeSelect.value;
    scheduleCode();
  });
  advancedToggle?.addEventListener("change", () => {
    advancedEnabled = advancedToggle.checked;
    syncAll();
  });

  // -- full JSON editor -------------------------------------------------------

  applyButton?.addEventListener("click", () => {
    if (!configArea) return;
    try {
      const parsed: unknown = JSON.parse(configArea.value);
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("config must be a JSON object");
      }
      // The editor is the source of truth for the whole config: rebuild `state` from
      // it (`file` maps to `source`), then `syncAll` re-splits query params + blob and
      // re-syncs every control.
      const { file, ...rest } = parsed as Record<string, unknown>;
      const next: ViewerConfig = {};
      if (typeof file === "string") next.source = file;
      Object.assign(next, rest as ViewerConfig);
      state = next;
      setError("");
      syncAll();
    } catch (error) {
      setError(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // -- shareable link ---------------------------------------------------------

  function flashCopied(): void {
    if (!copyButton) return;
    const original = copyButton.textContent;
    copyButton.textContent = "Copied!";
    window.setTimeout(() => {
      copyButton.textContent = original;
    }, 1200);
  }

  async function copyLink(): Promise<void> {
    const url = viewerUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const area = document.createElement("textarea");
      area.value = url;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
      } catch {
        // Ignore — the link stays visible in the field.
      }
      area.remove();
    }
    flashCopied();
  }

  openButton?.addEventListener("click", () => {
    window.open(viewerUrl(), "_blank", "noopener");
  });
  copyButton?.addEventListener("click", () => void copyLink());

  populateTypes();
  populateLangs();
  populateFrameworks();
  document.addEventListener(THEME_CHANGE_EVENT, scheduleCode);
  syncAll();
  observeActivation(host);
}
