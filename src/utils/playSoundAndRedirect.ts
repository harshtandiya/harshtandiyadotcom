const SOUND_PATH = "/sounds/click.wav" as const;

/**
 * Plays a sound from the sounds folder and then redirects to the given route.
 * Client-only: no-ops when run outside the browser (e.g. during SSG).
 *
 * @param route - Path to navigate to (e.g. "/about")
 */
export function playSoundAndRedirect(route: string): void {
  if (typeof window === "undefined") return;

  const audio = new Audio(SOUND_PATH);
  audio.play().catch(() => {
    // Ignore autoplay policy errors; still redirect
  });

  // Redirect after a short delay so the sound has time to start
  const redirectDelayMs = 150;
  setTimeout(() => {
    window.location.href = route;
  }, redirectDelayMs);
}
