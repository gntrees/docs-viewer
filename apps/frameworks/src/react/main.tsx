import type { ViewerConfig } from "@gntrees/docs-viewer";
import { DocsViewer } from "@gntrees/docs-viewer/react";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { mountPlayground } from "../shared/playground";
import { initialConfig } from "../shared/samples";

function App() {
  const [config, setConfig] = useState<ViewerConfig>(initialConfig);

  // Wire the shared controls once and push every change into React state, which
  // re-renders the wrapper with a new config.
  useEffect(() => mountPlayground(setConfig), []);

  return <DocsViewer {...config} />;
}

const host = document.getElementById("preview");
if (host) createRoot(host).render(<App />);
