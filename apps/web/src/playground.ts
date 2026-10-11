import type { Engine, ViewerConfig } from "@gntrees/docs-viewer";
import { DocsViewerElement, parseQuery, resolveConfig, TAG } from "@gntrees/docs-viewer";
import { THEME_CHANGE_EVENT } from "./theme";

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
  video: ["google-docs-viewer"],
  text: ["shiki", "google-docs-viewer"],
  [CODE_KEY]: ["shiki", "google-docs-viewer"],
};

/** Human labels for the Engine select. */
const ENGINE_LABELS: Record<string, string> = {
  auto: "auto (recommended)",
  iframe: "iframe — native PDF",
  panzoom: "panzoom — image zoom/pan",
  native: "native — plain <img>",
  shiki: "shiki — code highlight",
  "microsoft-docs-viewer": "microsoft-docs-viewer",
  "google-docs-viewer": "google-docs-viewer",
};

/** Frameworks offered in the code-preview dropdown, with their Shiki language id. */
const FRAMEWORKS: Array<{ key: string; label: string; lang: string }> = [
  { key: "html", label: "Plain JS / HTML", lang: "html" },
  { key: "react", label: "React", lang: "tsx" },
  { key: "vue", label: "Vue", lang: "vue" },
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
        label: "SVG (vector)",
        url: "https://upload.wikimedia.org/wikipedia/commons/0/02/SVG_logo.svg",
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
        label: "Apple stock.csv",
        url: "https://raw.githubusercontent.com/plotly/datasets/master/2014_apple_stock.csv",
      },
      {
        label: "Vitest README.md",
        url: "https://raw.githubusercontent.com/vitest-dev/vitest/main/README.md",
      },
      {
        label: "type-fest package.json",
        url: "https://raw.githubusercontent.com/sindresorhus/type-fest/main/package.json",
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
        label: "mdn beginner-html-site",
        url: "https://raw.githubusercontent.com/mdn/beginner-html-site/gh-pages/index.html",
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

interface Highlighter {
  codeToHtml(code: string, options: { lang: string; theme: string }): Promise<string>;
}

/** Shiki is imported lazily so it never lands in the home page's first paint. */
let shikiPromise: Promise<Highlighter> | null = null;

function loadShiki(): Promise<Highlighter> {
  if (!shikiPromise) {
    shikiPromise = import("shiki").then((mod) => mod as unknown as Highlighter);
  }
  return shikiPromise;
}

/** Shiki theme matching the active page theme. */
function shikiTheme(): string {
  const attr = document.documentElement.dataset.theme;
  if (attr === "dark") return "github-dark";
  if (attr === "light") return "github-light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "github-dark" : "github-light";
}

/** Build a ready-to-paste usage snippet for `framework` from the current config. */
function buildSnippet(framework: string, config: ViewerConfig): string {
  const json = JSON.stringify(config, null, 2);
  switch (framework) {
    case "react":
      return `import { DocsViewer } from "@gntrees/docs-viewer/react";

const config = ${json};

export function App() {
  return <DocsViewer config={config} />;
}`;
    case "solid":
      return `import { DocsViewer } from "@gntrees/docs-viewer/solid";

const config = ${json};

export function App() {
  return <DocsViewer config={config} />;
}`;
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
 * URL-driven playground with a full config editor.
 *
 * A single `state` object is the source of truth: the shortcut controls (Type,
 * Language, Sample, Engine) and the JSON editor all mutate it, and everything is
 * reflected in the preview plus the usage code. The shareable URL always carries
 * `file`; the base64 `config` blob is added only while the advanced editor is in
 * use, so shortcut-only links stay a plain `?file=…`.
 */
export function initPlayground(host: HTMLElement): void {
  const urlInput = document.getElementById("demo-url") as HTMLInputElement | null;
  const typeSelect = document.getElementById("demo-type") as HTMLSelectElement | null;
  const langField = document.getElementById("demo-lang-field");
  const langSelect = document.getElementById("demo-lang") as HTMLSelectElement | null;
  const sampleSelect = document.getElementById("demo-sample") as HTMLSelectElement | null;
  const engineSelect = document.getElementById("demo-engine") as HTMLSelectElement | null;
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

  const viewer = document.createElement(TAG) as DocsViewerElement;
  viewer.style.display = "block";
  viewer.style.width = "100%";
  viewer.style.height = "100%";
  host.appendChild(viewer);

  const setHint = (text: string): void => {
    if (hint) hint.textContent = text;
  };
  const setError = (text: string): void => {
    if (configError) configError.textContent = text;
  };

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

  // Config applied from the advanced JSON editor. It only takes effect while the
  // "Advanced settings" toggle is on; otherwise the shortcut controls win.
  let advanced: ViewerConfig | null = null;
  let advancedEnabled = false;

  let currentFramework = FRAMEWORKS[0]?.key ?? "html";
  let codeToken = 0;
  let codeTimer: number | null = null;

  const effectiveConfig = (): ViewerConfig =>
    advancedEnabled && advanced ? { ...state, ...advanced } : state;

  const resolvedConfig = () => resolveConfig(effectiveConfig());

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

  /** Re-highlight the usage snippet for the current config + framework. */
  async function renderCode(): Promise<void> {
    if (!codeOutput) return;
    const token = ++codeToken;
    const framework = FRAMEWORKS.find((entry) => entry.key === currentFramework) ?? FRAMEWORKS[0];
    const snippet = buildSnippet(framework?.key ?? "html", resolvedConfig());

    let shiki: Highlighter;
    try {
      shiki = await loadShiki();
    } catch {
      if (token === codeToken) codeOutput.textContent = snippet;
      return;
    }

    try {
      const html = await shiki.codeToHtml(snippet, {
        lang: framework?.lang ?? "html",
        theme: shikiTheme(),
      });
      if (token === codeToken) codeOutput.innerHTML = html;
    } catch {
      if (token === codeToken) codeOutput.textContent = snippet;
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

  /** Engines offered for the current type (`auto` is always first). */
  function enginesFor(type: string): string[] {
    return ["auto", ...(ENGINES_BY_TYPE[type] ?? [])];
  }

  /** Rebuild the Engine select for the current type, reflecting `state.engine`. */
  function syncEngine(): void {
    if (!engineSelect) return;
    const options = enginesFor(currentType);
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

    // Derive the Type/Language filter from the source — a known sample URL wins,
    // otherwise fall back to an explicit `code.lang`.
    const loc = locate(source);
    if (loc) {
      currentType = loc.type;
      if (loc.lang) currentLang = loc.lang;
    } else if (state.code?.lang && langOf(state.code.lang)) {
      currentType = CODE_KEY;
      currentLang = state.code.lang;
    } else if (state.type === "auto") {
      currentType = AUTO_KEY;
    }

    // Keep the invariant: `code.lang` tracks the Type/Language controls.
    if (currentType === CODE_KEY) {
      state.code = { ...state.code, lang: currentLang };
    } else if (state.code?.lang) {
      const code = { ...state.code };
      delete code.lang;
      state.code = code;
    }

    // Keep the invariant: `state.type` is `"auto"` while the Auto type is selected,
    // without clobbering an explicit non-auto type set in the JSON editor.
    if (currentType === AUTO_KEY) {
      if (!state.type || state.type === "auto") state.type = "auto";
    } else if (state.type === "auto") {
      delete state.type;
    }

    if (urlInput) urlInput.value = state.source ?? "";
    if (typeSelect) typeSelect.value = currentType;
    if (langField) langField.hidden = currentType !== CODE_KEY;
    if (langSelect) langSelect.value = currentLang;
    // The Shiki note only matters for code/text, where the shiki engine applies.
    if (shikiNote) shikiNote.hidden = currentType !== CODE_KEY && currentType !== "text";
    if (advancedToggle) advancedToggle.checked = advancedEnabled;
    if (advancedDetails) advancedDetails.hidden = !advancedEnabled;
    populateSamples(source);
    syncEngine();
    refreshJson();
    scheduleCode();

    render(syncHistory);
  }

  /** Rewrite the JSON editor from the current state (every field, with defaults). */
  function refreshJson(): void {
    if (configArea) configArea.value = JSON.stringify(resolvedConfig(), null, 2);
  }

  function query(): string {
    const params = new URLSearchParams();
    const source = (state.source ?? "").trim();
    if (source) params.set("file", source);
    // The `config` blob is tied to the advanced editor: with the shortcuts alone the
    // shared link stays a plain `?file=…` and the viewer auto-detects everything.
    if (advancedEnabled) {
      params.set("config", encodeBase64Url(JSON.stringify(effectiveConfig())));
    }
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
    const config = effectiveConfig();
    viewer.config = source ? config : {};
    syncUrl(syncHistory);
    if (!source) {
      setHint("Pick a type/sample or paste a document URL.");
      return;
    }
    const remoteEngine =
      config.engine === "microsoft-docs-viewer" || config.engine === "google-docs-viewer";
    setHint(
      REMOTE_PATTERN.test(source) || remoteEngine
        ? "Remote viewers fetch the file server-side and must be publicly reachable — localhost will not work."
        : "",
    );
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
      advanced = parsed as ViewerConfig;
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

  viewer.addEventListener("gnt-error", (event) => {
    const detail = (event as CustomEvent<{ error?: unknown }>).detail;
    const message = detail?.error instanceof Error ? detail.error.message : "Unknown error";
    setHint(`Failed to load: ${message}`);
  });

  populateTypes();
  populateLangs();
  populateFrameworks();
  document.addEventListener(THEME_CHANGE_EVENT, scheduleCode);
  syncAll();
}
