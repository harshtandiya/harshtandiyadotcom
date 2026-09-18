import { SONGS, type Song } from "./songs";

// Apple's 30-second previews, looked up via the iTunes Search API when the page
// is built (server-side only — never shipped to the client). Search is fuzzy
// and ranks covers and karaoke above many originals, so fall back to the
// artist's own catalog. Only exact artist + title hits count; a miss just
// means that record spins silently.
type Result = {
  artistId?: number;
  artistName: string;
  trackName?: string;
  previewUrl?: string;
};

const norm = (s: string) => s.toLowerCase().normalize("NFKD").trim();

async function itunes(path: string, params: Record<string, string>): Promise<Result[]> {
  const url = new URL(path, "https://itunes.apple.com");
  url.search = new URLSearchParams({ country: "us", ...params }).toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return ((await res.json()) as { results: Result[] }).results;
}

// Prefer "Nights" over "Nights (Mixed)" when both exist.
export function pick(results: Result[], { title, artist }: Song) {
  const tracks = results.filter((r) => r.previewUrl && r.trackName && norm(r.artistName).includes(norm(artist)));
  return (
    tracks.find((r) => norm(r.trackName!) === norm(title)) ??
    tracks.find((r) => norm(r.trackName!).startsWith(norm(title)))
  )?.previewUrl;
}

async function lookup(song: Song): Promise<string | null> {
  try {
    const found = pick(await itunes("/search", { term: `${song.artist} ${song.title}`, entity: "song", limit: "25" }), song);
    if (found) return found;

    // ponytail: catalog lookup caps at 200 songs; very prolific artists may still miss.
    const artists = await itunes("/search", { term: song.artist, entity: "musicArtist", limit: "5" });
    const id = artists.find((a) => norm(a.artistName) === norm(song.artist))?.artistId;
    const fromCatalog = id && pick(await itunes("/lookup", { id: String(id), entity: "song", limit: "200" }), song);
    if (fromCatalog) return fromCatalog;

    console.warn(`[music] no iTunes preview for "${song.title}" by ${song.artist}`);
  } catch (err) {
    console.warn(`[music] iTunes lookup failed for "${song.title}": ${err}`);
  }
  return null;
}

// One lookup per build, however many pages render the list.
let previews: Promise<(string | null)[]> | undefined;
export const getPreviews = () => (previews ??= Promise.all(SONGS.map(lookup)));
