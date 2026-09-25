// Client for the District scraper API (district-scraper/).
//   1. /cinemas/nearby   → cinemas in the area, with per-film showtimes for a date
//   2. /restaurants/nearby → restaurants within walking distance of those cinemas
//   3. /restaurants/district → booking + offers for a restaurant's District page
import {
  cinemas as sampleCinemas,
  restaurants as handRestaurants,
  type Cinema,
  type Restaurant,
  type Session,
} from "@/data/venues";
import { films as sampleFilms, type Film } from "@/data/films";
import { haversineKm } from "@/lib/planner";

export const DISTRICT_API_URL = (
  (import.meta.env["VITE_DISTRICT_API_URL"] as string | undefined) ?? "http://localhost:8000"
).replace(/\/$/, "");

export type Area = {
  name: string;
  /** District's city slug for cinema listings */
  city: string;
  center: { lat: number; lng: number };
  radiusKm: number;
};

export const AREAS: Area[] = [
  { name: "Gurgaon", city: "gurgaon", center: { lat: 28.4595, lng: 77.0466 }, radiusKm: 9 },
  { name: "Noida", city: "noida", center: { lat: 28.5672, lng: 77.3411 }, radiusKm: 8 },
  { name: "South Delhi", city: "new-delhi", center: { lat: 28.5355, lng: 77.2167 }, radiusKm: 7 },
];

/** How far from a cinema we look for dinner (metres). Planner caps walks at 2 km. */
const RESTAURANT_RADIUS_M = 1200;
const DEFAULT_RUNTIME_MINS = 150;
const DEFAULT_TICKET_PRICE = 450;

/* ---------------------------------------------------------------- types */

export type FilmOption = {
  title: string;
  poster: string | null;
  certificate: string | null;
  languages: string | null;
  runtimeMins: number | null;
  sessions: number;
  cinemas: number;
};

export type Showtimes = { cinemas: Cinema[]; films: FilmOption[]; warnings: string[] };

type ApiSession = { time: string; format: string | null };
type ApiFilm = {
  title: string;
  movie_id: string | null;
  slug: string | null;
  poster: string | null;
  certificate: string | null;
  languages: string | null;
  runtime_mins: number | null;
  sessions: ApiSession[];
};
type ApiCinema = {
  cinema_id: string;
  name: string;
  url: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  films: ApiFilm[];
};
type ApiFilmSummary = {
  title: string;
  poster: string | null;
  certificate: string | null;
  languages: string | null;
  runtime_mins: number | null;
  sessions: number;
  cinemas: number;
};
type ApiRestaurant = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: string | null;
  cuisines: string[];
  price_for_two: number | null;
  rating: number | null;
  address: string | null;
  maps_url: string | null;
};
export type DistrictDetails = {
  url: string;
  price_for_two: number | null;
  rating: number | null;
  rating_count: number | null;
  hours: string | null;
  bookable: boolean;
  offers: string[];
};

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${DISTRICT_API_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return (await res.json()) as T;
}

/* ---------------------------------------------------------------- cinemas + films */

function brandOf(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("pvr") || n.includes("inox")) return "PVR INOX";
  if (n.includes("cinepolis")) return "Cinepolis";
  return name.split(/[ ,]/)[0] ?? name;
}

function knownCinema(name: string, lat: number, lng: number): Cinema | undefined {
  return sampleCinemas.find(
    (c) => haversineKm(c, { lat, lng }) < 0.4 && brandOf(c.name) === brandOf(name),
  );
}

function toFilm(f: ApiFilm): Film {
  const known = sampleFilms.find((s) => s.title.toLowerCase() === f.title.toLowerCase());
  const runtime = f.runtime_mins ?? known?.runtimeMins;
  return {
    title: f.title,
    certificate: f.certificate ?? known?.certificate ?? "",
    languages: f.languages
      ? f.languages.split(/,| and /).map((l) => l.trim()).filter(Boolean)
      : (known?.languages ?? []),
    runtimeMins: runtime ?? DEFAULT_RUNTIME_MINS,
    runtimeEstimated: runtime == null,
    ...(f.slug ? { url: `https://www.district.in/movies/${f.slug}` } : {}),
  };
}

function toCinema(c: ApiCinema, area: string): Cinema | null {
  if (c.lat == null || c.lng == null) return null;
  const sessions: Session[] = c.films.flatMap((f) => {
    const film = toFilm(f);
    return f.sessions.map((s) => ({ time: s.time, film, ...(s.format ? { format: s.format } : {}) }));
  });
  if (sessions.length === 0) return null;
  const known = knownCinema(c.name, c.lat, c.lng);
  return {
    name: c.name,
    brand: brandOf(c.name),
    locality: c.address ?? known?.locality ?? c.name,
    area,
    lat: c.lat,
    lng: c.lng,
    showtimes: [...new Set(sessions.map((s) => s.time))],
    avgTicketPrice: known?.avgTicketPrice ?? DEFAULT_TICKET_PRICE,
    sessions,
    source: "live",
    url: c.url,
  };
}

export async function fetchShowtimes(area: Area, date: string, signal?: AbortSignal): Promise<Showtimes> {
  const data = await post<{ cinemas: ApiCinema[]; films: ApiFilmSummary[]; warnings: string[] }>(
    "/cinemas/nearby",
    { city: area.city, date, points: [area.center], radius_km: area.radiusKm },
    signal,
  );
  const cinemas = data.cinemas.map((c) => toCinema(c, area.name)).filter((c): c is Cinema => c !== null);
  const films: FilmOption[] = data.films.map((f) => ({
    title: f.title,
    poster: f.poster,
    certificate: f.certificate,
    languages: f.languages,
    runtimeMins: f.runtime_mins,
    sessions: f.sessions,
    cinemas: f.cinemas,
  }));
  return { cinemas, films, warnings: data.warnings };
}

/* ---------------------------------------------------------------- restaurants */

const VENUE_TYPE: Record<string, string> = {
  bar: "bar",
  cafe: "cafe",
  "quick bite": "qsr",
  restaurant: "casual_dining",
};
const PRICE_GUESS: Record<string, number> = { bar: 1800, cafe: 800, "quick bite": 500, restaurant: 1400 };

/** Same rule the hand-collected set uses where duration wasn't observed. */
function mealMins(priceForTwo: number, venueType: string): number {
  if (venueType === "qsr" || priceForTwo <= 800) return 45;
  if (priceForTwo <= 2000) return 70;
  if (priceForTwo <= 3500) return 90;
  return 100;
}

function toRestaurant(r: ApiRestaurant, area: string): Restaurant {
  const kind = r.kind ?? "restaurant";
  const venueType = VENUE_TYPE[kind] ?? "casual_dining";
  const price = r.price_for_two ?? PRICE_GUESS[kind] ?? 1400;
  return {
    name: r.name,
    cuisines: r.cuisines.length ? r.cuisines : [kind === "quick bite" ? "Quick bites" : kind === "bar" ? "Bar" : kind === "cafe" ? "Café" : "Restaurant"],
    locality: r.address ?? "",
    area,
    lat: r.lat,
    lng: r.lng,
    priceForTwo: price,
    rating: r.rating,
    takesReservations: false,
    mealDurationMins: mealMins(price, venueType),
    venueType,
    occasionFit: ["date", "friends", "family", "quick"],
    vegFriendly: "UNKNOWN",
    districtBooking: "CHECK",
    sourceUrl: "",
    checkedOn: new Date().toISOString().slice(0, 10),
    source: "live",
    priceEstimated: r.price_for_two == null,
    ...(r.maps_url ? { mapsUrl: r.maps_url } : {}),
  };
}

const norm = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");

/**
 * Restaurants within walking distance of the given cinemas: live results from the maps
 * scraper merged with the hand-collected set (hand-collected wins on duplicates, since it
 * has real prices, ratings and meal durations).
 */
export async function fetchRestaurantsNear(
  area: string,
  cinemas: Cinema[],
  signal?: AbortSignal,
): Promise<Restaurant[]> {
  const points = cinemas.slice(0, 40).map((c) => ({ lat: c.lat, lng: c.lng }));
  const data = await post<{ restaurants: ApiRestaurant[] }>(
    "/restaurants/nearby",
    { points, radius_m: RESTAURANT_RADIUS_M, per_point: 25 },
    signal,
  );
  const hand = handRestaurants.filter((r) => r.area === area);
  const live = data.restaurants
    .map((r) => toRestaurant(r, area))
    .filter((l) => !hand.some((h) => haversineKm(h, l) < 0.12 && (norm(h.name).includes(norm(l.name)) || norm(l.name).includes(norm(h.name)))));
  return [...hand, ...live];
}

export async function fetchDistrictDetails(sourceUrl: string, signal?: AbortSignal): Promise<DistrictDetails | null> {
  const data = await post<{ items: DistrictDetails[] }>("/restaurants/district", { urls: [sourceUrl] }, signal);
  return data.items[0] ?? null;
}
