import { initPlayground } from "../playground/playground";
import { initTheme } from "../shared/theme";

initTheme();

const playgroundHost = document.getElementById("playground-host");
if (playgroundHost) initPlayground(playgroundHost);
