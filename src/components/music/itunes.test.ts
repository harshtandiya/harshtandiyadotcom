import { expect, test } from "bun:test";
import { artworkAt, pick } from "./itunes";

const song = { title: "Nights", artist: "Frank Ocean" };
const r = (artistName: string, trackName: string, previewUrl = trackName) => ({ artistName, trackName, previewUrl });

test("skips covers and prefers the exact title", () => {
  expect(
    pick([r("Blond Piano", "Nights"), r("Frank Ocean", "Nights (Mixed)"), r("Frank Ocean", "Nights")], song
  )?.previewUrl,
  ).toBe("Nights");
});

test("falls back to a title prefix, never to another song", () => {
  expect(pick([r("Frank Ocean", "Nights (Mixed)")], song)?.previewUrl).toBe("Nights (Mixed)");
  expect(pick([r("Frank Ocean", "Godspeed")], song)).toBeUndefined();
});

test("resizes artwork by URL", () => {
  expect(artworkAt("https://x/a.jpg/100x100bb.jpg", 600)).toBe("https://x/a.jpg/600x600bb.jpg");
});
