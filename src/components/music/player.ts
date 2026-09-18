import { SONGS } from "./songs";

// Drives one record player. Visuals live in CSS, keyed on `data-phase`:
//   empty → entering → playing → exiting → (entering the next record | empty)
// This only flips phases and waits for each phase's finite animations to end,
// so timing lives in one place: the CSS.
export function mountPlayer(root: HTMLElement) {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-song]")];
  const status = root.querySelector<HTMLElement>("[data-status]")!;

  let playing: number | null = null;
  let wanted: number | null = null;
  let running = false;

  // One element reused for every preview. It is paused on exit, and the swap
  // below stops it when ClientRouter navigates away.
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
    root.style.setProperty("--label", song.label);
    root.querySelector("[data-title]")!.textContent = song.title;
    root.querySelector("[data-artist]")!.textContent = song.artist;
  };

  const sync = () => {
    buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === wanted)));
    status.textContent =
      wanted === null ? "Nothing playing." : `Playing ${SONGS[wanted].title} by ${SONGS[wanted].artist}.`;
  };

  // Clicks can land mid-animation. Only the latest choice matters, so the loop
  // keeps swapping records until what is on the platter is what was asked for.
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
        // The needle lands, then the music starts.
        await enter("playing");
        const preview = buttons[next].dataset.preview;
        if (preview && wanted === next) {
          // Same src keeps the buffered data; a replayed record starts over.
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

  // When the preview runs out, lift the record off like a finished side.
  audio.addEventListener("ended", () => {
    wanted = null;
    sync();
    run();
  });

  buttons.forEach((button, i) =>
    button.addEventListener("click", () => {
      // Safari only lets audio start from inside a gesture, and playback starts
      // ~2s later after the animation. A silent play/pause on the first click
      // unlocks the element for the rest of the visit.
      if (!primed && button.dataset.preview) {
        primed = true;
        audio.src = button.dataset.preview;
        audio.muted = true;
        audio
          .play()
          .then(() => audio.muted && audio.pause(), () => {})
          .finally(() => (audio.muted = false));
      }
      // Clicking the song that is on stops it.
      wanted = wanted === i ? null : i;
      sync();
      run();
    }),
  );

  root.dataset.phase = "empty";
  sync();
}

// Page scripts run once; ClientRouter swaps the DOM underneath them.
export function mountAll() {
  document.addEventListener("astro:page-load", () => {
    document.querySelectorAll<HTMLElement>("[data-player]:not([data-phase])").forEach(mountPlayer);
  });
}
