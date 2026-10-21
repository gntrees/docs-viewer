const STORAGE_KEY = "gnt-docs-viewer-sound";
const VOLUME = 0.35;

/**
 * Path inside `public/`, resolved against the Vite base so the built site keeps
 * working under GitHub Pages' sub-path. The track is "Morning Brew" from
 * "Cozy Music Sampler" by Spaceyyy (CC BY 4.0); see `public/audio/README.md`.
 */
const SOURCE = `${import.meta.env.BASE_URL}audio/morning-brew.mp3`;

/**
 * Wire up the home-page background soundtrack and its mute toggle.
 *
 * Only the home page calls this, so it is the only page that autoplays. Browsers
 * block audible autoplay until a user gesture; the listeners are installed before
 * the first attempt so an early click or key press is not missed. Once playback
 * starts, the listeners are removed.
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

  const clearGestureStart = (): void => {
    document.removeEventListener("pointerdown", startFromGesture);
    document.removeEventListener("touchstart", startFromGesture);
    document.removeEventListener("keydown", startFromGesture);
  };

  const startAudio = (): void => {
    void audio
      .play()
      .then(() => {
        clearGestureStart();
        button.removeAttribute("title");
        render();
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException) || error.name !== "NotAllowedError") return;
        button.title = "Click anywhere to start the music";
        button.setAttribute("aria-label", "Start background music");
      });
  };

  const startFromGesture = (event: Event): void => {
    // The sound button handles its own first click, so it can start the track
    // without immediately toggling mute.
    if (event.target instanceof Node && button.contains(event.target)) return;
    clearGestureStart();
    if (!muted) startAudio();
  };

  // Installed before the first play attempt so a click during load is honoured.
  document.addEventListener("pointerdown", startFromGesture, { passive: true });
  document.addEventListener("touchstart", startFromGesture, { passive: true });
  document.addEventListener("keydown", startFromGesture);

  audio.addEventListener("error", () => {
    clearGestureStart();
    button.disabled = true;
    button.setAttribute("aria-label", "Background music unavailable");
  });

  button.addEventListener("click", () => {
    // Autoplay was blocked: the first click on the button starts playback
    // instead of turning the sound off.
    if (audio.paused && !muted) {
      clearGestureStart();
      startAudio();
      return;
    }
    muted = !muted;
    audio.muted = muted;
    localStorage.setItem(STORAGE_KEY, muted ? "muted" : "on");
    if (!muted) startAudio();
    render();
  });

  audio.src = SOURCE;
  render();
  startAudio();
}
