import { SONGS, type Song } from "./songs";

// Resolved at build time. Search ranks covers and karaoke above many originals,
// so fall back to the artist's own catalog.
type Result = {
  artistId?: number;
  artistName: string;
  trackName?: string;
  previewUrl?: string;
  artworkUrl100?: string;
};

export type Track = { preview: string; artwork?: string };

// Apple serves any square size by rewriting the URL.
export const artworkAt = (url: string, px: number) => url.replace(/\/\d+x\d+bb\./, `/${px}x${px}bb.`);

const norm = (s: string) => s.toLowerCase().normalize("NFKD").trim();

async function itunes(path: string, params: Record<string, string>): Promise<Result[]> {
  const url = new URL(path, "https://itunes.apple.com");
  url.search = new URLSearchParams({ country: "us", ...params }).toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return ((await res.json()) as { results: Result[] }).results;
}

export function pick(results: Result[], { title, artist }: Song) {
  const tracks = results.filter((r) => r.previewUrl && r.trackName && norm(r.artistName).includes(norm(artist)));
  return (
    tracks.find((r) => norm(r.trackName!) === norm(title)) ??
    tracks.find((r) => norm(r.trackName!).startsWith(norm(title)))
  );
}

async function lookup(song: Song): Promise<Track | null> {
  try {
    let hit = pick(await itunes("/search", { term: `${song.artist} ${song.title}`, entity: "song", limit: "25" }), song);
    if (!hit) {
      const artists = await itunes("/search", { term: song.artist, entity: "musicArtist", limit: "5" });
      const id = artists.find((a) => norm(a.artistName) === norm(song.artist))?.artistId;
      if (id) hit = pick(await itunes("/lookup", { id: String(id), entity: "song", limit: "200" }), song);
    }
    if (hit) return { preview: hit.previewUrl!, artwork: hit.artworkUrl100 };

    console.warn(`[music] no iTunes preview for "${song.title}" by ${song.artist}`);
  } catch (err) {
    console.warn(`[music] iTunes lookup failed for "${song.title}": ${err}`);
  }
  return null;
}

let tracks: Promise<(Track | null)[]> | undefined;
export const getTracks = () => (tracks ??= Promise.all(SONGS.map(lookup)));
