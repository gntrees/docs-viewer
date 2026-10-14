import { fileNameFromUrl, mountFromQuery } from "@gntrees/docs-viewer";

const params = new URLSearchParams(window.location.search);
const file = params.get("file") ?? params.get("url") ?? params.get("src");
if (file) document.title = `${fileNameFromUrl(file)} — gntrees docs-viewer`;

const host = document.getElementById("viewer");
if (host) mountFromQuery(host, window.location.search);
