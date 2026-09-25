import {
  cinemas,
  restaurants,
  type Cinema,
  type Restaurant,
  type Occasion,
  type Session,
} from "@/data/venues";
import { films, type Film } from "@/data/films";

export const BUFFER_MINS = 20;
export const WALK_MINS_PER_KM = 12;
export const MAX_RADIUS_KM = 2;
export const EARLIEST_SHOW_MINS = 17 * 60;
export const EARLIEST_DINNER_MINS = 18 * 60;
export const POST_FILM_GAP_MINS = 15;
export const LATE_DINNER_MINS = 21 * 60;
/** "Home by" means home, so every plan reserves this to actually get there. */
export const TRAVEL_HOME_MINS = 30;

export type PlanInput = {
  area: string;
  budgetPerPerson: number;
  partySize: number;
  latestEndMins: number;
  /** Optional so existing callers keep compiling; defaults to "date". */
  occasion?: Occasion;
  /** Only plan around this film (title). Null/undefined = any film. */
  film?: string | null;
  /** Nothing in the plan may start before this (e.g. "now + 20 min" when planning for today). */
  notBeforeMins?: number;
};

export type PlanOrder = "dinner-first" | "film-first";

export type Plan = {
  id: string;
  order: PlanOrder;
  restaurant: Restaurant;
  cinema: Cinema;
  film: Film;
  /** Screen format from District (IMAX, GOLD, 4DX...) when known. */
  format?: string;
  /** True when the film is a real listing for this showtime, not an illustrative pick. */
  filmIsReal: boolean;
  dinnerStart: number;
  dinnerEnd: number;
  walkMins: number;
  showStart: number;
  showEnd: number;
  distanceKm: number;
  costTotal: number;
  costPerPerson: number;
  costDinnerPerPerson: number;
  costFilmPerPerson: number;
  endsAt: number;
  homeByMins: number;
  score: number;
  breakdown: { budget: number; rating: number; travel: number };
};

export function toMins(label: string): number {
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 0;
  let h = Number(m[1]!) % 12;
  if (m[3]!.toUpperCase() === "PM") h += 12;
  return h * 60 + Number(m[2]!);
}

export function fmt(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function filmFor(cinema: Cinema, showtime: string): Film {
  return films[hash(cinema.name + showtime) % films.length]!;
}

/** Real per-film sessions when we have them, otherwise showtimes with an illustrative film. */
function slotsFor(cinema: Cinema): (Session & { real: boolean })[] {
  if (cinema.sessions?.length) return cinema.sessions.map((s) => ({ ...s, real: true }));
  return cinema.showtimes.map((time) => ({ time, film: filmFor(cinema, time), real: false }));
}

/** Per-person dinner spend estimate from the restaurant's price-for-two. */
function perPersonSpend(r: Restaurant): number {
  return Math.round(r.priceForTwo / 2);
}

/**
 * Occasion is a HARD filter, never a score. A sweet shop can be cheap, close
 * and well rated and still be the wrong answer for a date.
 */
function fitsOccasion(r: Restaurant, occasion: Occasion): boolean {
  if (!r.occasionFit.includes(occasion)) return false;
  // Reservations are only known for hand-collected venues.
  if (occasion === "date" && !r.takesReservations && r.source !== "live") return false;
  if (occasion === "family" && r.venueType === "bar") return false;
  return true;
}

export function buildCandidates(
  input: PlanInput,
  cinemaList: Cinema[] = cinemas,
  restaurantList: Restaurant[] = restaurants,
): Plan[] {
  const occasion: Occasion = input.occasion ?? "date";
  const notBefore = input.notBeforeMins ?? 0;
  const filmKey = input.film ? input.film.toLowerCase() : null;
  const areaCinemas = cinemaList.filter((c) => c.area === input.area);
  const areaRestaurants = restaurantList.filter(
    (r) => r.area === input.area && fitsOccasion(r, occasion),
  );
  const out: Plan[] = [];

  for (const cinema of areaCinemas) {
    for (const slot of slotsFor(cinema)) {
      const showtime = slot.time;
      const showStart = toMins(showtime);
      if (showStart < EARLIEST_SHOW_MINS || showStart < notBefore) continue;
      const film = slot.film;
      if (filmKey && film.title.toLowerCase() !== filmKey) continue;
      const showEnd = showStart + film.runtimeMins;
      // dinner-first ends at the film; leave room to get home afterwards
      if (showEnd + TRAVEL_HOME_MINS > input.latestEndMins) continue;

      for (const restaurant of areaRestaurants) {
        const distanceKm = haversineKm(restaurant, cinema);
        if (distanceKm > MAX_RADIUS_KM) continue;
        const walkMins = Math.max(5, Math.round(distanceKm * WALK_MINS_PER_KM));

        // Dinner first when the meal can start at or after 18:00.
        let order: PlanOrder = "dinner-first";
        let dinnerEnd = showStart - BUFFER_MINS - walkMins;
        let dinnerStart = dinnerEnd - restaurant.mealDurationMins;

        if (dinnerStart < EARLIEST_DINNER_MINS) {
          // Too early to be dinner. Flip: film, then walk, then a 15 min gap.
          order = "film-first";
          dinnerStart = showEnd + walkMins + POST_FILM_GAP_MINS;
          dinnerEnd = dinnerStart + restaurant.mealDurationMins;
          if (dinnerStart < EARLIEST_DINNER_MINS) continue;
          if (dinnerEnd + TRAVEL_HOME_MINS > input.latestEndMins) continue;
        }

        if (dinnerStart < notBefore) continue;

        const costDinnerPerPerson = perPersonSpend(restaurant);
        const costFilmPerPerson = cinema.avgTicketPrice;
        const costPerPerson = costDinnerPerPerson + costFilmPerPerson;
        const costTotal = costPerPerson * input.partySize;

        // Budget applies to the FOOD, not the ticket. 25% headroom.
        if (costDinnerPerPerson > input.budgetPerPerson * 1.25) continue;

        const budgetScore = Math.max(
          0,
          1 - Math.abs(costDinnerPerPerson - input.budgetPerPerson) / input.budgetPerPerson,
        );
        const ratingScore = restaurant.rating ? (restaurant.rating - 2.5) / 2.5 : 0.4;
        const travelScore = 1 - Math.min(1, distanceKm / MAX_RADIUS_KM);

        const weights =
          occasion === "friends"
            ? { budget: 0.45, rating: 0.30, travel: 0.25 }
            : occasion === "quick"
              ? { budget: 0.30, rating: 0.20, travel: 0.50 }
              : occasion === "family"
                ? { budget: 0.40, rating: 0.35, travel: 0.25 }
                : { budget: 0.35, rating: 0.40, travel: 0.25 }; // date

        let score =
          budgetScore * weights.budget +
          ratingScore * weights.rating +
          travelScore * weights.travel;

        // People would rather eat before the film. Film-first is a fallback.
        if (order === "dinner-first") score += 0.1;
        // A meal starting after 21:00 is a late bite, not an evening out.
        if (dinnerStart > LATE_DINNER_MINS) score -= 0.15;

        out.push({
          id: `${cinema.name}|${showtime}|${film.title}|${restaurant.name}`,
          order,
          restaurant,
          cinema,
          film,
          ...(slot.format ? { format: slot.format } : {}),
          filmIsReal: slot.real,
          dinnerStart,
          dinnerEnd,
          walkMins,
          showStart,
          showEnd,
          distanceKm,
          costTotal,
          costPerPerson,
          costDinnerPerPerson,
          costFilmPerPerson,
          endsAt: order === "film-first" ? dinnerEnd : showEnd,
          homeByMins: input.latestEndMins,
          score,
          breakdown: { budget: budgetScore, rating: ratingScore, travel: travelScore },
        });
      }
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

/** Top three with forced variety: unique restaurants, max two per cinema, cuisine spread. */
export function rankPlans(
  input: PlanInput,
  cinemaList?: Cinema[],
  restaurantList?: Restaurant[],
): Plan[] {
  const candidates = buildCandidates(input, cinemaList, restaurantList);
  const chosen: Plan[] = [];
  const usedRestaurants = new Set<string>();
  const cinemaCount = new Map<string, number>();
  const usedCuisines = new Set<string>();

  for (const pass of [0, 1]) {
    for (const plan of candidates) {
      if (chosen.length === 3) break;
      if (usedRestaurants.has(plan.restaurant.name)) continue;
      if ((cinemaCount.get(plan.cinema.name) ?? 0) >= 2) continue;
      const lead = plan.restaurant.cuisines[0] ?? "";
      if (pass === 0 && usedCuisines.has(lead)) continue;
      chosen.push(plan);
      usedRestaurants.add(plan.restaurant.name);
      usedCuisines.add(lead);
      cinemaCount.set(plan.cinema.name, (cinemaCount.get(plan.cinema.name) ?? 0) + 1);
    }
  }
  return chosen;
}