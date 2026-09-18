import data from "./songs.json";

export type Song = { title: string; artist: string; label?: string };
export const SONGS: Song[] = data;
