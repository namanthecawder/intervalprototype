import { createFileRoute } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { restaurants } from "@/data/venues";
import { BUFFER_MINS, MAX_RADIUS_KM, WALK_MINS_PER_KM } from "@/lib/planner";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Interval scores an evening plan" },
      {
        name: "description",
        content:
          "The filtering and scoring logic behind Interval's evening plans, stated honestly — including what it gets wrong.",
      },
      { property: "og:title", content: "How Interval scores an evening plan" },
      {
        property: "og:description",
        content:
          "Radius filter, per-restaurant meal duration, a 20-minute buffer, then a weighted score — plus the limits of all four.",
      },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  {
    n: "01",
    title: "Take every showtime after 17:00",
    body: "In the selected area only. Matinees are filtered out — nobody plans dinner around an 09:35 show. Cinemas within walking distance of the area's restaurants are found automatically, with today's per-film showtimes and runtimes pulled from District's public listings.",
  },
  {
    n: "02",
    title: `Find restaurants within ${MAX_RADIUS_KM} km of that cinema`,
    body: `Straight-line distance, converted to walking time at ${WALK_MINS_PER_KM} minutes per kilometre. Beyond 2 km the walk stops being a walk and the plan needs a cab, which is a different product.`,
  },
  {
    n: "03",
    title: "Keep only pairs where the meal actually finishes in time",
    body: `A meal of that restaurant's own duration must end ${BUFFER_MINS} minutes before the showtime, after allowing for the walk. Meal duration is a per-restaurant field: a ₹500 counter-service place is 45 minutes, a ₹3,500 restaurant is 90. Treating every meal as one length is what makes naive versions of this feature produce plans people abandon.`,
  },
  {
    n: "04",
    title: "Score the survivors",
    body: "Budget fit carries 45% of the weight — distance from your stated per-head budget, with anything more than 25% over the budget discarded outright. Rating carries 35%, normalised from a 2.5–5.0 range. Travel time carries the remaining 20%.",
  },
  {
    n: "05",
    title: "Force variety, then return three",
    body: "No two plans may share a restaurant, at most two may share a cinema, and the first pass refuses to repeat a lead cuisine. Three plans that differ are more useful than three near-identical ones with better scores.",
  },
];

const limits = [
  "Distance is straight-line. Real walking routes are longer, and inside a mall the last 200 metres can cost five minutes on their own.",
  "Meal durations are judgement calls anchored to price band, not observed table times. This is the single assumption most worth replacing with real data.",
  "Cost is an estimate: average ticket price plus half the restaurant's price-for-two. Drinks will break it.",
  "Ratings are a snapshot, not ingested live, and one restaurant in the set has no rating at all — it scores as slightly below average rather than being excluded.",
  "Bookability is unverified. Every venue is marked as such rather than claimed as bookable.",
  "Showtimes are today's public District listings, refreshed every 10 minutes. No seat availability or sold-out state, and a film with no listed runtime is assumed to run 150 minutes.",
];

function HowItWorks() {
  const durations = [...new Set(restaurants.map((r) => r.mealDurationMins))].sort((a, b) => a - b);
  const counts = durations.map((d) => restaurants.filter((r) => r.mealDurationMins === d).length);
  const maxCount = Math.max(...counts);

  return (
    <div className="page-wash">
      <div className="mx-auto max-w-4xl px-4 pb-8 pt-14 sm:px-6 sm:pt-20">
        <p className="eyebrow">The logic</p>
        <h1 className="mt-4 text-4xl leading-[1.05] sm:text-5xl">
          How a plan gets picked — and where it breaks.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Interval is a sequencing engine over {restaurants.length} hand-collected restaurants and
          live District showtimes. Five steps, four inputs, and the limits worth stating out loud.
        </p>

        <ol className="relative mt-14">
          <span aria-hidden className="absolute bottom-6 left-[1.2rem] top-6 w-px bg-border" />
          {steps.map((s) => (
            <li key={s.n} className="relative flex gap-5 pb-9 last:pb-0 sm:gap-7">
              <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-sm font-medium tabular-nums text-foreground">
                {s.n}
              </span>
              <div className="pt-1.5">
                <h2 className="text-xl leading-snug">{s.title}</h2>
                <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <section className="card-soft mt-16 p-6 sm:p-8">
          <h2 className="text-2xl">Meal duration is a field, not a constant</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            How long each restaurant's meal is assumed to take, across all {restaurants.length} venues.
          </p>
          <div className="mt-6 space-y-3">
            {durations.map((d, i) => (
              <div key={d} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-sm">
                <span className="font-semibold tabular-nums">{d} min</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-dinner"
                    style={{ width: `${(counts[i]! / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">
                  {counts[i]} venue{counts[i] === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl sm:text-3xl">What this gets wrong</h2>
          <ul className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {limits.map((l) => (
              <li key={l} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-dinner" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
