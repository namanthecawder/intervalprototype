import { createFileRoute } from "@tanstack/react-router";
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
    body: "In the selected area only. Matinees are filtered out — nobody plans dinner around an 09:35 show. Showtimes are Saturday listings hand-collected on 22 August 2026.",
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
  "One Saturday's showtimes. No live inventory, no sold-out state, no seat availability.",
];

function HowItWorks() {
  const durations = [...new Set(restaurants.map((r) => r.mealDurationMins))].sort((a, b) => a - b);

  return (
    <div className="page-wash">
      <div className="mx-auto max-w-4xl px-5 pb-16 pt-14">
        <p className="pill-active">The logic</p>
        <h1 className="mt-5 text-4xl leading-[1.1] sm:text-5xl">
          How a plan gets picked — and where it breaks.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Interval is a sequencing engine over {restaurants.length} hand-collected restaurants and a
          set of Saturday showtimes. Five steps, four inputs, and a set of limits worth stating out
          loud.
        </p>

        <ol className="mt-12 space-y-4">
          {steps.map((s) => (
            <li key={s.n} className="card-soft flex gap-5 p-6">
              <span className="text-sm font-extrabold tracking-tight text-primary">{s.n}</span>
              <div>
                <h2 className="text-xl">{s.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-14">
          <h2 className="text-3xl">Meal duration is a field, not a constant</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {durations.map((d) => (
              <span key={d} className="pill-active">
                {d} min · {restaurants.filter((r) => r.mealDurationMins === d).length} venues
              </span>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-3xl">What this gets wrong</h2>
          <ul className="mt-6 space-y-3">
            {limits.map((l) => (
              <li key={l} className="card-soft p-5 text-sm leading-relaxed text-muted-foreground">
                {l}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
