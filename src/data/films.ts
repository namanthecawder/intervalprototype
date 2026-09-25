// Illustrative now-showing set for the prototype. Public listings, 2026-08-22.
export type Film = {
  title: string;
  certificate: string;
  languages: string[];
  runtimeMins: number;
  /** True when District gave no runtime and a default was used. */
  runtimeEstimated?: boolean;
  url?: string;
};

export const films: Film[] = [
  { title: "Awarapan 2", certificate: "UA16+", languages: ["Hindi"], runtimeMins: 148 },
  { title: "Hanuman Ansh", certificate: "U", languages: ["Hindi"], runtimeMins: 135 },
  {
    title: "Spider-Man: Brand New Day",
    certificate: "UA13+",
    languages: ["Hindi", "English"],
    runtimeMins: 129,
  },
  {
    title: "Toxic: A Fairy Tale for Grown-ups",
    certificate: "A",
    languages: ["Hindi", "Kannada", "Tamil"],
    runtimeMins: 152,
  },
];

export function filmMeta(film: Film) {
  return `${film.certificate} · ${film.languages[0]}${
    film.languages.length > 1 ? ` and ${film.languages.length - 1} more` : ""
  }`;
}
