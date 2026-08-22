import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AREAS } from "@/data/venues";
import { fmt, rankPlans, type PlanInput } from "@/lib/planner";
import { PlanCard } from "@/components/PlanCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Interval — pair a film with dinner in Delhi NCR" },
      {
        name: "description",
        content:
          "Pick an area, a budget and a end time. Interval returns three evening plans with dinner, walk and showtime sequenced so the plan holds.",
      },
      { property: "og:title", content: "Interval — plan the whole evening, not half of it" },
      {
        property: "og:description",
        content:
          "Three ranked evening plans for Delhi NCR: dinner, walk, film, end time — sequenced, costed and distance-checked.",
      },
    ],
  }),
  component: PlanPage,
});

const BUDGETS = [700, 1000, 1500, 2500];
const PARTY_SIZES = [2, 3, 4];
const END_TIMES = [22 * 60, 23 * 60, 23 * 60 + 30, 24 * 60 + 30];

function PlanPage() {
  const [area, setArea] = useState<string>("Gurgaon");
  const [budgetPerPerson, setBudget] = useState(1500);
  const [partySize, setPartySize] = useState(2);
  const [latestEndMins, setLatestEnd] = useState(23 * 60 + 30);

  const input: PlanInput = { area, budgetPerPerson, partySize, latestEndMins };
  const plans = useMemo(() => rankPlans(input), [area, budgetPerPerson, partySize, latestEndMins]);

  return (
    <div className="page-wash">
      <div className="mx-auto max-w-6xl px-5 pb-4 pt-14">
        <p className="pill-active">Saturday evening · Delhi NCR</p>
        <h1 className="mt-5 max-w-3xl text-4xl leading-[1.1] sm:text-5xl">
          Plan the whole evening, not half of it.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Interval pairs a film with a restaurant within walking distance and sequences the timings —
          dinner, walk, showtime, end — so the plan does not fall apart at 20:15.
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-10">
        <section className="card-soft grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Control label="Area">
            {AREAS.map((a) => (
              <Choice key={a} active={a === area} onClick={() => setArea(a)}>
                {a}
              </Choice>
            ))}
          </Control>
          <Control label="Budget per person">
            {BUDGETS.map((b) => (
              <Choice key={b} active={b === budgetPerPerson} onClick={() => setBudget(b)}>
                ₹{b.toLocaleString("en-IN")}
              </Choice>
            ))}
          </Control>
          <Control label="Party size">
            {PARTY_SIZES.map((p) => (
              <Choice key={p} active={p === partySize} onClick={() => setPartySize(p)}>
                {p} people
              </Choice>
            ))}
          </Control>
          <Control label="Home by">
            {END_TIMES.map((t) => (
              <Choice key={t} active={t === latestEndMins} onClick={() => setLatestEnd(t)}>
                {fmt(t)}
              </Choice>
            ))}
          </Control>
        </section>
      </div>

      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-3xl">Three plans that hold together</h2>
          <p className="text-sm text-muted-foreground">
            Ranked on budget fit, rating and travel · 20 min buffer before the film
          </p>
        </div>

        {plans.length > 0 ? (
          <div className="no-scrollbar -mx-5 mt-7 flex gap-6 overflow-x-auto px-5 pb-4">
            {plans.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} rank={i + 1} partySize={partySize} />
            ))}
          </div>
        ) : (
          <div className="card-soft mt-7 p-8">
            <h3 className="text-lg">No plan survives those constraints</h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Either no restaurant sits within 2 km of a cinema in {area} with a meal that finishes
              20 minutes before a showtime, or every surviving pair breaks your budget or your end
              time. Try a later end time or a higher budget — Interval will not return a plan it
              thinks you would abandon.
            </p>
          </div>
        )}

        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Costs combine the cinema's average ticket price with half the restaurant's price-for-two,
          per head. Walking time is estimated at 12 minutes per kilometre in a straight line, so real
          walks run slightly longer. Nothing here is bookable.
        </p>
      </div>
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "pill-active"
          : "pill border border-border hover:border-primary/30 hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}
