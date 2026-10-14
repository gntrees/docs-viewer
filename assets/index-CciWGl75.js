const Ut="modulepreload",Nt=function(e){return"/docs-viewer/"+e},De={},K=function(t,n,r){let o=Promise.resolve();if(n&&n.length>0){let c=function(d){return Promise.all(d.map(f=>Promise.resolve(f).then(l=>({status:"fulfilled",value:l}),l=>({status:"rejected",reason:l}))))};document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),s=a?.nonce||a?.getAttribute("nonce");o=c(n.map(d=>{if(d=Nt(d),d in De)return;De[d]=!0;const f=d.endsWith(".css"),l=f?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${l}`))return;const k=document.createElement("link");if(k.rel=f?"stylesheet":Ut,f||(k.as="script"),k.crossOrigin="",k.href=d,s&&k.setAttribute("nonce",s),document.head.appendChild(k),f)return new Promise((v,p)=>{k.addEventListener("load",v),k.addEventListener("error",()=>p(new Error(`Unable to preload CSS for ${d}`)))})}))}function i(a){const s=new Event("vite:preloadError",{cancelable:!0});if(s.payload=a,window.dispatchEvent(s),!s.defaultPrevented)throw a}return o.then(a=>{for(const s of a||[])s.status==="rejected"&&i(s.reason);return t().catch(i)})},Mt="https://view.officeapps.live.com/op/embed.aspx?src=",zt="https://docs.google.com/viewer?embedded=true&url=",G={loader:"auto",credentials:"same-origin",engine:"auto",preflight:!0,theme:"auto",code:{},image:{fullscreen:!0},video:{controls:!0,info:!0},markup:{sandbox:!0,gfm:!0}},At=["auto","blob","direct"];function ot(e){return typeof e=="string"&&At.includes(e)?e:G.loader}function Ne(e){if(typeof e=="boolean")return e;if(typeof e=="string"){const t=e.trim().toLowerCase();if(t==="true"||t==="1"||t==="yes")return!0;if(t==="false"||t==="0"||t==="no")return!1;if(t==="auto")return"auto"}return G.preflight}function Ot(e){return typeof e=="string"&&e.trim()!==""?e.trim():G.engine}const Rt=["omit","include","same-origin"];function _t(e){return typeof e=="string"&&Rt.includes(e)?e:void 0}function it(e){if(typeof e=="string"){const t=e.trim().toLowerCase();if(t==="light"||t==="dark")return t}return G.theme}function It(e){const t=e.replace(/-/g,"+").replace(/_/g,"/"),n=t+"=".repeat((4-t.length%4)%4),r=atob(n),o=Uint8Array.from(r,i=>i.charCodeAt(0));return new TextDecoder().decode(o)}function Dt(e){const t=new URLSearchParams(e.startsWith("?")?e.slice(1):e),n={},r=t.get("config");if(r)try{Object.assign(n,JSON.parse(It(r)))}catch{}const o=t.get("file")??t.get("url")??t.get("src");o&&(n.source=o);const i=t.get("name");i&&(n.name=i);const a=t.get("entry");a&&(n.entry=a);const s=t.get("entryBase");s&&(n.entryBase=s);const c=t.get("theme");c&&(n.theme=it(c));const d=t.get("type");d&&(n.type=d);const f=t.get("loader");f&&(n.loader=ot(f));const l=t.get("credentials");if(l){const u=_t(l);u&&(n.credentials=u)}const k=t.get("engine");k&&(n.engine=k);const v=t.get("preflight");v!==null&&(n.preflight=Ne(v));const p=t.get("lang");return p&&(n.code={...n.code??{},lang:p}),n}function jt(...e){const t={};for(const n of e)n&&Object.assign(t,n);return{source:t.source,name:t.name,entry:t.entry,entryBase:t.entryBase,type:t.type,loader:ot(t.loader),credentials:t.credentials??G.credentials,engine:Ot(t.engine),preflight:Ne(t.preflight),theme:it(t.theme),code:{...G.code,...t.code??{}},image:{...G.image,...t.image??{}},video:{...G.video,...t.video??{}},markup:{...G.markup,...t.markup??{}}}}const ce={pdf:"application/pdf",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",webp:"image/webp",avif:"image/avif",bmp:"image/bmp",ico:"image/x-icon",svg:"image/svg+xml",tif:"image/tiff",tiff:"image/tiff",psd:"image/vnd.adobe.photoshop",dxf:"image/vnd.dxf",ai:"application/postscript",eps:"application/postscript",ps:"application/postscript",txt:"text/plain",md:"text/markdown",log:"text/plain",csv:"text/csv",tsv:"text/tab-separated-values",tab:"text/tab-separated-values",json:"application/json",xml:"application/xml",yml:"text/yaml",yaml:"text/yaml",html:"text/html",htm:"text/html",css:"text/css",js:"text/javascript",mjs:"text/javascript",ts:"text/plain",py:"text/x-python",go:"text/x-go",rs:"text/x-rust",mts:"text/plain",cts:"text/plain",cjs:"text/javascript",jsx:"text/javascript",tsx:"text/plain",jsonc:"application/json",json5:"application/json",mdx:"text/markdown",vue:"text/plain",svelte:"text/plain",scss:"text/x-scss",sass:"text/x-sass",less:"text/x-less",rb:"text/x-ruby",java:"text/x-java",c:"text/x-c",h:"text/x-c",cpp:"text/x-c++",cc:"text/x-c++",cxx:"text/x-c++",hpp:"text/x-c++",cs:"text/x-csharp",php:"text/x-php",swift:"text/x-swift",kt:"text/x-kotlin",kts:"text/x-kotlin",bash:"text/x-shellscript",zsh:"text/x-shellscript",fish:"text/x-shellscript",sql:"text/x-sql",diff:"text/x-diff",patch:"text/x-diff",env:"text/plain",graphql:"text/x-graphql",gql:"text/x-graphql",lua:"text/x-lua",r:"text/x-r",doc:"application/msword",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",xls:"application/vnd.ms-excel",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",ppt:"application/vnd.ms-powerpoint",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",odt:"application/vnd.oasis.opendocument.text",ods:"application/vnd.oasis.opendocument.spreadsheet",odp:"application/vnd.oasis.opendocument.presentation",rtf:"application/rtf",pages:"application/vnd.apple.pages",numbers:"application/vnd.apple.numbers",key:"application/vnd.apple.keynote",ttf:"font/ttf",xps:"application/vnd.ms-xpsdocument",zip:"application/zip",rar:"application/vnd.rar",mp4:"video/mp4",webm:"video/webm",mov:"video/quicktime",m4v:"video/x-m4v",m3u8:"application/vnd.apple.mpegurl",m3u:"application/vnd.apple.mpegurl",mp3:"audio/mpeg",wav:"audio/wav",ogg:"audio/ogg",m4a:"audio/mp4"},Bt=new Set(["png","jpg","jpeg","gif","webp","avif","bmp","ico","svg","tif","tiff","psd","dxf","ai","eps","ps"]),Ft=new Set(["txt","log","json","jsonc","json5","xml","yml","yaml","ini","toml","env","css","scss","sass","less","js","mjs","cjs","jsx","ts","tsx","mts","cts","vue","svelte","py","go","rs","rb","java","c","h","cpp","cc","cxx","hpp","cs","php","swift","kt","kts","sh","bash","zsh","fish","sql","diff","patch","graphql","gql","lua","r"]),$t=new Set(["csv","tsv","tab"]),Pt=new Set(["html","htm","md","markdown","mdx"]),Ht=new Set(["ttf"]),Vt=new Set(["zip","rar","tar","tgz","gz"]),Wt=new Set(["text/plain","application/octet-stream"]),qt=new Set(["doc","docx","xls","xlsx","ppt","pptx","odt","ods","odp","rtf","pages","numbers","key"]),Gt=new Set(["mp4","webm","mov","m4v","avi","mkv","m3u8","m3u"]),Xt=new Set(["mp3","wav","ogg","flac","m4a","aac"]),ye="application/vnd.openxmlformats-officedocument.wordprocessingml.document",je="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",Be="application/vnd.openxmlformats-officedocument.presentationml.presentation",Zt={pdf:{kind:"pdf",mime:"application/pdf"},image:{kind:"image",mime:"image/png"},video:{kind:"video",mime:"video/mp4"},audio:{kind:"audio",mime:"audio/mpeg"},text:{kind:"text",mime:"text/plain"},code:{kind:"text",mime:"text/plain"},table:{kind:"table",mime:"text/csv"},csv:{kind:"table",mime:"text/csv"},markup:{kind:"markup",mime:"text/html"},html:{kind:"markup",mime:"text/html"},htm:{kind:"markup",mime:"text/html"},markdown:{kind:"markup",mime:"text/markdown"},md:{kind:"markup",mime:"text/markdown"},mdx:{kind:"markup",mime:"text/markdown"},font:{kind:"font",mime:"font/ttf"},archive:{kind:"archive",mime:"application/zip"},office:{kind:"office",mime:ye},word:{kind:"office",mime:ye},docs:{kind:"office",mime:ye},excel:{kind:"office",mime:je},spreadsheet:{kind:"office",mime:je},powerpoint:{kind:"office",mime:Be},presentation:{kind:"office",mime:Be}},Kt={"image/":{kind:"image",mime:"image/png"},"video/":{kind:"video",mime:"video/mp4"},"audio/":{kind:"audio",mime:"audio/mpeg"},"text/":{kind:"text",mime:"text/plain"}};function at(e){return e.replace(/^\./,"").trim().toLowerCase()}function Yt(e){return e?e.split(";")[0]?.trim().toLowerCase()??"":""}function Fe(e){if(!e)return"document";try{const n=new URL(e,"http://localhost").pathname.split("/").filter(Boolean).pop();return n?decodeURIComponent(n):"document"}catch{return"document"}}function Qt(e){if(!e)return"";const n=(e.split(/[?#]/)[0]??"").split(/[\\/]/).pop()??"",r=n.lastIndexOf(".");return r<0?"":at(n.slice(r+1))}function te(e){return e==="application/pdf"?"pdf":e==="text/csv"||e==="application/csv"||e==="text/tab-separated-values"?"table":e.startsWith("font/")||e==="application/x-font-ttf"||e==="application/font-sfnt"?"font":e==="application/zip"||e==="application/x-zip-compressed"||e==="application/vnd.rar"||e==="application/x-rar-compressed"||e==="application/x-tar"||e==="application/tar"||e==="application/gzip"||e==="application/x-gzip"?"archive":e==="application/postscript"||e==="application/illustrator"||e==="application/vnd.ms-xpsdocument"||e==="application/oxps"||e.startsWith("image/")?"image":e==="text/html"||e==="text/markdown"||e==="text/x-markdown"?"markup":e.startsWith("text/")?"text":e.startsWith("video/")||e.includes("mpegurl")?"video":e.startsWith("audio/")?"audio":e==="application/json"||e==="application/xml"?"text":e.includes("word")||e.includes("excel")||e.includes("spreadsheetml")||e.includes("presentationml")||e.includes("powerpoint")||e.includes("opendocument")||e==="application/msword"||e==="application/rtf"||e==="application/vnd.apple.pages"||e==="application/vnd.apple.numbers"||e==="application/vnd.apple.keynote"?"office":"unknown"}function $e(e){return e==="pdf"?"pdf":$t.has(e)?"table":Pt.has(e)?"markup":Ht.has(e)?"font":Vt.has(e)?"archive":Bt.has(e)?"image":Ft.has(e)?"text":qt.has(e)?"office":Gt.has(e)?"video":Xt.has(e)?"audio":"unknown"}function Pe(e){return Object.keys(ce).find(t=>ce[t]===e)??""}function Z(e,t,n){const r=Qt(e);let o=r,i=r?ce[r]??"":"",a="unknown";if(t){const s=t.trim(),c=Zt[s.toLowerCase()];if(c)a=c.kind,(!i||te(i)!==c.kind)&&(i=c.mime);else if(s.endsWith("/*")){const d=Kt[s.slice(0,s.indexOf("/")+1).toLowerCase()];d&&(a=d.kind,(!i||te(i)!==d.kind)&&(i=d.mime))}else if(s.includes("/"))i=s.toLowerCase(),a=te(i),o||(o=Pe(i));else{o=at(s);const d=ce[o]??"";d&&(i=d,a=te(i))}}else n&&(i=n,a=te(i),a==="unknown"?i="":o||(o=Pe(i)));if(a==="unknown"&&(o&&(a=$e(o),i||(i=ce[o]??"")),a==="unknown"&&i&&(a=te(i))),!t&&Wt.has(i)&&o){const s=$e(o);s!=="unknown"&&(a=s)}return{kind:a,mime:i||"application/octet-stream",ext:o}}async function Jt(e,t){const n=e.source;if(!n)throw new Error("No document source was provided.");if(e.loader!=="blob")return{displayUrl:n};const r=await fetch(n,{credentials:e.credentials,signal:t});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`.trim());const o=await r.blob(),i=URL.createObjectURL(o);return{displayUrl:i,revoke:()=>URL.revokeObjectURL(i)}}const He=e=>e===404||e===410,Ve=4e3;async function We(e,t,n,r){const o=new AbortController,i=()=>o.abort();n&&(n.aborted?o.abort():n.addEventListener("abort",i,{once:!0}));const a=setTimeout(i,r);try{return await fetch(e,{...t,signal:o.signal})}finally{clearTimeout(a),n?.removeEventListener("abort",i)}}async function en(e,t){try{const n=await We(e,{method:"HEAD",redirect:"follow"},t,Ve);if(He(n.status))return{status:"fail"};const r=n.headers.get("content-type")??void 0;if(n.status===405||n.status===501){const o=await We(e,{headers:{Range:"bytes=0-0"},redirect:"follow"},t,Ve);return He(o.status)?{status:"fail"}:{status:"ok",contentType:o.headers.get("content-type")??r}}return{status:"ok",contentType:r}}catch{return{status:"unknown"}}}class tn{#e=[];register(t){return this.#e=this.#e.filter(n=>n.id!==t.id),this.#e.push(t),this}unregister(t){return this.#e=this.#e.filter(n=>n.id!==t),this}list(){return[...this.#e]}candidates(t){return this.#e.filter(n=>{try{return n.match(t)}catch{return!1}}).sort((n,r)=>(r.priority??0)-(n.priority??0))}match(t){return this.candidates(t)[0]}}const qe="gnt-docs-viewer-styles",nn=`
.gnt-dv-host {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  min-height: var(--gnt-min-height, 360px);
  overflow: hidden;
  background: var(--gnt-bg, #f5f5f5);
  color: var(--gnt-fg, #18181b);
  font-family: var(--gnt-font, system-ui, -apple-system, "Segoe UI", sans-serif);
  font-size: var(--gnt-font-size, 14px);
  --gnt-scrollbar-thumb: rgba(24, 24, 27, 0.32);
  --gnt-scrollbar-thumb-hover: rgba(24, 24, 27, 0.55);
}
.gnt-dv-host[data-theme="dark"] {
  --gnt-bg: #18181b;
  --gnt-fg: #fafafa;
  --gnt-border: #3f3f46;
  --gnt-muted: #a1a1aa;
  --gnt-th-bg: #27272a;
  --gnt-row-alt: rgba(255, 255, 255, 0.04);
  --gnt-row-hover: rgba(255, 255, 255, 0.06);
  --gnt-accent: #a1a1aa;
  --gnt-link: #60a5fa;
  --gnt-scrollbar-thumb: rgba(255, 255, 255, 0.42);
  --gnt-scrollbar-thumb-hover: rgba(255, 255, 255, 0.7);
}
@media (prefers-color-scheme: dark) {
  .gnt-dv-host:not([data-theme="light"]):not([data-theme="dark"]) {
    --gnt-bg: #18181b;
    --gnt-fg: #fafafa;
    --gnt-border: #3f3f46;
    --gnt-muted: #a1a1aa;
    --gnt-th-bg: #27272a;
    --gnt-row-alt: rgba(255, 255, 255, 0.04);
    --gnt-row-hover: rgba(255, 255, 255, 0.06);
    --gnt-accent: #a1a1aa;
    --gnt-link: #60a5fa;
    --gnt-scrollbar-thumb: rgba(255, 255, 255, 0.42);
    --gnt-scrollbar-thumb-hover: rgba(255, 255, 255, 0.7);
  }
}
/* Scrollbars: theme-aware, readable (especially in dark mode) and always
   visible when the content overflows — never the macOS overlay kind that fades
   out. Styling ::-webkit-scrollbar opts Chromium/Safari out of overlay
   scrollbars, so the standard properties are applied to Firefox only (detected
   via -moz-appearance) to keep Chromium on the ::-webkit rules. */
@supports (-moz-appearance: none) {
  .gnt-dv-viewport,
  .gnt-dv-code-body,
  .gnt-dv-table-body,
  .gnt-dv-markup-body,
  .gnt-dv-font-body,
  .gnt-dv-archive-wrap {
    scrollbar-width: thin;
    scrollbar-color: var(--gnt-scrollbar-thumb) transparent;
  }
}
.gnt-dv-host ::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}
.gnt-dv-host ::-webkit-scrollbar-thumb {
  background-color: var(--gnt-scrollbar-thumb);
  border: 3px solid transparent;
  background-clip: padding-box;
  border-radius: 999px;
}
.gnt-dv-host ::-webkit-scrollbar-thumb:hover {
  background-color: var(--gnt-scrollbar-thumb-hover);
}
.gnt-dv-host ::-webkit-scrollbar-track,
.gnt-dv-host ::-webkit-scrollbar-corner {
  background: transparent;
}
.gnt-dv-viewport {
  position: absolute;
  inset: 0;
  overflow: auto;
}
.gnt-dv-frame,
.gnt-dv-media {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
.gnt-dv-media { object-fit: contain; }
video.gnt-dv-media { background: #000; }
audio.gnt-dv-media {
  position: absolute;
  inset: 0;
  margin: auto;
  height: 54px;
  width: min(560px, 88%);
}
.gnt-dv-media-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--gnt-bg, #f5f5f5);
}
.gnt-dv-media-body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
/* In-flow detail line inside the content bar (format/duration/seek/buffer). */
.gnt-dv-media-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-family: var(--gnt-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 11px;
  line-height: 1.4;
  color: var(--gnt-muted, #52525b);
}
.gnt-dv-media-info-line {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.gnt-dv-media-info-action {
  appearance: none;
  flex: none;
  padding: 2px 8px;
  border: 1px solid var(--gnt-border, #e4e4e7);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}
.gnt-dv-media-info-action:hover { background: var(--gnt-row-hover, rgba(0, 0, 0, 0.06)); }
.gnt-dv-media-info-action:disabled {
  opacity: 0.6;
  cursor: default;
}
.gnt-dv-text {
  margin: 0;
  padding: 16px;
  min-height: 100%;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--gnt-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 13px;
  line-height: 1.5;
}

/* Content bar shared by the text/code, table and media renderers. */
.gnt-dv-bar {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--gnt-border, #e4e4e7);
  background: var(--gnt-bg, #f5f5f5);
}
.gnt-dv-bar-main {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.gnt-dv-bar-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--gnt-fg, #18181b);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}
a.gnt-dv-bar-name:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}
.gnt-dv-bar-grow { flex: 1 1 auto; }
.gnt-dv-bar-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--gnt-muted, #52525b);
  cursor: pointer;
}
.gnt-dv-bar-btn:hover:not(:disabled) {
  background: var(--gnt-row-hover, rgba(0, 0, 0, 0.06));
  color: var(--gnt-fg, #18181b);
}
.gnt-dv-bar-btn:disabled { opacity: 0.4; cursor: default; }
.gnt-dv-bar-btn[data-copied="true"] { color: var(--gnt-success, #16a34a); }
.gnt-dv-bar-btn svg { width: 16px; height: 16px; display: block; }
.gnt-dv-bar-info:empty { display: none; }

/* Shiki code renderer (engine: "shiki") — a content bar above a scroller. */
.gnt-dv-code {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.gnt-dv-code-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}
/* Wrapper around the highlighted output. Host page CSS adds overflow to the
   pre, so instead of scrolling inside the pre this wrapper is sized to its
   content and the surrounding body scrolls both axes (vertical + horizontal). */
.gnt-dv-code-scroll {
  display: flex;
  flex-direction: column;
  width: max-content;
  min-width: 100%;
  min-height: 100%;
}
.gnt-dv-code pre,
.gnt-dv-code-block pre {
  flex: 1 0 auto;
  margin: 0;
  padding: 16px;
  min-height: 100%;
  font-family: var(--gnt-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 13px;
  line-height: 1.5;
  tab-size: 2;
  /* Reset host-page pre styling (light DOM leaks in): no border, no radius,
     and no scroll of its own — the wrapper scrolls instead. */
  border: 0;
  border-radius: 0;
  overflow: visible;
}
.gnt-dv-code code,
.gnt-dv-code-block code {
  background: none;
  padding: 0;
  border-radius: 0;
}

/* Table renderer (engine: "table") — native grid with a sticky header. */
.gnt-dv-table {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--gnt-bg, #f5f5f5);
}
.gnt-dv-table-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.gnt-dv-table-grid {
  border-collapse: collapse;
  width: max-content;
  min-width: 100%;
  font-size: 13px;
}
.gnt-dv-table-grid th,
.gnt-dv-table-grid td {
  padding: 6px 10px;
  border: 1px solid var(--gnt-border, #e4e4e7);
  white-space: nowrap;
  text-align: left;
}
.gnt-dv-table-grid thead th {
  position: sticky;
  top: -1px; /* tuck under the collapsed top border so the header sits flush */
  z-index: 1;
  background: var(--gnt-th-bg, #f4f4f5);
  font-weight: 600;
}
.gnt-dv-table-grid tbody tr:nth-child(even) {
  background: var(--gnt-row-alt, rgba(0, 0, 0, 0.03));
}
.gnt-dv-table-grid td.gnt-dv-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.gnt-dv-table-note {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--gnt-bar-bg, rgba(24, 24, 27, 0.86));
  color: var(--gnt-bar-fg, #fafafa);
  font-size: 12px;
}
.gnt-dv-table-action {
  appearance: none;
  padding: 3px 10px;
  border: 0;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.18);
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.gnt-dv-table-action:hover {
  background: rgba(255, 255, 255, 0.32);
}

/* Markup renderer (engine: "markup") — HTML and Markdown, sandboxed by default. */
.gnt-dv-markup {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--gnt-bg, #f5f5f5);
}
.gnt-dv-markup-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}
.gnt-dv-markup-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  /* Opaque neutral canvas so a document with no background of its own does not
     show the viewer's theme background through it (which made dark text
     invisible in dark mode). */
  background: #fff;
}
.gnt-dv-markup-doc {
  padding: 24px;
  color: var(--gnt-fg, #18181b);
  font-size: 15px;
  line-height: 1.65;
  overflow-wrap: break-word;
}
.gnt-dv-markup-doc img,
.gnt-dv-markup-doc video { max-width: 100%; height: auto; }
.gnt-dv-markup-hint {
  margin: 16px;
  color: var(--gnt-muted, #52525b);
  font-size: 13px;
}

/* Panzoom image renderer (engine: "panzoom") — no vendor CSS, a flat solid
   background and a small toolbar built from inline SVG (no background images). */
.gnt-dv-panzoom {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--gnt-bg, #f5f5f5);
}
.gnt-dv-panzoom-stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}
.gnt-dv-panzoom-stage:active {
  cursor: grabbing;
}
.gnt-dv-panzoom-img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  cursor: grab;
  user-select: none;
  -webkit-user-drag: none;
}
.gnt-dv-panzoom-img:active {
  cursor: grabbing;
}
.gnt-dv-panzoom-bar {
  position: absolute;
  left: 50%;
  bottom: 12px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  background: var(--gnt-bar-bg, rgba(24, 24, 27, 0.86));
  color: var(--gnt-bar-fg, #fafafa);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  transform: translateX(-50%);
  cursor: default;
}
.gnt-dv-panzoom-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}
.gnt-dv-panzoom-btn:hover {
  background: var(--gnt-bar-hover, rgba(255, 255, 255, 0.16));
}
.gnt-dv-panzoom-btn[hidden] {
  display: none;
}
.gnt-dv-panzoom-btn:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 1px;
}
.gnt-dv-panzoom-btn svg {
  width: 18px;
  height: 18px;
  display: block;
}

/* Font renderer (engine: "font") */
.gnt-dv-font {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--gnt-bg, #f5f5f5);
}
/* The metadata line sits above the specimen (in-flow) so it never covers it. */
.gnt-dv-font-info {
  flex: none;
  padding: 8px 12px;
  border-bottom: 1px solid var(--gnt-border, #e4e4e7);
  color: var(--gnt-muted, #52525b);
  font-family: var(--gnt-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 11px;
}
.gnt-dv-font-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
}
.gnt-dv-font-hero {
  margin: 0 0 16px;
  font-size: 40px;
  line-height: 1.2;
  word-break: break-word;
}
.gnt-dv-font-ladder {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 12px 0;
}
.gnt-dv-font-row { display: flex; align-items: baseline; gap: 10px; }
.gnt-dv-font-label {
  flex: none;
  width: 46px;
  color: var(--gnt-muted, #52525b);
  font-family: var(--gnt-mono, ui-monospace, monospace);
  font-size: 11px;
}
.gnt-dv-font-glyphs {
  margin: 16px 0 0;
  font-size: 20px;
  line-height: 1.8;
  word-break: break-word;
}

/* Archive renderer (engine: "archive") — Drive-like browser. */
.gnt-dv-archive {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--gnt-bg, #f5f5f5);
}
.gnt-dv-archive-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--gnt-border, #e4e4e7);
}
.gnt-dv-archive-back {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 28px;
  height: 28px;
  margin-right: 2px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--gnt-muted, #52525b);
  cursor: pointer;
}
.gnt-dv-archive-back:hover {
  background: var(--gnt-row-hover, rgba(0, 0, 0, 0.06));
  color: var(--gnt-fg, #18181b);
}
.gnt-dv-archive-back:disabled {
  opacity: 0.35;
  cursor: default;
  background: none;
  color: var(--gnt-muted, #52525b);
}
.gnt-dv-archive-back svg { width: 18px; height: 18px; display: block; }
.gnt-dv-archive-crumbs {
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
}
.gnt-dv-archive-crumb {
  appearance: none;
  border: 0;
  background: none;
  color: var(--gnt-muted, #52525b);
  font: inherit;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 8px;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}
button.gnt-dv-archive-crumb { cursor: pointer; }
button.gnt-dv-archive-crumb:hover {
  background: var(--gnt-row-hover, rgba(0, 0, 0, 0.06));
  color: var(--gnt-fg, #18181b);
}
.gnt-dv-archive-crumb[data-active="true"] { color: var(--gnt-fg, #18181b); font-weight: 600; }
.gnt-dv-archive-sep {
  color: var(--gnt-muted, #71717a);
  opacity: 0.5;
  padding: 0 2px;
  user-select: none;
}
.gnt-dv-archive-copy {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--gnt-muted, #52525b);
  cursor: pointer;
}
.gnt-dv-archive-copy:hover {
  background: var(--gnt-row-hover, rgba(0, 0, 0, 0.06));
  color: var(--gnt-fg, #18181b);
}
.gnt-dv-archive-copy[data-copied="true"] { color: var(--gnt-success, #16a34a); }
.gnt-dv-archive-copy svg { width: 15px; height: 15px; display: block; }
.gnt-dv-archive-sub {
  flex: none;
  color: var(--gnt-muted, #71717a);
  font-size: 12px;
  white-space: nowrap;
}
.gnt-dv-archive-search {
  flex: 0 1 200px;
  min-width: 90px;
  margin-left: auto;
  padding: 5px 10px;
  border: 1px solid var(--gnt-border, #e4e4e7);
  border-radius: 8px;
  background: var(--gnt-input-bg, transparent);
  color: inherit;
  font: inherit;
  font-size: 13px;
}
.gnt-dv-archive-search:focus-visible {
  outline: 2px solid var(--gnt-accent, #a1a1aa);
  outline-offset: 1px;
}
.gnt-dv-archive-wrap { flex: 1; overflow: auto; }
.gnt-dv-archive-name { display: inline-flex; align-items: center; gap: 10px; min-width: 0; }
.gnt-dv-archive-icon {
  flex: none;
  display: inline-flex;
  color: var(--gnt-muted, #71717a);
}
.gnt-dv-archive-icon svg { width: 18px; height: 18px; display: block; }
.gnt-dv-archive-dir .gnt-dv-archive-icon { color: var(--gnt-accent, #52525b); }
.gnt-dv-archive-hint { margin: 16px; color: var(--gnt-muted, #52525b); }
.gnt-dv-archive-error { margin: 16px; color: var(--gnt-danger, #dc2626); }
/* The clickable name: never blue, underlined only on hover/focus. */
.gnt-dv-archive-link,
.gnt-dv-archive-link:link,
.gnt-dv-archive-link:visited {
  appearance: none;
  border: 0;
  padding: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}
.gnt-dv-archive-link:hover,
.gnt-dv-archive-link:focus-visible {
  text-decoration: underline;
  text-underline-offset: 2px;
}
.gnt-dv-archive-link:focus-visible { outline: none; }
.gnt-dv-archive-dir td { color: var(--gnt-fg, inherit); }
.gnt-dv-archive-file .gnt-dv-archive-link { font-weight: 600; }
.gnt-dv-archive-empty {
  text-align: center !important;
  color: var(--gnt-muted, #71717a);
  padding: 28px 12px !important;
}
.gnt-dv-archive-actions {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.gnt-dv-archive-action {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--gnt-muted, #52525b);
  cursor: pointer;
}
.gnt-dv-archive-action:hover {
  background: var(--gnt-row-hover, rgba(0, 0, 0, 0.06));
  color: var(--gnt-fg, #18181b);
}
.gnt-dv-archive-action svg { width: 17px; height: 17px; display: block; }
.gnt-dv-archive-preview {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
.gnt-dv-archive-gate {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  padding: 24px;
  color: var(--gnt-muted, #52525b);
  text-align: center;
}
.gnt-dv-archive-gate-text { margin: 0; font-size: 13px; }
.gnt-dv-archive-gate-button {
  appearance: none;
  padding: 6px 14px;
  border: 1px solid var(--gnt-border, #e4e4e7);
  border-radius: 8px;
  background: var(--gnt-input-bg, transparent);
  color: inherit;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.gnt-dv-archive-gate-button:hover { background: var(--gnt-row-hover, rgba(0, 0, 0, 0.06)); }

/* Archive table: modern, Drive-like — hairline separators, no grid, row hover.
   Scoped to the archive's own table class so these rules never leak into a nested
   viewer's table, which also lives under the archive element. */
.gnt-dv-archive-grid { width: 100%; }
.gnt-dv-archive-grid th,
.gnt-dv-archive-grid td {
  border: 0;
  border-bottom: 1px solid var(--gnt-border, #e4e4e7);
  padding: 10px 12px;
}
.gnt-dv-archive-grid thead th {
  color: var(--gnt-muted, #52525b);
  font-size: 12px;
  font-weight: 500;
  padding-top: 8px;
  padding-bottom: 8px;
}
.gnt-dv-archive-sort {
  appearance: none;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.gnt-dv-archive-sort:hover { color: var(--gnt-fg, #18181b); }
.gnt-dv-archive-sort-arrow {
  display: inline-flex;
  opacity: 0.4; /* semi-transparent sort toggle */
  transition: opacity 120ms ease;
}
.gnt-dv-archive-sort-arrow svg { width: 12px; height: 12px; display: block; }
.gnt-dv-archive-grid thead th:hover .gnt-dv-archive-sort-arrow { opacity: 0.8; }
.gnt-dv-archive-sort[data-active="true"] .gnt-dv-archive-sort-arrow { opacity: 1; }
.gnt-dv-archive-grid tbody tr { cursor: default; }
.gnt-dv-archive-grid tbody tr:hover { background: var(--gnt-row-hover, rgba(0, 0, 0, 0.04)); }

.gnt-dv-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  color: var(--gnt-muted, #52525b);
  text-align: center;
}
.gnt-dv-status {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  background: var(--gnt-bg, #f5f5f5);
  color: var(--gnt-fg, #18181b);
}
.gnt-dv-status[hidden] { display: none; }
.gnt-dv-status[data-state="error"] { color: var(--gnt-danger, #dc2626); }



`;function st(e=document){if(e.getElementById(qe))return;const t=e.createElement("style");t.id=qe,t.textContent=nn,e.head.appendChild(t)}const ct=101010256,rn=33639248,lt=67324752,dt=e=>{const t=new DataView(e);if(e.byteLength<4)return!1;const n=t.getUint32(0,!0);return n===lt||n===ct};function on(e){const t=Math.max(0,e.byteLength-22-65535);for(let n=e.byteLength-22;n>=t;n--)if(e.getUint32(n,!0)===ct)return n;return-1}function ut(e){const t=new DataView(e),n=on(t);if(n<0)throw new Error("Not a ZIP archive (no end-of-central-directory record).");const r=t.getUint16(n+10,!0);let o=t.getUint32(n+16,!0);const i=new TextDecoder,a=[];for(let s=0;s<r&&!(o+46>t.byteLength||t.getUint32(o,!0)!==rn);s++){const c=t.getUint16(o+28,!0),d=t.getUint16(o+30,!0),f=t.getUint16(o+32,!0),l=new Uint8Array(e,o+46,c);a.push({name:i.decode(l),flags:t.getUint16(o+8,!0),method:t.getUint16(o+10,!0),modTime:t.getUint16(o+12,!0),modDate:t.getUint16(o+14,!0),crc32:t.getUint32(o+16,!0),compressedSize:t.getUint32(o+20,!0),uncompressedSize:t.getUint32(o+24,!0),localOffset:t.getUint32(o+42,!0)}),o+=46+c+d+f}return a}const an=e=>e.name.endsWith("/"),pt=e=>(e.flags&1)!==0;async function sn(e){const t=new Blob([e]).stream().pipeThrough(new DecompressionStream("deflate-raw"));return new Uint8Array(await new Response(t).arrayBuffer())}async function cn(e,t){if(pt(t))throw new Error(`"${t.name}" is encrypted.`);const n=new DataView(e);if(t.localOffset+30>e.byteLength||n.getUint32(t.localOffset,!0)!==lt)throw new Error(`Bad local header for "${t.name}".`);const r=n.getUint16(t.localOffset+26,!0),o=n.getUint16(t.localOffset+28,!0),i=t.localOffset+30+r+o,a=new Uint8Array(e,i,t.compressedSize);if(t.method===0)return a.slice();if(t.method===8)return sn(a);throw new Error(`Unsupported compression method ${t.method} for "${t.name}".`)}function ln(e,t){const n=o=>o.replace(/^\/+/,"").replace(/\\/g,"/").replace(/^\.\//,""),r=n(t);return e.find(o=>n(o.name)===r)}const xe=e=>e.split("/").pop()||e,Se=new TextDecoder,X=512,dn=[31,139];function ft(e){if(e.byteLength<2)return!1;const t=new Uint8Array(e,0,2);return dn.every((n,r)=>t[r]===n)}async function ht(e){const t=new Blob([e]).stream().pipeThrough(new DecompressionStream("gzip"));return await new Response(t).arrayBuffer()}function ie(e){const t=e.indexOf(0);return Se.decode(t===-1?e:e.subarray(0,t)).trim()}function Ge(e){if(e.length===0)return 0;if(e[0]&128){let r=e[0]&127;for(let o=1;o<e.length;o++)r=r*256+e[o];return r}const t=ie(e).trim();if(!t)return 0;const n=parseInt(t,8);return Number.isFinite(n)?n:0}const ue=e=>Math.ceil(e/X)*X;function un(e){if(e.length<X)return!1;let t=0;for(let r=0;r<X;r++)t+=r>=148&&r<156?32:e[r];const n=parseInt(ie(e.subarray(148,156)).trim(),8);return t===n?!0:ie(e.subarray(257,262))==="ustar"}function Te(e){return e.byteLength<X?!1:un(new Uint8Array(e,0,X))}function pn(e,t){let n=0;for(;n<e.length;){let r=n;for(;r<e.length&&e[r]!==32;)r+=1;const o=parseInt(Se.decode(e.subarray(n,r)),10);if(!Number.isFinite(o)||o<=0||n+o>e.length)break;const i=Se.decode(e.subarray(r+1,n+o-1)),a=i.indexOf("=");a!==-1&&t.set(i.slice(0,a),i.slice(a+1)),n+=o}}function mt(e,t){const n=new Uint8Array(e);let r=0,o=null;for(;r+X<=n.length;){const i=n.subarray(r,r+X);if(i.every(u=>u===0))break;const a=Ge(i.subarray(124,136)),s=i[156]===0?"0":String.fromCharCode(i[156]),c=r+X;if(s==="L"){o=ie(n.subarray(c,c+a)),r=c+ue(a);continue}if(s==="x"){const u=new Map;pn(n.subarray(c,c+a),u),u.has("path")&&(o=u.get("path")),r=c+ue(a);continue}if(s==="g"){r=c+ue(a);continue}const d=ie(i.subarray(345,500)),f=o??ie(i.subarray(0,100));o=null;const l=d?`${d}/${f}`:f,k=s==="5"||f.endsWith("/"),v=Ge(i.subarray(136,148)),p=v>0?new Date(v*1e3).toISOString():void 0;t({name:l,size:a,directory:k,modified:p,dataOffset:c}),r=c+ue(a)}}function fn(e){const t=[];return mt(e,n=>{t.push({name:n.name,size:n.size,directory:n.directory,modified:n.modified})}),t}function hn(e,t){const n=a=>a.replace(/^\/+/,"").replace(/^\.\//,"").replace(/\/+$/,""),r=n(t),o=new Uint8Array(e);let i;return mt(e,a=>{i||a.directory||n(a.name)===r&&(i=o.subarray(a.dataOffset,a.dataOffset+a.size).slice())}),i}const ke=[82,97,114,33,26,7];function gt(e){if(e.byteLength<ke.length)return!1;const t=new Uint8Array(e,0,ke.length);return ke.every((n,r)=>t[r]===n)}function mn(e,t){const n=1980+(e>>9&127),r=e>>5&15,o=e&31,i=t>>11&31,a=t>>5&63,s=(t&31)*2;if(!r||!o)return;const c=new Date(Date.UTC(n,r-1,o,i,a,s));return Number.isNaN(c.getTime())?void 0:c.toISOString()}let pe=null;function vt(){return pe||(pe=K(()=>import("./unrar-FeNyGrD9.js"),[]).then(e=>fetch(e.default)).then(e=>e.arrayBuffer()).catch(e=>{throw pe=null,e})),pe}function Me(e){const t=e.split("/").filter(n=>n!=="");return t.length===0||t.length>1&&t.some(n=>n==="."||n==="..")?null:t.join("/")}async function gn(e){const{createExtractorFromData:t}=await K(async()=>{const{createExtractorFromData:a}=await import("./index.esm-UZ5OzhGA.js");return{createExtractorFromData:a}},[]),n=await vt(),o=(await t({data:e,wasmBinary:n})).getFileList(),i=[];for(const a of o.fileHeaders){const s=Me(a.name);s!==null&&i.push({name:s,size:a.unpSize,compressedSize:a.packSize,method:a.method,modified:a.time||void 0,encrypted:a.flags.encrypted,directory:a.flags.directory})}return i}function Xe(e){const t=[];for(const n of fn(e)){const r=Me(n.name);r!==null&&t.push({name:r,size:n.size,compressedSize:n.size,method:"store",modified:n.modified,encrypted:!1,directory:n.directory})}return t}async function Ze(e){if(dt(e)){const t=[];for(const n of ut(e)){const r=Me(n.name);r!==null&&t.push({name:r,size:n.uncompressedSize,compressedSize:n.compressedSize,method:n.method===0?"store":n.method===8?"deflate":`m${n.method}`,modified:mn(n.modDate,n.modTime),encrypted:pt(n),directory:an(n)})}return{format:"zip",entries:t}}if(gt(e))return{format:"rar",entries:await gn(e)};if(Te(e))return{format:"tar",entries:Xe(e)};if(ft(e)){const t=await ht(e);if(Te(t))return{format:"tar.gz",entries:Xe(t)};throw new Error("Unsupported gzip payload (expected a .tar inside).")}throw new Error("Unsupported archive format (expected ZIP, RAR or TAR).")}function Ee(e){return e.byteOffset===0&&e.byteLength===e.buffer.byteLength?e.buffer:e.slice().buffer}const vn=e=>e.replace(/^\/+/,"").replace(/\\/g,"/").replace(/^\.\//,"");async function bn(e){const{createExtractorFromData:t}=await K(async()=>{const{createExtractorFromData:r}=await import("./index.esm-UZ5OzhGA.js");return{createExtractorFromData:r}},[]),n=await vt();return{extractor:await t({data:e,wasmBinary:n})}}async function ne(e,t){const n=t.split("/").filter(Boolean);if(n.length===0)throw new Error("No archive entry was specified.");if(dt(e)){const r=ut(e);for(let o=n.length;o>=1;o--){const i=n.slice(0,o).join("/"),a=ln(r,i);if(!a)continue;const s=await cn(e,a);return o===n.length?{bytes:s,name:xe(a.name)}:ne(Ee(s),n.slice(o).join("/"))}throw new Error(`"${t}" was not found in the archive.`)}if(gt(e)){const{extractor:r}=await bn(e),o=[];for(const i of r.getFileList().fileHeaders)o.push(vn(i.name));for(let i=n.length;i>=1;i--){const a=n.slice(0,i).join("/"),s=o.find(d=>d===a);if(!s)continue;const c=r.extract({files:[s]});for(const d of c.files)if(d.extraction)return i===n.length?{bytes:d.extraction,name:xe(s)}:ne(Ee(d.extraction),n.slice(i).join("/"))}throw new Error(`"${t}" was not found in the archive.`)}if(Te(e)){for(let r=n.length;r>=1;r--){const o=n.slice(0,r).join("/"),i=hn(e,o);if(i)return r===n.length?{bytes:i,name:xe(o)}:ne(Ee(i),n.slice(r).join("/"))}throw new Error(`"${t}" was not found in the archive.`)}if(ft(e))return ne(await ht(e),t);throw new Error("Unsupported archive format (expected ZIP, RAR or TAR).")}const ze="gnt-docs-viewer",wn=20*1024*1024;function fe(e){if(!Number.isFinite(e)||e<0)return"—";if(e<1024)return`${e} B`;const t=["KB","MB","GB","TB"];let n=e/1024,r=0;for(;n>=1024&&r<t.length-1;)n/=1024,r+=1;return`${n.toFixed(n>=100?0:1)} ${t[r]}`}function Ke(e){if(!e)return"—";const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleDateString(void 0,{year:"numeric",month:"short",day:"numeric"})}const Ue=e=>/\.(zip|rar|tar|tgz|tar\.gz|gz)$/i.test(e),yn="http://www.w3.org/2000/svg",bt='<path d="M4 6a2 2 0 0 1 2-2h3.1a2 2 0 0 1 1.6.8L12 6.6H18a2 2 0 0 1 2 2v8.6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"/>',wt='<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',yt='<path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',Ye='<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',xn='<path d="M20 6 9 17l-5-5"/>',kn='<path d="m15 18-6-6 6-6"/>',En='<path d="m18 15-6-6-6 6"/>',Cn='<path d="m6 9 6 6 6-6"/>',Ln='<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',Sn='<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',Tn='<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>';function W(e,t=!1){const n=document.createElementNS(yn,"svg");return n.setAttribute("viewBox","0 0 24 24"),n.setAttribute("fill",t?"currentColor":"none"),n.setAttribute("stroke",t?"none":"currentColor"),n.setAttribute("stroke-width","1.75"),n.setAttribute("stroke-linecap","round"),n.setAttribute("stroke-linejoin","round"),n.setAttribute("aria-hidden","true"),n.innerHTML=e,n}const Un=e=>e.directory?bt:Ue(e.name)?yt:wt,C=(e,t)=>{const n=document.createElement(e);return t&&(n.className=t),n};function ee(e){return e.replace(/[\u0000-\u001f\u007f]/g,t=>t===""?"␡":String.fromCharCode(9216+t.charCodeAt(0)))}function Qe(e){return e.byteOffset===0&&e.byteLength===e.buffer.byteLength?e.buffer:e.slice().buffer}function Je(e){const t=C("div","gnt-dv-archive-wrap"),n=C("table","gnt-dv-table-grid gnt-dv-archive-grid"),r=C("thead"),o=C("tr");for(const s of e){const c=C("th");typeof s=="string"?c.textContent=s:c.appendChild(s),o.appendChild(c)}r.appendChild(o),n.appendChild(r);const i=C("tbody");return n.appendChild(i),t.appendChild(n),{wrap:t,tbody:i,addRow:s=>{const c=C("tr");for(const d of s){const f=C("td");typeof d=="string"?f.textContent=d:f.appendChild(d),c.appendChild(f)}return i.appendChild(c),c}}}const Nn={id:"archive",engine:"archive",priority:16,match:e=>e.kind==="archive",mount(e,t){const n=C("div","gnt-dv-archive");e.appendChild(n);const r=t.config.source,o=t.config.entryBase,i=t.name,a=!!r&&!r?.startsWith("blob:"),s=(t.config.entry??"").replace(/^\/+/,"").replace(/\/+$/,""),c=new AbortController;let d=!1,f=null,l=[],k=null,v=null,p=!1,u="",y="name",b="asc";const x=()=>{for(let m=l.length-1;m>=0;m-=1){const h=l[m];if(h&&h.kind==="archive")return h.bytes}return f},L=()=>{for(let m=l.length-1;m>=0;m-=1){const h=l[m];if(h&&h.kind==="archive")return h.entries}return k??[]},U=()=>{const m=[];for(let h=l.length-1;h>=0;h-=1){const w=l[h];if(w){if(w.kind==="archive")break;m.unshift(w.name)}}return m},O=m=>{if(!a||!r)return null;let h=null;try{o?h=new URL(o):globalThis.location&&(h=new URL(globalThis.location.href))}catch{return null}return h?(h.search="",h.hash="",h.searchParams.set("file",r),h.searchParams.set("entry",m),h.toString()):null},R=()=>{v?.revoke(),v=null},Y=async(m,h)=>{try{await navigator.clipboard.writeText(h)}catch{}m.replaceChildren(W(xn)),m.dataset.copied="true",setTimeout(()=>{m.replaceChildren(W(Ye)),delete m.dataset.copied},1200)},z=(m,h,w,g,E)=>{const M=C("div","gnt-dv-archive-head"),T=C("button","gnt-dv-archive-back");T.type="button",T.appendChild(W(kn)),T.setAttribute("aria-label","Back"),w?T.addEventListener("click",w):(T.disabled=!0,T.setAttribute("aria-disabled","true"));const j=C("nav","gnt-dv-archive-crumbs");m.forEach((_,J)=>{if(J>0&&(j.appendChild(C("span","gnt-dv-archive-sep")).textContent="/"),_.onClick){const D=C("button","gnt-dv-archive-crumb");D.type="button",D.textContent=_.label,D.title=_.label,D.addEventListener("click",_.onClick),j.appendChild(D)}else{const D=C("span","gnt-dv-archive-crumb");D.dataset.active="true",D.textContent=_.label,D.title=_.label,j.appendChild(D)}});const I=C("button","gnt-dv-archive-copy");I.type="button",I.title="Copy path",I.setAttribute("aria-label","Copy path"),I.appendChild(W(Ye)),I.addEventListener("click",()=>{Y(I,g)});const N=C("span","gnt-dv-archive-sub");return N.textContent=h,M.append(T,j,I,N),E&&M.appendChild(E),M},B=()=>{const m=[{label:ee(i),onClick:l.length?()=>{R(),l=[],$()}:void 0}];return l.forEach((h,w)=>{const g=w===l.length-1;m.push({label:ee(h.name),onClick:g&&!v?void 0:()=>{R(),l=l.slice(0,w+1),$()}})}),v&&m.push({label:ee(v.name)}),m},A=()=>{const m=v?v.memberPath:l.map(h=>h.name).join("/");return[i,m].filter(Boolean).join("/")},F=()=>{v?(R(),$()):l.length&&(l=l.slice(0,-1),$())},H=()=>{if(!v)return;const m=URL.createObjectURL(new Blob([v.bytes])),h=C("a");h.href=m,h.download=v.name,h.click(),setTimeout(()=>URL.revokeObjectURL(m),1e4)},ae=()=>{const m=U(),h=m.length?`${m.join("/")}/`:"",w=new Map;for(const g of L()){if(h&&!g.name.startsWith(h))continue;const E=g.name.slice(h.length);if(!E)continue;const M=E.indexOf("/");if(M===-1)w.set(E,{name:E,dir:g.directory,entry:g});else{const T=E.slice(0,M);w.has(T)||w.set(T,{name:T,dir:!0})}}return[...w.values()]},se=m=>{const h=b==="asc"?1:-1,w=g=>{const E=g?.modified?Date.parse(g.modified):Number.NaN;return Number.isNaN(E)?0:E};return[...m].sort((g,E)=>{if(g.dir!==E.dir)return g.dir?-1:1;let M=0;return y==="size"?M=(g.entry?.size??0)-(E.entry?.size??0):y==="modified"?M=w(g.entry)-w(E.entry):M=g.name.localeCompare(E.name),M*h})},re=m=>{l=[...l,{kind:"dir",name:m}],u="",$()},oe=async m=>{const h=[...U(),m].join("/");try{const{bytes:w}=await ne(x(),h),g=await Ze(Qe(w));return d||(l=[...l,{kind:"archive",name:m,bytes:Qe(w),entries:g.entries}],u="",$()),!0}catch{return!1}},Q=async m=>{const h=[...U(),m].join("/"),w=[...l.map(g=>g.name),m].join("/");try{const{bytes:g,name:E}=await ne(x(),h);if(d)return;R();const M=Z(E,void 0),T=URL.createObjectURL(new Blob([g],{type:M.mime}));v={name:E,memberPath:w,kind:M.kind,bytes:g,size:g.byteLength,url:T,revoke:()=>URL.revokeObjectURL(T),mounted:g.byteLength<=wn},u="",$()}catch(g){if(d)return;t.fail?.(g instanceof Error?g:new Error(String(g)))}},S=async m=>{if(m.dir){re(m.name);return}Ue(m.name)&&await oe(m.name)||await Q(m.name)},V=async m=>{const h=m.split("/").filter(Boolean);for(let w=0;w<h.length;w+=1){const g=h[w];if(!g)continue;const E=w===h.length-1;if(ae().find(T=>T.name===g)?.dir){re(g);continue}if(E){Ue(g)&&await oe(g)||await Q(g);return}if(!await oe(g))return}},de=(m,h)=>{const w=C("div","gnt-dv-archive-gate"),g=C("p","gnt-dv-archive-gate-text");if(g.textContent=m,w.appendChild(g),h){const E=C("button","gnt-dv-archive-gate-button");E.type="button",E.textContent=h.label,E.addEventListener("click",h.onClick),w.appendChild(E)}return w},Lt=()=>{const m=C("div","gnt-dv-archive-preview"),h=v;if(!h)return m;if(h.kind==="office")return m.appendChild(de(`${ee(h.name)} — Word/Excel/PowerPoint can't be previewed inline from an archive. Download it to open in your office app.`,null)),m;if(!h.mounted)return m.appendChild(de(`${fe(h.size)} — too large to preview automatically.`,{label:"Preview",onClick:()=>{h.mounted=!0,$()}})),m;const w=document.createElement(ze);return w.style.display="block",w.style.width="100%",w.style.height="100%",w.config={source:h.url,name:h.name,theme:t.config.theme},m.appendChild(w),m},St=()=>{const m=C("div","gnt-dv-archive-actions"),h=v;if(!h)return m;const w=h.kind==="office"?null:O(h.memberPath);if(w){const E=C("a","gnt-dv-archive-action");E.href=w,E.target="_blank",E.rel="noopener",E.title="Open in new page",E.setAttribute("aria-label","Open in new page"),E.appendChild(W(Sn)),m.appendChild(E)}const g=C("button","gnt-dv-archive-action");return g.type="button",g.title="Download",g.setAttribute("aria-label","Download"),g.appendChild(W(Tn)),g.addEventListener("click",H),m.appendChild(g),m},$=()=>{if(!p)return;const m=ae(),h=z(B(),v?fe(v.size):`${m.length} item${m.length===1?"":"s"}`,v||l.length?F:null,A(),v?St():void 0);if(v){n.replaceChildren(h,Lt());return}const w=C("input","gnt-dv-archive-search");w.type="search",w.placeholder="Filter…",w.value=u,w.setAttribute("aria-label","Filter files"),h.appendChild(w);const g=(T,j)=>{const I=y===j,N=C("button","gnt-dv-archive-sort");N.type="button",N.dataset.active=I?"true":"false",N.title=`Sort by ${T.toLowerCase()}`;const _=C("span","gnt-dv-archive-sort-label");_.textContent=T;const J=C("span","gnt-dv-archive-sort-arrow");return J.appendChild(W(I?b==="desc"?Cn:En:Ln)),N.append(_,J),N.addEventListener("click",()=>{y===j?b=b==="asc"?"desc":"asc":(y=j,b="asc"),$()}),N},E=Je([g("Name","name"),g("Last modified","modified"),g("Size","size")]),M=()=>{E.tbody.replaceChildren();const T=u.trim().toLowerCase(),j=se(ae());let I=0;for(const N of j){if(T&&!N.name.toLowerCase().includes(T))continue;const _=C("span","gnt-dv-archive-name"),J=C("span","gnt-dv-archive-icon");J.appendChild(W(N.dir?bt:N.entry?Un(N.entry):wt,N.dir)),_.appendChild(J);const D=C("button","gnt-dv-archive-link");D.type="button",D.textContent=ee(N.name),D.title=N.dir?"Open folder":"Open",D.addEventListener("click",()=>{S(N)}),_.appendChild(D);const Ie=E.addRow([_,Ke(N.entry?.modified),N.dir?"—":fe(N.entry?.size??0)]);N.dir&&(Ie.className="gnt-dv-archive-dir"),Ie.lastElementChild?.classList.add("gnt-dv-num"),I+=1}if(I===0){const N=C("tr"),_=C("td","gnt-dv-archive-empty");_.colSpan=3,_.textContent=T?"No matching files.":"This folder is empty.",N.appendChild(_),E.tbody.appendChild(N)}};M(),w.addEventListener("input",()=>{u=w.value,M()}),n.replaceChildren(h,E.wrap)},_e=async()=>{const m=C("div","gnt-dv-archive-hint");m.textContent="Reading archive…",n.replaceChildren(m);try{const h=await fetch(t.displayUrl,{signal:c.signal});if(!h.ok)throw new Error(`${h.status} ${h.statusText}`.trim());const w=await h.arrayBuffer(),g=await Ze(w);if(d)return;f=w,k=g.entries,l=[],R(),u="",p=!0,s?await V(s):$()}catch(h){if(d)return;t.fail?.(h instanceof Error?h:new Error(String(h)))}},Tt=async()=>{const m=z([{label:ee(i)}],"1 item",null,i),h=Je(["Name","Last modified","Size"]),w=C("span","gnt-dv-archive-name"),g=C("span","gnt-dv-archive-icon");g.appendChild(W(yt));const E=C("button","gnt-dv-archive-link");E.type="button",E.textContent=ee(i),E.title="Extract and list contents",E.addEventListener("click",()=>{_e()}),w.append(g,E);const M=h.addRow([w,"—","—"]);M.className="gnt-dv-archive-file",M.lastElementChild?.classList.add("gnt-dv-num"),n.replaceChildren(m,h.wrap);try{const T=await fetch(r??t.displayUrl,{method:"HEAD",signal:c.signal});if(d)return;const j=M.querySelectorAll("td"),I=Number(T.headers.get("content-length"));j[1]&&(j[1].textContent=Ke(T.headers.get("last-modified")??void 0)),j[2]&&Number.isFinite(I)&&(j[2].textContent=fe(I))}catch{}};return t.config.entry?_e():Tt(),{destroy(){d=!0,c.abort(),R(),n.remove()}}}},we=(e,t,n)=>String.fromCharCode(...e.subarray(t,t+n)),Mn=["cmap","head","hhea","hmtx","maxp","name","OS/2","post","cvt ","fpgm","glyf","loca","prep","CFF ","VORG","EBDT","EBLC","gasp","hdmx","kern","LTSH","PCLT","VDMX","vhea","vmtx","BASE","GDEF","GPOS","GSUB","EBSC","JSTF","MATH","CBDT","CBLC","COLR","CPAL","SVG ","sbix","acnt","avar","bdat","bloc","bsln","cvar","fdsc","feat","fmtx","fvar","gvar","hsty","just","lcar","mort","morx","opbd","prop","trak","Zapf","Silf","Glat","Gloc","Feat","Sill"];function zn(e){const t=new Blob([e]).stream().pipeThrough(new DecompressionStream("deflate"));return new Response(t).arrayBuffer().then(n=>new Uint8Array(n))}function An(e){const t=new DataView(e.buffer,e.byteOffset,e.byteLength);if(e.byteLength<6)return{};const n=t.getUint16(2),r=t.getUint16(4),o=(a,s)=>a===3?s===1033?4:3:a===0?2:1,i=new Map;for(let a=0;a<n;a++){const s=6+a*12;if(s+12>e.byteLength)break;const c=t.getUint16(s),d=t.getUint16(s+2),f=t.getUint16(s+4),l=t.getUint16(s+6),k=t.getUint16(s+8),v=t.getUint16(s+10);if(l!==1&&l!==2&&l!==4)continue;const p=r+v,u=e.subarray(p,p+k);let y;try{y=c===1?new TextDecoder("latin1").decode(u):new TextDecoder("utf-16be").decode(u)}catch{continue}if(y=y.replace(/\0/g,"").trim(),!y)continue;const b=i.get(l),x=o(c,f);(!b||x>b.score)&&i.set(l,{score:x,text:y})}return{family:i.get(1)?.text,subfamily:i.get(2)?.text,fullName:i.get(4)?.text}}function On(e){if(e.byteLength<20)return;const n=new DataView(e.buffer,e.byteOffset,e.byteLength).getUint16(18);return n>0?n:void 0}function Rn(e,t=0){const n=new DataView(e.buffer,e.byteOffset,e.byteLength),r=n.getUint16(t+4);let o,i;for(let a=0;a<r;a++){const s=t+12+a*16,c=we(e,s,4),d=n.getUint32(s+8),f=n.getUint32(s+12);d+f>e.byteLength||(c==="name"?o=e.subarray(d,d+f):c==="head"&&(i=e.subarray(d,d+f)))}return{name:o,head:i}}async function _n(e){const t=new DataView(e.buffer,e.byteOffset,e.byteLength),n=t.getUint16(12);let r,o;for(let i=0;i<n;i++){const a=44+i*20,s=we(e,a,4),c=t.getUint32(a+4),d=t.getUint32(a+8),f=t.getUint32(a+12),l=e.subarray(c,c+d),k=d<f?await zn(l):l;s==="name"?r=k:s==="head"&&(o=k)}return{name:r,head:o}}function et(e,t){let n=0;for(let r=0;r<5;r++){const o=e[t.i++]??0;if(r===0&&o===128)throw new Error("Invalid UIntBase128.");if(n&4261412864)throw new Error("UIntBase128 overflow.");if(n=n<<7|o&127,(o&128)===0)return n}throw new Error("Unterminated UIntBase128.")}async function In(e){const t=new DataView(e.buffer,e.byteOffset,e.byteLength),n=t.getUint16(12),r=t.getUint32(20),o={i:48},i=[];let a=0;for(let l=0;l<n;l++){const k=e[o.i++]??0,v=k&63,p=k>>6&3,u=v===63?we(e,o.i,4):Mn[v]??"";v===63&&(o.i+=4);const y=et(e,o),b=(u==="glyf"||u==="loca")&&p===0||u==="hmtx"&&p===1,x=b?et(e,o):y;i.push({tag:u,offset:a,length:x,transformed:b}),a+=x}const s=e.subarray(o.i,o.i+r),d=(await(await K(async()=>{const{default:l}=await import("./index-BPaKIMxf.js");return{default:l}},[])).default).decompress(s),f={};for(const l of i)l.tag==="name"?f.name=d.subarray(l.offset,l.offset+l.length):l.tag==="head"&&(f.head=d.subarray(l.offset,l.offset+l.length));return f}async function Dn(e){const t=new Uint8Array(e);if(t.byteLength<4)return null;const n=we(t,0,4),r=n==="OTTO"||n==="true"||n==="typ1"||t[0]===0;try{let o,i;if(n==="wOFF")o=await _n(t),i="woff";else if(n==="wOF2")o=await In(t),i="woff2";else if(r)o=Rn(t),i="sfnt";else return null;const a={flavor:i};return o.name&&Object.assign(a,An(o.name)),o.head&&(a.unitsPerEm=On(o.head)),a}catch{return null}}const jn="The quick brown fox jumps over the lazy dog",Bn=[12,16,20,24,32,48],Fn="ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 .,;:!?@#$%&*()[]{}+-=_/\\<>\"'`~^|";function $n(e){const t=document.createDocumentFragment(),n=document.createElement("p");n.className="gnt-dv-font-hero",n.style.fontFamily=`"${e}"`,n.textContent=jn,t.appendChild(n);const r=document.createElement("div");r.className="gnt-dv-font-ladder";for(const i of Bn){const a=document.createElement("div");a.className="gnt-dv-font-row";const s=document.createElement("span");s.className="gnt-dv-font-label",s.textContent=`${i}px`;const c=document.createElement("span");c.style.fontFamily=`"${e}"`,c.style.fontSize=`${i}px`,c.textContent="Ag 123 — The quick brown fox",a.append(s,c),r.appendChild(a)}t.appendChild(r);const o=document.createElement("p");return o.className="gnt-dv-font-glyphs",o.style.fontFamily=`"${e}"`,o.textContent=Fn,t.appendChild(o),t}async function Pn(e,t){try{const n=await fetch(e,{signal:t});return n.ok?await Dn(await n.arrayBuffer()):null}catch{return null}}const Hn={id:"font",engine:"font",priority:16,match:e=>e.kind==="font",mount(e,t){const n=document.createElement("div");n.className="gnt-dv-font",e.appendChild(n);const r=document.createElement("div");r.className="gnt-dv-font-info";const o=document.createElement("span");o.textContent=`${t.mime||t.ext||"font"} · loading…`,r.appendChild(o),n.appendChild(r);const i=document.createElement("div");i.className="gnt-dv-font-body",i.textContent="Loading…",n.appendChild(i);const a=`gnt-font-${Math.random().toString(36).slice(2,10)}`,s=new AbortController;let c=!1,d=null;const f=()=>{const l=[t.mime||t.ext||"font"];d?.family&&l.push(d.family),d?.subfamily&&l.push(d.subfamily),d?.unitsPerEm&&l.push(`${d.unitsPerEm} upem`),d||l.push("metadata unavailable"),o.textContent=l.join("  ·  ")};return(async()=>{try{const l=new FontFace(a,`url("${t.displayUrl}")`);if(await l.load(),c)return;document.fonts.add(l),i.replaceChildren($n(a)),f(),d=await Pn(t.displayUrl,s.signal),c||f()}catch(l){if(c)return;t.fail?.(l instanceof Error?l:new Error(String(l)))}})(),{destroy(){c=!0,s.abort(),n.remove()}}}},Vn='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',Wn='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',qn='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',Gn='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',tt='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>';function Ce(e){return typeof e=="string"&&e!==""&&!e.startsWith("blob:")}function Le(e,t){const n=document.createElement("button");return n.type="button",n.className="gnt-dv-bar-btn",n.title=e,n.setAttribute("aria-label",e),n.innerHTML=t,n}async function nt(e,t){const n=e.innerHTML;try{await navigator.clipboard.writeText(t)}catch{}e.innerHTML=Wn,e.dataset.copied="true",window.setTimeout(()=>{e.dataset.copied==="true"&&(delete e.dataset.copied,e.innerHTML=n)},1200)}function le(e){const t=document.createElement("div");t.className="gnt-dv-bar";const n=document.createElement("div");n.className="gnt-dv-bar-main";const r=document.createElement("div");r.className="gnt-dv-bar-info",t.append(n,r);let o=e.name,i=e.source;const a=Le("Copy link",qn);a.addEventListener("click",()=>{Ce(i)&&nt(a,i)});const s=e.getText?Le("Copy content",Vn):null;if(s&&e.getText){const p=e.getText;s.addEventListener("click",()=>{const u=p();u!=null&&nt(s,u)})}let c=null;if(e.toggle){const p=e.toggle,u={active:p.active};c=Le("",tt);const y=()=>{const b=u.active==="rendered"?"View source":"View rendered";c.innerHTML=u.active==="rendered"?tt:Gn,c.title=b,c.setAttribute("aria-label",b),c.dataset.mode=u.active};c.addEventListener("click",()=>{u.active=u.active==="rendered"?"source":"rendered",y(),p.onChange(u.active)}),y()}let d=null;const f=p=>{d?d.replaceWith(p):n.prepend(p),d=p},l=()=>{if(Ce(i)){const u=document.createElement("a");u.className="gnt-dv-bar-name",u.textContent=o,u.title=o,u.href=i,u.target="_blank",u.rel="noopener",f(u);return}const p=document.createElement("span");p.className="gnt-dv-bar-name",p.textContent=o,p.title=o,f(p)};l(),n.append(a);const k=document.createElement("span");k.className="gnt-dv-bar-grow",n.appendChild(k),c&&n.appendChild(c),s&&n.appendChild(s);const v=()=>{a.hidden=!Ce(i),s&&e.getText&&(s.disabled=e.getText()==null)};return v(),{root:t,infoSlot:r,refresh:v,setTitle(p,u){o=p,i=u,l(),v()}}}function Xn(e){if(!Number.isFinite(e)||e<0)return"—";const t=Math.floor(e),n=t%60,r=Math.floor(t/60)%60,o=Math.floor(t/3600),i=String(n).padStart(2,"0");return o>0?`${o}:${String(r).padStart(2,"0")}:${i}`:`${r}:${i}`}const rt="Load fully (enable seeking)";function xt(e,t,n,r={}){const o=document.createElement("div");o.className="gnt-dv-media-info",o.setAttribute("role","status");const i=document.createElement("span");i.className="gnt-dv-media-info-line",o.appendChild(i);const a=document.createElement("button");a.type="button",a.className="gnt-dv-media-info-action",a.textContent=rt,a.hidden=!0,o.appendChild(a),e.appendChild(o);let s=!1,c="";const d=()=>Number.isFinite(t.duration)?Xn(t.duration):t.duration===Number.POSITIVE_INFINITY?"live / streaming":"length unknown",f=()=>{const x=t.seekable;if(t.duration===Number.POSITIVE_INFINITY)return x.length>0?"live (seek: buffer only)":"live (no seek)";if(x.length===0)return"seekable: no";try{const L=x.end(x.length-1);if(Number.isFinite(t.duration)&&L<t.duration-.5)return"seekable: partial"}catch{}return"seekable: yes"},l=()=>{try{const x=t.duration;if(!Number.isFinite(x)||x<=0||t.buffered.length===0)return 0;const L=t.buffered.end(t.buffered.length-1);return Math.min(100,Math.round(L/x*100))}catch{return 0}},k=()=>t.error?"error":t.readyState<2?"loading":t.paused?t.currentTime>0?"paused":"ready":"playing",v=()=>!!r.loadFully&&!s&&!t.error&&t.readyState>=1&&t.seekable.length===0&&Number.isFinite(t.duration),p=()=>{const x=n.current,L=[x.mime||x.ext||x.kind];L.push(d());const U=t.videoWidth;x.kind==="video"&&U&&L.push(`${U}×${t.videoHeight}`),L.push(f()),L.push(`buffered ${l()}%`),L.push(k()),c&&L.push(c),i.textContent=L.join("  ·  ");const O=v();a.hidden=!O,O&&(a.textContent=rt)},u=async()=>{if(!(!r.loadFully||s)){s=!0,c="",a.disabled=!0,a.textContent="Downloading…";try{await r.loadFully()}catch(x){c=`blob load failed: ${x instanceof Error?x.message:String(x)}`}finally{s=!1,a.disabled=!1,p()}}},y=()=>{u()},b=["loadedmetadata","durationchange","progress","timeupdate","play","pause","playing","waiting","seeked","error"];for(const x of b)t.addEventListener(x,p);return a.addEventListener("click",y),p(),()=>{for(const x of b)t.removeEventListener(x,p);a.removeEventListener("click",y),o.remove()}}const Zn=/^(m3u8|m3u)$/i;let he=null;function Kn(){return he||(he=K(()=>import("./hls-h6QHvJ3w.js"),[]).then(e=>e.default,e=>{throw he=null,new Error(`hls.js could not be loaded. Install it with "bun add hls.js". (${String(e)})`)})),he}const Yn={id:"hls",engine:"hls",priority:13,match:e=>e.kind==="video"&&Zn.test(e.ext),mount(e,t){let n=t,r=!1;const o={current:n},i=document.createElement("div");i.className="gnt-dv-media-wrap";const a=le({name:n.name,source:n.source??n.displayUrl});i.appendChild(a.root);const s=document.createElement("div");s.className="gnt-dv-media-body",i.appendChild(s),e.appendChild(i);const c=document.createElement("video");c.className="gnt-dv-media",c.setAttribute("preload","metadata"),c.setAttribute("playsinline",""),s.appendChild(c);const d=p=>{const u=p.config.video;c.controls=u.controls!==!1,c.autoplay=u.autoplay===!0,c.loop=u.loop===!0,c.muted=u.muted??u.autoplay===!0,u.poster&&(c.poster=u.poster)};d(n);const f=n.config.video.info===!1?()=>{}:xt(a.infoSlot,c,o);let l=null;const k=p=>{r||n.fail?.(p instanceof Error?p:new Error(String(p)))};c.addEventListener("error",()=>{r||k(new Error(`This browser cannot play "${n.name}".`))});const v=async p=>{const u=p.displayUrl;try{const y=await Kn();if(r)return;if(y.isSupported()){l?.destroy();const b=new y;l=b,b.on(y.Events.ERROR,(x,L)=>{L.fatal&&k(new Error(`HLS error: ${L.details}`))}),b.on(y.Events.MEDIA_ATTACHED,()=>b.loadSource(u)),b.attachMedia(c)}else c.canPlayType("application/vnd.apple.mpegurl")?c.src=u:k(new Error("HLS is not supported in this browser."))}catch(y){k(y)}};return v(n),{update(p){n=p,o.current=p,a.setTitle(p.name,p.source??p.displayUrl),d(p),v(p)},destroy(){r=!0,f(),l?.destroy(),l=null,c.removeAttribute("src"),i.remove()}}}},Qn={id:"image",engine:"native",priority:10,match:e=>e.kind==="image",mount(e,t){const n=document.createElement("img");n.className="gnt-dv-media",n.alt=t.name;let r=!1;return n.addEventListener("error",()=>{r||t.fail?.(new Error(`The browser could not display "${t.name}".`))}),n.src=t.displayUrl,e.appendChild(n),{update(o){n.alt=o.name,n.src=o.displayUrl},destroy(){r=!0,n.remove()}}}},Jn={ts:"typescript",tsx:"tsx",mts:"typescript",cts:"typescript",js:"javascript",jsx:"jsx",mjs:"javascript",cjs:"javascript",json:"json",jsonc:"jsonc",json5:"json5",md:"markdown",markdown:"markdown",mdx:"mdx",html:"html",htm:"html",vue:"vue",svelte:"svelte",css:"css",scss:"scss",sass:"sass",less:"less",py:"python",rb:"ruby",go:"go",rs:"rust",java:"java",c:"c",h:"c",cpp:"cpp",cc:"cpp",cxx:"cpp",hpp:"cpp",cs:"csharp",php:"php",swift:"swift",kt:"kotlin",kts:"kotlin",sh:"shellscript",bash:"shellscript",zsh:"shellscript",fish:"fish",yml:"yaml",yaml:"yaml",toml:"toml",ini:"ini",xml:"xml",sql:"sql",dockerfile:"docker",diff:"diff",patch:"diff",env:"dotenv",graphql:"graphql",gql:"graphql",lua:"lua",r:"r",txt:"text",log:"text",csv:"text",tsv:"text"};function Ae(e){return Jn[e]??"text"}function Oe(e){return e.code.theme?e.code.theme:e.theme==="dark"||e.theme!=="light"&&typeof matchMedia=="function"&&matchMedia("(prefers-color-scheme: dark)").matches?"github-dark":"github-light"}let me=null;function er(){return me||(me=K(()=>import("./index-BNCA4_lk.js"),[]).then(e=>e,e=>{throw me=null,new Error(`shiki could not be loaded. Install it with "bun add shiki". (${String(e)})`)})),me}async function Re(e,t,n){return(await er()).codeToHtml(e,{lang:t,theme:n})}const tr={id:"shiki",engine:"shiki",priority:15,match:e=>e.kind==="text"||e.kind==="table"||e.kind==="markup",mount(e,t){const n=document.createElement("div");n.className="gnt-dv-code";let r=null;const o=le({name:t.name,source:t.source??t.displayUrl,getText:()=>r});n.appendChild(o.root);const i=document.createElement("div");i.className="gnt-dv-code-body",n.appendChild(i),e.appendChild(n),(d=>{const f=document.createElement("pre");f.className="gnt-dv-text",f.textContent=d,i.replaceChildren(f)})("Loading…");const s=new AbortController;let c=!1;return(async()=>{try{const d=await fetch(t.displayUrl,{signal:s.signal});if(!d.ok)throw new Error(`${d.status} ${d.statusText}`.trim());if(r=await d.text(),c)return;o.refresh();const f=t.config.code.lang??Ae(t.ext),l=await Re(r,f,Oe(t.config));if(c)return;const k=document.createElement("div");k.className="gnt-dv-code-scroll",k.innerHTML=l,i.replaceChildren(k)}catch(d){if(c)return;t.fail?.(d instanceof Error?d:new Error(String(d)))}})(),{destroy(){c=!0,s.abort(),n.remove()}}}},nr=2*1024*1024,rr=new Set(["md","markdown","mdx"]);function or(e){return rr.has(e.ext)||e.mime.includes("markdown")}let ge=null;function ir(){return ge||(ge=K(()=>import("./marked.esm-B_Bd4ZI7.js"),[]).then(e=>e,e=>{throw ge=null,new Error(`marked could not be loaded. Install it with "bun add marked". (${String(e)})`)})),ge}function ar(e){return e.theme==="light"?"light":e.theme==="dark"||typeof matchMedia=="function"&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}function sr(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function kt(e){if(e.config.markup.baseUrl)return e.config.markup.baseUrl;const t=e.source??e.displayUrl;if(!t||t.startsWith("blob:"))return"";try{return new URL(".",t).href}catch{return""}}function cr(e){return`
:root { color-scheme: ${e}; ${e==="dark"?"--bg:#18181b;--fg:#fafafa;--muted:#a1a1aa;--border:#3f3f46;--code-bg:#27272a;--link:#60a5fa;--thumb:rgba(255,255,255,.42);--thumb-hover:rgba(255,255,255,.7)":"--bg:#ffffff;--fg:#18181b;--muted:#52525b;--border:#e4e4e7;--code-bg:#f4f4f5;--link:#2563eb;--thumb:rgba(24,24,27,.32);--thumb-hover:rgba(24,24,27,.55)"}; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  padding: 24px;
  background: var(--bg);
  color: var(--fg);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 15px;
  line-height: 1.65;
  overflow-wrap: break-word;
}
img, video, svg { max-width: 100%; height: auto; }
a { color: var(--link); }
h1, h2, h3, h4, h5, h6 { line-height: 1.3; margin: 1.4em 0 .6em; }
h1 { font-size: 1.7em; }
h2 { font-size: 1.4em; }
h3 { font-size: 1.2em; }
p, ul, ol, blockquote, pre, table { margin: 0 0 1em; }
ul, ol { padding-left: 1.6em; }
blockquote { margin-left: 0; padding: .2em 1em; border-left: 3px solid var(--border); color: var(--muted); }
code, kbd, samp, pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; }
code { background: var(--code-bg); padding: .15em .35em; border-radius: 4px; }
pre { background: var(--code-bg); padding: 14px 16px; border-radius: 8px; overflow: auto; }
pre code { background: none; padding: 0; }
table { border-collapse: collapse; width: max-content; max-width: 100%; }
th, td { border: 1px solid var(--border); padding: 6px 10px; text-align: left; }
th { background: var(--code-bg); }
hr { border: 0; border-top: 1px solid var(--border); margin: 1.6em 0; }
::-webkit-scrollbar { width: 12px; height: 12px; }
::-webkit-scrollbar-thumb { background-color: var(--thumb); border: 3px solid transparent; background-clip: padding-box; border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background-color: var(--thumb-hover); }
::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }
`}function lr(e,t){const n=kt(t);return'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+(n?`<base href="${sr(n)}" target="_blank">`:'<base target="_blank">')+`<style>${cr(ar(t.config))}</style></head><body>${e}</body></html>`}function dr(e,t){const n=new DOMParser().parseFromString(e,"text/html"),r=n.head??n.documentElement,o=kt(t);if(o&&!n.querySelector("base")){const i=n.createElement("base");i.setAttribute("href",o),i.setAttribute("target","_blank"),r.prepend(i)}return`<!doctype html>${n.documentElement.outerHTML}`}const ur=new Set(["script","style","iframe","frame","frameset","object","embed","link","meta","base","form","input","button","textarea","select","option","template","noscript"]);function pr(e){const t=new DOMParser().parseFromString(e,"text/html");for(const n of Array.from(t.body.querySelectorAll("*"))){if(ur.has(n.tagName.toLowerCase())){n.remove();continue}for(const r of Array.from(n.attributes)){const o=r.name.toLowerCase(),i=r.value.trim();(o.startsWith("on")||o==="srcdoc"||(o==="href"||o==="src"||o==="xlink:href")&&/^javascript:/i.test(i))&&n.removeAttribute(r.name)}}return t.body.innerHTML}const fr={id:"markup",engine:"markup",priority:16,match:e=>e.kind==="markup",mount(e,t){const n=document.createElement("div");n.className="gnt-dv-markup";let r=null,o="rendered";const i=le({name:t.name,source:t.source??t.displayUrl,getText:()=>r,toggle:{active:"rendered",onChange(u){o=u,p()}}});n.appendChild(i.root);const a=document.createElement("div");a.className="gnt-dv-markup-body",n.appendChild(a),e.appendChild(n);const s=u=>{const y=document.createElement("pre");y.className="gnt-dv-text",y.textContent=u,a.replaceChildren(y)},c=u=>{const y=document.createElement("p");y.className="gnt-dv-markup-hint",y.textContent=u,a.replaceChildren(y)};s("Loading…");const d=new AbortController;let f=!1,l=0;const k=u=>{const y=++l;s(u),Re(u,Ae(t.ext),Oe(t.config)).then(b=>{if(f||y!==l||o!=="source")return;const x=document.createElement("div");x.className="gnt-dv-code-scroll gnt-dv-code-block",x.innerHTML=b,a.replaceChildren(x)}).catch(()=>{})},v=u=>{const y=++l;if(u.length>nr){c(`This document is too large to render (${Math.round(u.length/1024/1024)} MB). Use the source view.`);return}const b=or(t);(async()=>{let x=u;if(b){let U;try{U=await ir()}catch(O){f||t.fail?.(O);return}if(f||y!==l||o!=="rendered")return;x=U.parse(u,{gfm:t.config.markup.gfm!==!1,async:!1})}if(f||y!==l||o!=="rendered")return;if(t.config.markup.sandbox===!1){const U=document.createElement("div");U.className="gnt-dv-markup-doc",U.innerHTML=pr(x),a.replaceChildren(U);return}const L=document.createElement("iframe");L.className="gnt-dv-markup-frame",L.title=t.name,L.setAttribute("sandbox","allow-popups"),L.setAttribute("referrerpolicy","no-referrer"),L.srcdoc=b?lr(x,t):dr(x,t),a.replaceChildren(L)})()},p=()=>{r!=null&&(o==="source"?k(r):v(r))};return(async()=>{try{const u=await fetch(t.displayUrl,{signal:d.signal});if(!u.ok)throw new Error(`${u.status} ${u.statusText}`.trim());if(r=await u.text(),f)return;i.refresh(),p()}catch(u){if(f)return;t.fail?.(u instanceof Error?u:new Error(String(u)))}})(),{destroy(){f=!0,d.abort(),n.remove()}}}},hr={id:"media",engine:"native",priority:12,match:e=>e.kind==="video"||e.kind==="audio",mount(e,t){let n=t,r=!1,o=null;const i={current:n},a=n.kind==="video",s=document.createElement("div");s.className="gnt-dv-media-wrap";const c=le({name:n.name,source:n.source??n.displayUrl});s.appendChild(c.root);const d=document.createElement("div");d.className="gnt-dv-media-body",s.appendChild(d),e.appendChild(s);const f=document.createElement(a?"video":"audio");f.className="gnt-dv-media",f.setAttribute("preload","metadata"),a&&f.setAttribute("playsinline",""),f.addEventListener("error",()=>{r||n.fail?.(new Error(`This browser cannot play "${n.name}".`))}),d.appendChild(f);const l=async()=>{const p=await fetch(n.source??n.displayUrl,{credentials:n.config.credentials});if(!p.ok)throw new Error(`${p.status} ${p.statusText}`.trim());const u=await p.blob();r||(o&&URL.revokeObjectURL(o),o=URL.createObjectURL(u),f.src=o)},k=n.config.video.info===!1?()=>{}:xt(c.infoSlot,f,i,{loadFully:l}),v=p=>{const u=p.config.video;f.controls=u.controls!==!1,f.autoplay=u.autoplay===!0,f.loop=u.loop===!0,f.muted=u.muted??u.autoplay===!0,p.kind==="video"&&u.poster&&(f.poster=u.poster),f.src=p.displayUrl};return v(n),{update(p){n=p,i.current=p,c.setTitle(p.name,p.source??p.displayUrl),o&&(URL.revokeObjectURL(o),o=null),v(p)},destroy(){r=!0,k(),f.pause?.(),o&&(URL.revokeObjectURL(o),o=null),f.removeAttribute("src"),s.remove()}}}};let ve=null;function mr(){return ve||(ve=K(()=>import("./panzoom.es-D32TlP9e.js"),[]).then(e=>e,e=>{throw ve=null,new Error(`@panzoom/panzoom could not be loaded. Install it with "bun add @panzoom/panzoom". (${String(e)})`)})),ve}const P={zoomOut:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M8 11h6"/></svg>',zoomIn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M11 8v6M8 11h6"/></svg>',rotateLeft:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',rotateRight:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',reset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',flipH:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><path d="M12 2v2"/><path d="M12 8v2"/><path d="M12 14v2"/><path d="M12 20v2"/></svg>',flipV:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/><path d="M4 12H2"/><path d="M10 12H8"/><path d="M16 12h-2"/><path d="M22 12h-2"/></svg>',fullscreen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/></svg>',fullscreenExit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>'};function q(e,t){const n=document.createElement("button");return n.type="button",n.className="gnt-dv-panzoom-btn",n.title=e,n.setAttribute("aria-label",e),n.innerHTML=t,n}const gr={id:"panzoom",engine:"panzoom",priority:12,match:e=>e.kind==="image",mount(e,t){const n=document.createElement("div");n.className="gnt-dv-panzoom",e.appendChild(n);const r=document.createElement("div");r.className="gnt-dv-panzoom-stage",n.appendChild(r);const o=document.createElement("img");o.className="gnt-dv-panzoom-img",o.alt=t.name,o.src=t.displayUrl,r.appendChild(o);const i=document.createElement("div");i.className="gnt-dv-panzoom-bar",i.setAttribute("role","toolbar");const a=q("Zoom out",P.zoomOut),s=q("Zoom in",P.zoomIn),c=q("Actual size (1:1)",'<span aria-hidden="true">1:1</span>'),d=q("Rotate left",P.rotateLeft),f=q("Rotate right",P.rotateRight),l=q("Flip horizontal",P.flipH),k=q("Flip vertical",P.flipV),v=q("Fit to view",P.reset),p=q("Fullscreen",P.fullscreen);i.append(a,s,c,d,f,l,k,v,p),n.appendChild(i);let u=!1,y=t.displayUrl,b=null,x=null,L=t.config.image.fullscreen!==!1;p.hidden=!L;let U=0,O=!1,R=!1,Y=0,z=0;const B=S=>{u||t.fail?.(S instanceof Error?S:new Error(String(S)))};o.addEventListener("error",()=>{u||B(new Error(`The browser could not display "${t.name}".`))});const A=()=>{o.style.rotate=U?`${U}deg`:"",o.style.transform=O||R?`scale(${O?-1:1}, ${R?-1:1})`:""},F=()=>!!n.ownerDocument.fullscreenElement,H=()=>{const S=n.ownerDocument;S.fullscreenElement?S.exitFullscreen?.():typeof n.requestFullscreen=="function"&&n.requestFullscreen()},ae=()=>{const S=F();p.innerHTML=S?P.fullscreenExit:P.fullscreen;const V=S?"Exit fullscreen":"Fullscreen";p.title=V,p.setAttribute("aria-label",V)},se=S=>{Y=S.clientX,z=S.clientY},re=S=>{Math.hypot(S.clientX-Y,S.clientY-z)>5||H()},oe=()=>{r.removeEventListener("pointerdown",se),r.removeEventListener("click",re),L&&(r.addEventListener("pointerdown",se),r.addEventListener("click",re))};oe();const Q=()=>ae();return n.ownerDocument.addEventListener("fullscreenchange",Q),n.ownerDocument.addEventListener("webkitfullscreenchange",Q),s.addEventListener("click",()=>b?.zoomIn()),a.addEventListener("click",()=>b?.zoomOut()),c.addEventListener("click",()=>{!b||!o.naturalWidth||!o.clientWidth||b.zoom(o.naturalWidth/o.clientWidth,{animate:!0})}),d.addEventListener("click",()=>{U=(U-90)%360,A()}),f.addEventListener("click",()=>{U=(U+90)%360,A()}),l.addEventListener("click",()=>{O=!O,A()}),k.addEventListener("click",()=>{R=!R,A()}),v.addEventListener("click",()=>{U=0,O=!1,R=!1,A(),b?.reset()}),p.addEventListener("click",H),(async()=>{try{const{default:S}=await mr();if(u)return;if(b=S(r,{maxScale:8,minScale:.2,step:.4,duration:150}),u){b.destroy(),b=null;return}const V=de=>b?.zoomWithWheel(de);n.addEventListener("wheel",V,{passive:!1}),x=()=>n.removeEventListener("wheel",V)}catch(S){B(S)}})(),{update(S){const V=S.displayUrl!==y;y=S.displayUrl,o.alt=S.name,V&&(o.src=S.displayUrl,U=0,O=!1,R=!1,A(),b?.reset()),L=S.config.image.fullscreen!==!1,p.hidden=!L,oe()},destroy(){u=!0,r.removeEventListener("pointerdown",se),r.removeEventListener("click",re),n.ownerDocument.removeEventListener("fullscreenchange",Q),n.ownerDocument.removeEventListener("webkitfullscreenchange",Q),x?.(),x=null,b?.destroy(),b=null,n.remove()}}}},vr={id:"pdf",engine:"iframe",priority:20,match:e=>e.kind==="pdf",mount(e,t){const n=document.createElement("iframe");n.className="gnt-dv-frame",n.title=t.name;let r=!1;return n.addEventListener("error",()=>{r||t.fail?.(new Error(`The browser could not display "${t.name}".`))}),n.src=t.displayUrl,e.appendChild(n),{update(o){n.src=o.displayUrl,n.title=o.name},destroy(){r=!0,n.remove()}}}},br=8e3;function wr(e){return Mt+encodeURIComponent(e)}function yr(e){return zt+encodeURIComponent(e)}const xr=["office"],kr=["office","pdf","image","video","text","table","markup","font","archive"],Er=/^https?:\/\//i;function Cr(e){return!!e&&Er.test(e)}function Et(e){return{id:e.id,engine:e.engine,priority:e.priority,requiresPublicUrl:!0,match:t=>e.kinds.includes(t.kind)&&Cr(t.source??t.displayUrl),mount(t,n){let r=n,o=!1,i;const a=document.createElement("iframe");a.className="gnt-dv-frame",a.title=r.name,a.setAttribute("allowfullscreen","true"),a.referrerPolicy="no-referrer";const s=()=>{i!==void 0&&(clearTimeout(i),i=void 0)},c=()=>s();a.addEventListener("load",c),t.appendChild(a);function d(f){a.title=f.name,a.src=e.buildUrl(f.displayUrl),s(),i=window.setTimeout(()=>{o||r.fail?.(new Error(`The ${e.engine} viewer did not load "${f.name}".`))},br)}return d(r),{update(f){r=f,d(f)},destroy(){o=!0,s(),a.removeEventListener("load",c),a.remove()}}}}}const Lr=Et({id:"microsoft-docs-viewer",engine:"microsoft-docs-viewer",priority:2,kinds:xr,buildUrl:wr}),Sr=Et({id:"google-docs-viewer",engine:"google-docs-viewer",priority:1,kinds:kr,buildUrl:yr}),be=1e3,Tr=["	",",",";","|"];function Ur(e){const t=e.split(/\r\n|\r|\n/);let n=0;for(;n<t.length;){const r=t[n].trim();if(r===""||r.startsWith("#"))n+=1;else break}return t.slice(n).join(`
`)}function Nr(e,t){let n=0,r=!1;for(let o=0;o<e.length;o++){const i=e[o];i==='"'?r=!r:!r&&i===t&&(n+=1)}return n}function Mr(e){const t=e.split(/\r\n|\r|\n/).filter(o=>o.trim()!=="").slice(0,20);let n=",",r=0;for(const o of Tr){let i=0;for(const a of t)i=Math.max(i,Nr(a,o));i>r&&(r=i,n=o)}return n}function zr(e,t){const n=[];let r=[],o="",i=!1;const a=()=>{r.push(o),o=""},s=()=>{a(),n.push(r),r=[]};for(let c=0;c<e.length;c++){const d=e[c];if(i){d==='"'?e[c+1]==='"'?(o+='"',c+=1):i=!1:o+=d;continue}d==='"'?i=!0:d===t?a():d===`
`?s():d==="\r"?(e[c+1]===`
`&&(c+=1),s()):o+=d}return(o.length>0||r.length>0)&&s(),n}function Ar(e){const t=Ur(e.replace(/^\uFEFF/,""));if(t.trim()==="")return{header:[],body:[]};const n=Mr(t),r=zr(t,n).filter(o=>!(o.length===1&&o[0]===""));return{header:r[0]??[],body:r.slice(1)}}function Or(e){return e!==""&&/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(e.trim())}const Rr={id:"table",engine:"table",priority:16,match:e=>e.kind==="table",mount(e,t){const n=document.createElement("div");n.className="gnt-dv-table";let r=null,o="rendered";const i=le({name:t.name,source:t.source??t.displayUrl,getText:()=>r,toggle:{active:"rendered",onChange(p){o=p,d()}}});n.appendChild(i.root);const a=document.createElement("div");a.className="gnt-dv-table-body",n.appendChild(a),e.appendChild(n);const s=p=>{const u=document.createElement("pre");u.className="gnt-dv-text",u.textContent=p,a.replaceChildren(u)};s("Loading…");const c=p=>{const{header:u,body:y}=Ar(p);if(u.length===0){s(p);return}const b=document.createElement("div");b.className="gnt-dv-table-wrap";const x=document.createElement("table");x.className="gnt-dv-table-grid";const L=document.createElement("thead"),U=document.createElement("tr");for(const z of u){const B=document.createElement("th");B.textContent=z,U.appendChild(B)}L.appendChild(U),x.appendChild(L);const O=document.createElement("tbody");x.appendChild(O);let R=u.length;for(const z of y)z.length>R&&(R=z.length);const Y=z=>{const B=document.createElement("tr");for(let A=0;A<R;A++){const F=document.createElement("td"),H=z[A]??"";F.textContent=H,Or(H)&&(F.className="gnt-dv-num"),B.appendChild(F)}return B};for(const z of y.slice(0,be))O.appendChild(Y(z));if(b.appendChild(x),a.replaceChildren(b),y.length>be){const z=document.createElement("div");z.className="gnt-dv-table-note";const B=document.createElement("span");B.textContent=`Showing ${be} of ${y.length} rows.`;const A=document.createElement("button");A.type="button",A.className="gnt-dv-table-action",A.textContent="Load all",A.addEventListener("click",()=>{const F=document.createDocumentFragment();for(const H of y.slice(be))F.appendChild(Y(H));O.appendChild(F),z.remove()}),z.append(B,A),a.appendChild(z)}},d=()=>{r!=null&&(o==="source"?v(r):c(r))},f=new AbortController;let l=!1,k=0;const v=p=>{const u=++k;s(p),Re(p,Ae(t.ext),Oe(t.config)).then(y=>{if(l||u!==k||o!=="source")return;const b=document.createElement("div");b.className="gnt-dv-code-scroll gnt-dv-code-block",b.innerHTML=y,a.replaceChildren(b)}).catch(()=>{})};return(async()=>{try{const p=await fetch(t.displayUrl,{signal:f.signal});if(!p.ok)throw new Error(`${p.status} ${p.statusText}`.trim());if(r=await p.text(),l)return;i.refresh(),d()}catch(p){if(l)return;t.fail?.(p instanceof Error?p:new Error(String(p)))}})(),{destroy(){l=!0,f.abort(),n.remove()}}}},_r={id:"unsupported",priority:-1e3,match:()=>!0,mount(e,t){const n=document.createElement("div");n.className="gnt-dv-fallback";const r=document.createElement("p");r.textContent=`No preview available for "${t.name}".`;const o=document.createElement("a");return o.href=t.displayUrl,o.download=t.name,o.rel="noopener",o.textContent="Download file",n.append(r,o),e.appendChild(n),{update(i){o.href=i.displayUrl,o.download=i.name},destroy(){n.remove()}}}};function Ir(){return new tn().register(vr).register(gr).register(Yn).register(hr).register(Qn).register(tr).register(Rr).register(fr).register(Hn).register(Nn).register(Lr).register(Sr).register(_r)}const Dr=["source","file","url","name","type","loader","preflight","theme"],jr=typeof HTMLElement<"u"?HTMLElement:class{};class Br extends jr{static registry=Ir();static get observedAttributes(){return[...Dr]}#e={};#w=null;#n;#r;#p=null;#h=null;#i=null;#t=0;#s=!1;#c=null;#m=null;#a=[];#o=0;#g=null;#l=null;#d=null;constructor(){super(),this.#n=document.createElement("div"),this.#n.className="gnt-dv-viewport",this.#r=document.createElement("div"),this.#r.className="gnt-dv-status"}get config(){return this.#e}set config(t){this.#e={...t},this.#u()}get source(){return this.#e.source}set source(t){this.#e={...this.#e,source:t??void 0},this.#u()}get registry(){return this.#w??this.constructor.registry}set registry(t){this.#w=t,this.#u()}get resolvedConfig(){return this.#c}reload(){this.#c&&this.#x(this.#c)}download(){const t=this.#c,n=this.#m??t?.source;if(!n)return;const r=document.createElement("a");r.href=n,r.download=t?.name??Fe(t?.source),r.rel="noopener",this.ownerDocument.body.appendChild(r),r.click(),r.remove()}print(){const t=this.#n.querySelector("iframe");try{const n=t?.contentWindow;if(n){n.focus(),n.print();return}}catch{}window.print()}async toggleFullscreen(){try{this.ownerDocument.fullscreenElement===this?await this.ownerDocument.exitFullscreen():await this.requestFullscreen()}catch{}}connectedCallback(){this.#s||(this.#s=!0,st(this.ownerDocument),this.#n.replaceChildren(),this.append(this.#n,this.#r),this.#u())}disconnectedCallback(){this.#U(),this.#s=!1}attributeChangedCallback(){this.#s&&this.#u()}#S(){const t=d=>this.getAttribute(d)??void 0,n={},r=t("source")??t("file")??t("url");r&&(n.source=r);const o=t("name");o&&(n.name=o);const i=t("type");i&&(n.type=i);const a=t("loader");a&&(n.loader=a);const s=t("preflight");s!==void 0&&(n.preflight=Ne(s));const c=t("theme");return c&&(n.theme=c),n}#u(){if(!this.#s)return;const t=jt(this.#S(),this.#e);this.#c=t,this.classList.add("gnt-dv-host"),t.theme!=="auto"?this.setAttribute("data-theme",t.theme):this.removeAttribute("data-theme"),this.dispatchEvent(new CustomEvent("gnt-config-change",{detail:t})),!this.#T(t)&&this.#x(t)}#T(t){const n=this.#l,r=this.#p;if(!n||!r?.update||this.#y(n.config)!==this.#y(t))return!1;const o={...n,config:t,fail:i=>this.#v(this.#t,i)};try{const i=r.update(o);i instanceof Promise&&i.catch(a=>this.#v(this.#t,a))}catch{return!1}return this.#l=o,this.dispatchEvent(new CustomEvent("gnt-ready",{detail:o})),!0}#y(t){return JSON.stringify([t.source,t.name,t.type,t.entry,t.loader,t.credentials,t.preflight,t.engine])}async#x(t){const n=++this.#t;if(this.#i?.abort(),this.#i=new AbortController,this.#b(),this.#L(),!t.source){this.#f("empty","No document source provided. Pass ?file=… in the URL or set the `source` attribute.");return}let r=t.name??Fe(t.source);const o=t.type&&t.type!=="auto"?t.type:void 0,i=!t.type||t.type==="auto";let a=null;if(t.entry&&Z(r,o).kind!=="archive"){const l=await fetch(t.source,{signal:this.#i.signal});if(!l.ok)throw new Error(`${l.status} ${l.statusText}`.trim());const{bytes:k,name:v}=await ne(await l.arrayBuffer(),t.entry);if(n!==this.#t)return;const p=URL.createObjectURL(new Blob([k],{type:Z(v,void 0).mime}));a={displayUrl:p,revoke:()=>URL.revokeObjectURL(p)},r=v}const s=/^https?:/i.test(t.source),c=Z(r,o),d=c.kind==="video"||c.kind==="audio",f=s&&!d&&(t.preflight===!0||t.preflight==="auto"&&i);this.#f("loading");try{let l;if(a)l=Z(r,o);else if(f){const b=await en(t.source,this.#i.signal);if(n!==this.#t)return;if(b.status==="fail")throw new Error(`"${r}" is not reachable.`);const x=Yt(b.contentType);l=x&&te(x)!=="unknown"?Z(r,o,x):Z(r,o)}else l=Z(r,o);const k={displayUrl:a?.displayUrl??t.source??"",source:t.source,name:r,mime:l.mime,ext:l.ext,kind:l.kind,config:t},p=this.#k(this.registry.candidates(k),t.engine)[0]?.requiresPublicUrl?{...t,loader:"direct"}:t,u=a??await Jt(p,this.#i.signal);if(n!==this.#t){u.revoke?.();return}this.#h=u.revoke??null,this.#m=u.displayUrl;const y={displayUrl:u.displayUrl,source:a?void 0:p.source,name:r,mime:l.mime,ext:l.ext,kind:l.kind,config:p,fail:b=>this.#v(n,b)};if(this.#n.replaceChildren(),this.#l=y,this.#a=this.#k(this.registry.candidates(y),p.engine),this.#o=0,this.#d=null,this.#a.length===0)throw new Error(p.engine==="auto"?"No renderer is registered for this document.":`No renderer is available for engine "${p.engine}".`);if(!this.#E(n))throw this.#d??new Error("All renderers failed to preview this document.")}catch(l){if(l instanceof DOMException&&l.name==="AbortError"||n!==this.#t)return;this.#C(n,l)}}#f(t,n){if(this.dataset.state=t,this.#r.dataset.state=t,t==="ready"){this.#r.hidden=!0,this.#r.textContent="";return}this.#r.hidden=!1,this.#r.textContent=t==="loading"?"Loading…":n??""}#k(t,n){return!n||n==="auto"?t:t.filter(r=>r.engine===n)}#E(t){const n=this.#l;if(!n)return!1;for(;this.#o<this.#a.length;){const r=this.#a[this.#o];if(!r){this.#o+=1;continue}this.#g=r.id;try{const o=r.mount(this.#n,n);return t!==this.#t?(o.destroy(),!1):(this.#p=o,this.#f("ready"),this.dispatchEvent(new CustomEvent("gnt-ready",{detail:n})),!0)}catch(o){this.#d=o,this.#o+=1}}return!1}#v(t,n){if(t!==this.#t)return;const r=this.#a[this.#o];!r||r.id!==this.#g||(this.#d=n,this.#b(),this.#n.replaceChildren(),this.#o+=1,this.#E(t)||this.#C(t,this.#d))}#C(t,n){if(t!==this.#t)return;const r=n instanceof Error?n.message:String(n);this.#f("error",`Failed to load document: ${r}`),this.dispatchEvent(new CustomEvent("gnt-error",{detail:{error:n}}))}#b(){this.#p?.destroy(),this.#p=null,this.#g=null}#L(){this.#h?.(),this.#h=null,this.#m=null}#U(){this.#t+=1,this.#i?.abort(),this.#i=null,this.#b(),this.#L(),this.#a=[],this.#o=0,this.#l=null}}function Ct(e=ze){typeof customElements>"u"||customElements.get(e)||customElements.define(e,Br)}function Fr(e,t){Ct();const n=typeof e=="string"?document.querySelector(e):e;if(!n)throw new Error(`mountViewer: target not found: ${String(e)}`);const r=document.createElement(ze);return r.style.display="block",r.style.width="100%",r.style.height="100%",n.appendChild(r),r.config=t,r}function $r(e,t=window.location.search){return Fr(e,Dt(t))}typeof document<"u"&&st(document);Ct();export{ze as T,K as _,Fe as f,$r as m,Dt as p};
