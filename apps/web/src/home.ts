import { initPlayground } from "./playground";
import { initTheme } from "./theme";

initTheme();

const playgroundHost = document.getElementById("playground-host");
if (playgroundHost) initPlayground(playgroundHost);
