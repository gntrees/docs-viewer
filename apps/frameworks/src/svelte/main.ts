import { mount } from "svelte";
import App from "./App.svelte";

const host = document.getElementById("preview");
if (host) mount(App, { target: host });
