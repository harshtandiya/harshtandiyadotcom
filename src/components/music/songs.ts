// Placeholder picks — swap for the real list. `label` tints the record's outer label ring.
export const SONGS = [
  { title: "Nights", artist: "Frank Ocean", label: "#c8443a" },
  { title: "Everything in Its Right Place", artist: "Radiohead", label: "#34568b" },
  { title: "Get Lucky", artist: "Daft Punk", label: "#d49b2f" },
  { title: "Ribs", artist: "Lorde", label: "#3f7f86" },
  { title: "Redbone", artist: "Childish Gambino", label: "#7b5aa6" },
];

export type Song = (typeof SONGS)[number];
