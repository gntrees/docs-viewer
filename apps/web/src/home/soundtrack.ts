const STORAGE_KEY = "gnt-docs-viewer-sound";
const VOLUME = 0.35;

/**
 * Path inside `public/`, resolved against the Vite base so the built site keeps
 * working under GitHub Pages' sub-path. The track is "Jazz Brunch" by Kevin
 * MacLeod (CC BY 3.0); see `public/audio/README.md` for attribution.
 */
const SOURCE = `${import.meta.env.BASE_URL}audio/jazz-brunch.mp3`;

/**
 * Wire up the home-page background soundtrack and its mute toggle.
 *
 * Only the home page calls this, so it is the only page that autoplays. Browsers
 * block audible autoplay until a user gesture, in which case playback starts on
 * the first click or key press instead.
 */
export function initSoundtrack(): void {
  const audio = document.getElementById("home-soundtrack");
  const button = document.getElementById("sound-toggle");
  if (!(audio instanceof HTMLAudioElement) || !(button instanceof HTMLButtonElement)) return;

  audio.volume = VOLUME;
  audio.loop = true;

  let muted = localStorage.getItem(STORAGE_KEY) === "muted";
  audio.muted = muted;

  const render = (): void => {
    button.setAttribute("aria-pressed", String(muted));
    button.setAttribute("aria-label", muted ? "Unmute background music" : "Mute background music");
  };

  const play = (): void => {
    void audio.play().catch((error: unknown) => {
      // Audible autoplay is blocked until the user interacts with the page.
      if (!(error instanceof DOMException) || error.name !== "NotAllowedError") return;
      const resume = (): void => {
        document.removeEventListener("pointerdown", resume);
        document.removeEventListener("keydown", resume);
        if (!muted) void audio.play().catch(() => {});
      };
      document.addEventListener("pointerdown", resume, { once: true });
      document.addEventListener("keydown", resume, { once: true });
    });
  };

  audio.addEventListener("error", () => {
    button.disabled = true;
    button.setAttribute("aria-label", "Background music unavailable");
  });

  button.addEventListener("click", () => {
    muted = !muted;
    audio.muted = muted;
    localStorage.setItem(STORAGE_KEY, muted ? "muted" : "on");
    if (!muted) void audio.play().catch(() => {});
    render();
  });

  audio.src = SOURCE;
  render();
  play();
}
