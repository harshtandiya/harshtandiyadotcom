export function playClickSound() {
  const SOUND_PATH = "/sounds/click.wav" as const;
  const audio = new Audio(SOUND_PATH);
  audio.play();
}
