import { expect, test } from "bun:test";
import { pick } from "./previews";

const song = { title: "Nights", artist: "Frank Ocean", label: "" };
const r = (artistName: string, trackName: string, previewUrl = trackName) => ({ artistName, trackName, previewUrl });

test("skips covers and prefers the exact title", () => {
  expect(
    pick([r("Blond Piano", "Nights"), r("Frank Ocean", "Nights (Mixed)"), r("Frank Ocean", "Nights")], song),
  ).toBe("Nights");
});

test("falls back to a title prefix, never to another song", () => {
  expect(pick([r("Frank Ocean", "Nights (Mixed)")], song)).toBe("Nights (Mixed)");
  expect(pick([r("Frank Ocean", "Godspeed")], song)).toBeUndefined();
});
