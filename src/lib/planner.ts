import { cinemas, restaurants, type Cinema, type Restaurant } from "@/data/venues";
import { films, type Film } from "@/data/films";

export const BUFFER_MINS = 20;
export const WALK_MINS_PER_KM = 12;
export const MAX_RADIUS_KM = 2;
export const EARLIEST_SHOW_MINS = 17 * 60;

export type PlanInput = {
  area: string;
  budgetPerPerson: number;
  partySize: number;
  latestEndMins: number;
};

export type Plan = {
  id: string;
  restaurant: Restaurant;
  cinema: Cinema;
  film: Film;
  dinnerStart: number;
  dinnerEnd: number;
  walkMins: number;
  showStart: number;
  showEnd: number;
  distanceKm: number;
  costTotal: number;
  costPerPerson: number;
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

/** Per-person dinner spend estimate from the restaurant's price-for-two. */
function perPersonSpend(r: Restaurant): number {
  return Math.round(r.priceForTwo / 2);
}

export function buildCandidates(input: PlanInput): Plan[] {
  const areaCinemas = cinemas.filter((c) => c.area === input.area);
  const areaRestaurants = restaurants.filter((r) => r.area === input.area);
  const out: Plan[] = [];

  for (const cinema of areaCinemas) {
    for (const showtime of cinema.showtimes) {
      const showStart = toMins(showtime);
      if (showStart < EARLIEST_SHOW_MINS) continue;
      const film = filmFor(cinema, showtime);
      const showEnd = showStart + film.runtimeMins;
      if (showEnd > input.latestEndMins) continue;

      for (const restaurant of areaRestaurants) {
        const distanceKm = haversineKm(restaurant, cinema);
        if (distanceKm > MAX_RADIUS_KM) continue;
        const walkMins = Math.max(5, Math.round(distanceKm * WALK_MINS_PER_KM));
        const dinnerEnd = showStart - BUFFER_MINS - walkMins;
        const dinnerStart = dinnerEnd - restaurant.mealDurationMins;
        if (dinnerStart < 17 * 60 - 60) continue;

        const spend = perPersonSpend(restaurant) + cinema.avgTicketPrice;
        const costPerPerson = spend;
        const costTotal = spend * input.partySize;

        const budgetScore = Math.max(
          0,
          1 - Math.abs(costPerPerson - input.budgetPerPerson) / input.budgetPerPerson,
        );
        if (costPerPerson > input.budgetPerPerson * 1.25) continue;
        const ratingScore = restaurant.rating ? (restaurant.rating - 2.5) / 2.5 : 0.4;
        const travelScore = 1 - Math.min(1, distanceKm / MAX_RADIUS_KM);

        const score = budgetScore * 0.45 + ratingScore * 0.35 + travelScore * 0.2;

        out.push({
          id: `${cinema.name}|${showtime}|${restaurant.name}`,
          restaurant,
          cinema,
          film,
          dinnerStart,
          dinnerEnd,
          walkMins,
          showStart,
          showEnd,
          distanceKm,
          costTotal,
          costPerPerson,
          score,
          breakdown: { budget: budgetScore, rating: ratingScore, travel: travelScore },
        });
      }
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

/** Top three with forced variety: unique restaurants, max two per cinema, cuisine spread. */
export function rankPlans(input: PlanInput): Plan[] {
  const candidates = buildCandidates(input);
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
