import { SONGS } from "./songs";

// Visuals live in CSS, keyed on `data-phase`: empty → entering → playing → exiting.
// This only flips phases and waits for each phase's animations to finish.
export function mountPlayer(root: HTMLElement) {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-song]")];
  const status = root.querySelector<HTMLElement>("[data-status]")!;
  const power = root.querySelector<HTMLButtonElement>("[data-power]")!;

  let playing: number | null = null;
  let wanted: number | null = null;
  let running = false;
  let last = 0;

  const audio = new Audio();
  audio.preload = "none";
  audio.volume = 0.7;
  let primed = false;
  document.addEventListener("astro:before-swap", () => audio.pause(), { once: true });

  const settle = () =>
    Promise.all(
      root
        .getAnimations({ subtree: true })
        // The spin loops forever; waiting on it would never resolve.
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    );

  const enter = async (phase: string) => {
    root.dataset.phase = phase;
    await settle();
  };

  const label = (i: number) => {
    const song = SONGS[i];
    if (song.label) root.style.setProperty("--label", song.label);
    else root.style.removeProperty("--label");
    root.querySelector("[data-title]")!.textContent = song.title;
    root.querySelector("[data-artist]")!.textContent = song.artist;
  };

  const sync = () => {
    buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === wanted)));
    power.setAttribute("aria-pressed", String(wanted !== null));
    status.textContent =
      wanted === null ? "Nothing playing." : `Playing ${SONGS[wanted].title} by ${SONGS[wanted].artist}.`;
  };

  // Clicks can land mid-animation; keep swapping until the platter matches the latest pick.
  const run = async () => {
    if (running) return;
    running = true;
    while (wanted !== playing) {
      if (playing !== null) {
        audio.pause();
        await enter("exiting");
        playing = null;
      }
      if (wanted !== null) {
        const next = wanted;
        label(next);
        await enter("entering");
        playing = next;
        await enter("playing");
        const preview = buttons[next].dataset.preview;
        if (preview && wanted === next) {
          if (audio.src !== preview) audio.src = preview;
          audio.currentTime = 0;
          audio.muted = false; // also tells a still-pending unlock not to pause us
          audio.play().catch(() => {});
        }
      }
    }
    if (playing === null) root.dataset.phase = "empty";
    running = false;
  };

  audio.addEventListener("ended", () => choose(null));

  const choose = (i: number | null) => {
    // Safari only starts audio inside a gesture, but playback begins ~2s later.
    // A silent play/pause on the first click unlocks the element.
    const preview = i === null ? undefined : buttons[i].dataset.preview;
    if (!primed && preview) {
      primed = true;
      audio.src = preview;
      audio.muted = true;
      audio
        .play()
        .then(() => audio.muted && audio.pause(), () => {})
        .finally(() => (audio.muted = false));
    }
    if (i !== null) last = i;
    wanted = i;
    sync();
    run();
  };

  buttons.forEach((button, i) => button.addEventListener("click", () => choose(wanted === i ? null : i)));
  power.addEventListener("click", () => choose(wanted === null ? last : null));

  root.dataset.phase = "empty";
  sync();
}

// Page scripts run once; ClientRouter swaps the DOM underneath them.
export function mountAll() {
  document.addEventListener("astro:page-load", () => {
    document.querySelectorAll<HTMLElement>("[data-player]:not([data-phase])").forEach(mountPlayer);
  });
}
