import { resolveConfig, type Theme, type ViewerConfig } from "@gntrees/docs-viewer";
import { AUTO_KEY, initialConfig, THEMES, TYPES, type Sample, type TypeGroup } from "./samples";

/** Sentinel `<option>` value for the Sample select when the URL is hand-written. */
const CUSTOM = "";

const groupFor = (key: string): TypeGroup | undefined => TYPES.find((entry) => entry.key === key);

const samplesFor = (key: string): Sample[] => groupFor(key)?.samples ?? [];

/** Map a sample URL back to the type group it belongs to. */
function locate(url: string): TypeGroup | undefined {
  return TYPES.find((group) => group.samples.some((sample) => sample.url === url));
}

const element = <T extends HTMLElement>(id: string): T | null =>
  document.getElementById(id) as T | null;

/**
 * Wire up the shared playground controls — Type / Sample / Theme, a File URL
 * input and an Advanced config (JSON) editor — and call `onChange` with the
 * current `ViewerConfig`, once on mount and then on every change.
 *
 * Framework-agnostic by design: it owns no rendering, only the DOM controls, so
 * each route can feed the emitted config into its own reactive wrapper around
 * `<gnt-docs-viewer>`. Returns a cleanup function that removes the listeners.
 */
export function mountPlayground(onChange: (config: ViewerConfig) => void): () => void {
  const typeSelect = element<HTMLSelectElement>("type");
  const sampleSelect = element<HTMLSelectElement>("sample");
  const themeSelect = element<HTMLSelectElement>("theme");
  const urlInput = element<HTMLInputElement>("url");
  const configArea = element<HTMLTextAreaElement>("config");
  const applyButton = element<HTMLButtonElement>("config-apply");
  const configError = element<HTMLElement>("config-error");

  let state: ViewerConfig = initialConfig();

  if (typeSelect) {
    for (const group of TYPES) {
      const option = document.createElement("option");
      option.value = group.key;
      option.textContent = group.label;
      typeSelect.appendChild(option);
    }
  }

  if (themeSelect) {
    for (const theme of THEMES) {
      const option = document.createElement("option");
      option.value = theme.value;
      option.textContent = theme.label;
      themeSelect.appendChild(option);
    }
  }

  const setError = (text: string): void => {
    if (configError) configError.textContent = text;
  };

  /** A plain, serializable copy so framework reactivity and JSON diffing work. */
  const snapshot = (): ViewerConfig => JSON.parse(JSON.stringify(state)) as ViewerConfig;

  const emit = (): void => onChange(snapshot());

  /** The complete config (defaults filled in) shown in the advanced editor. */
  const refreshJson = (): void => {
    if (configArea) configArea.value = JSON.stringify(resolveConfig(state), null, 2);
  };

  /** Rebuild the Sample select for the current type; select the source or "Custom…". */
  const populateSamples = (): void => {
    if (!sampleSelect) return;
    const samples = samplesFor(state.type ?? AUTO_KEY);
    sampleSelect.replaceChildren();
    for (const sample of samples) {
      const option = document.createElement("option");
      option.value = sample.url;
      option.textContent = sample.label;
      sampleSelect.appendChild(option);
    }
    const custom = document.createElement("option");
    custom.value = CUSTOM;
    custom.textContent = "Custom…";
    sampleSelect.appendChild(custom);

    const source = state.source ?? "";
    const matched = samples.some((sample) => sample.url === source);
    sampleSelect.value = matched ? source : CUSTOM;
  };

  /** Push `state` into every control and refresh the JSON editor. */
  const syncControls = (): void => {
    if (typeSelect) typeSelect.value = state.type ?? AUTO_KEY;
    if (themeSelect) themeSelect.value = state.theme ?? "auto";
    if (urlInput) urlInput.value = state.source ?? "";
    populateSamples();
    refreshJson();
  };

  /** If the source matches a known sample, adopt that sample's type lock. */
  const adoptType = (): void => {
    const group = locate(state.source ?? "");
    if (group) state.type = group.key;
  };

  const syncAll = (): void => {
    syncControls();
    emit();
  };

  const onTypeChange = (): void => {
    state.type = typeSelect?.value ?? state.type;
    state.source = samplesFor(state.type ?? "")[0]?.url ?? "";
    syncAll();
  };
  const onSampleChange = (): void => {
    const value = sampleSelect?.value ?? "";
    if (value === CUSTOM) {
      // Keep the current URL; the user edits the File URL field to change it.
      urlInput?.focus();
      return;
    }
    state.source = value;
    adoptType();
    syncAll();
  };
  const onThemeChange = (): void => {
    state.theme = (themeSelect?.value as Theme | undefined) ?? state.theme;
    syncAll();
  };
  const onUrlChange = (): void => {
    state.source = urlInput?.value.trim() ?? "";
    adoptType();
    syncAll();
  };
  const onApply = (): void => {
    if (!configArea) return;
    try {
      const parsed = JSON.parse(configArea.value) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Config must be a JSON object");
      }
      state = parsed as ViewerConfig;
      adoptType();
      setError("");
      syncAll();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  typeSelect?.addEventListener("change", onTypeChange);
  sampleSelect?.addEventListener("change", onSampleChange);
  themeSelect?.addEventListener("change", onThemeChange);
  urlInput?.addEventListener("change", onUrlChange);
  applyButton?.addEventListener("click", onApply);

  // First paint: reflect the initial config and render the preview.
  adoptType();
  syncControls();
  emit();

  return () => {
    typeSelect?.removeEventListener("change", onTypeChange);
    sampleSelect?.removeEventListener("change", onSampleChange);
    themeSelect?.removeEventListener("change", onThemeChange);
    urlInput?.removeEventListener("change", onUrlChange);
    applyButton?.removeEventListener("click", onApply);
  };
}
