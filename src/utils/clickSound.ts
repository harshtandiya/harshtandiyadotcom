const SOUND_PATH = "/sounds/click.wav" as const;
let audioCache: HTMLAudioElement | null = null;

declare global {
  interface Window {
    __clickSoundBound?: true;
  }
}

function getAudio(): HTMLAudioElement {
  if (!audioCache) {
    audioCache = new Audio(SOUND_PATH);
    audioCache.volume = 0.3;
  }
  return audioCache;
}

export function playClickSound() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const audio = getAudio();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

/**
 * Plays the click sound for every link on the page via a single delegated
 * listener. Bound to `window` rather than the document so it survives page
 * swaps, and guarded so a re-executed script cannot double-bind it.
 *
 * `pointerdown` fires before `click`, which gives the sound a head start
 * without delaying navigation.
 */
export function initClickSound() {
  if (window.__clickSoundBound) return;
  window.__clickSoundBound = true;
  addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest("a[href]")) {
      playClickSound();
    }
  });
}
