import type { ViewerConfig } from "@gntrees/docs-viewer";
import { DocsViewer } from "@gntrees/docs-viewer/solid";
import { createStore, reconcile } from "solid-js/store";
import { render } from "solid-js/web";
import { mountPlayground } from "../shared/playground";
import { initialConfig } from "../shared/samples";

// The Solid wrapper is a plain function (it returns a DOM node) that reads its
// props inside a `createEffect` — but only within a reactive owner. `render()`
// provides that owner, and a store gives the wrapper reactive props, so
// `reconcile` re-applies the config without remounting the element.
const host = document.getElementById("preview");
if (host) {
  const [config, setConfig] = createStore<ViewerConfig>(initialConfig());

  render(() => DocsViewer(config), host);

  mountPlayground((next) => setConfig(reconcile(next)));
}
