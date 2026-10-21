import { initPlayground } from "../playground/playground";
import { initTheme } from "../shared/theme";
import { initSoundtrack } from "./soundtrack";

initTheme();
initSoundtrack();

const playgroundHost = document.getElementById("playground-host");
if (playgroundHost) initPlayground(playgroundHost);
