const SOUND_PATH = "/sounds/click.wav" as const;
let audioCache: HTMLAudioElement | null = null;

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
  audio.play();
}
