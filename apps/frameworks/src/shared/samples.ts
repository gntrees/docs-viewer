import type { Theme, ViewerConfig } from "@gntrees/docs-viewer";

export interface Sample {
  label: string;
  url: string;
}

export interface TypeGroup {
  key: string;
  label: string;
  samples: Sample[];
}

/** Rule value used by the viewer for content-type based detection. */
export const AUTO_KEY = "auto";

/**
 * A trimmed subset of the full playground's samples — enough to exercise every
 * renderer (auto-detect, PDF, Office, media, code/text, table, markup, font,
 * archive) without the extra Language/Engine controls.
 */
export const TYPES: TypeGroup[] = [
  {
    key: AUTO_KEY,
    label: "Auto (detect)",
    samples: [
      { label: "JPEG (no extension)", url: "https://httpbingo.org/image/jpeg" },
      { label: "JSON (no extension)", url: "https://httpbingo.org/json" },
      { label: "PDF", url: "https://www.orimi.com/pdf-test.pdf" },
      { label: "Word (docx)", url: "https://filesamples.com/samples/document/docx/sample2.docx" },
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
      { label: "pdfobject sample", url: "https://pdfobject.com/pdf/sample.pdf" },
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
        label: "Large JPEG (pan/zoom)",
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Fronalpstock_big.jpg/1280px-Fronalpstock_big.jpg",
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
        label: "HLS stream — Mux x36xhzz (.m3u8)",
        url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
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
        label: "Example OGG (Wikimedia, ~105 KB)",
        url: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg",
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
    ],
  },
  {
    key: "markup",
    label: "Markup (HTML / Markdown)",
    samples: [
      {
        label: "markup-demo.md",
        url: "https://raw.githubusercontent.com/gntrees/docs-viewer/gh-pages/samples/markup-demo.md",
      },
      {
        label: "markup-demo.html",
        url: "https://raw.githubusercontent.com/gntrees/docs-viewer/gh-pages/samples/markup-demo.html",
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
        label: "archive-demo.zip",
        url: "https://raw.githubusercontent.com/gntrees/docs-viewer/gh-pages/samples/archive-demo.zip",
      },
      {
        label: "FolderTest.rar",
        url: "https://raw.githubusercontent.com/YuJianrong/node-unrar.js/master/testFiles/FolderTest.rar",
      },
    ],
  },
];

export const THEMES: Array<{ value: Theme; label: string }> = [
  { value: "auto", label: "auto (system)" },
  { value: "light", label: "light" },
  { value: "dark", label: "dark" },
];

/** The initial playground selection: first sample of the first type, auto theme. */
export function initialConfig(): ViewerConfig {
  const group = TYPES[0];
  const sample = group?.samples[0];
  return {
    source: sample?.url ?? "",
    type: group?.key ?? AUTO_KEY,
    theme: "auto",
  };
}
