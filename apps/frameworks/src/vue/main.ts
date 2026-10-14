import { createApp } from "vue";
import App from "./App.vue";

const host = document.getElementById("preview");
if (host) createApp(App).mount(host);
