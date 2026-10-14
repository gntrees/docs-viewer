import type { ViewerConfig } from "@gntrees/docs-viewer";
import { DocsViewer } from "@gntrees/docs-viewer/preact";
import { h, render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { mountPlayground } from "../shared/playground";
import { initialConfig } from "../shared/samples";

// Built with `h()` rather than JSX so this route needs no Preact JSX transform —
// the props become exactly what `<DocsViewer … />` would compile to.
function App() {
  const [config, setConfig] = useState<ViewerConfig>(initialConfig);

  useEffect(() => mountPlayground(setConfig), []);

  return h(DocsViewer, config);
}

const host = document.getElementById("preview");
if (host) render(h(App, {}), host);
