import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/impact")({
  head: () => ({
    meta: [
      { title: "Interval — the sensitivity model, assumptions labelled" },
      {
        name: "description",
        content:
          "A transparent sensitivity model for attaching dinner to a movie booking: every input labelled disclosed, computed or assumed.",
      },
      { property: "og:title", content: "Interval — the sensitivity model" },
      {
        property: "og:description",
        content:
          "Move the attach rate and cannibalisation dials and watch incremental NOV and revenue move. Nothing here is a forecast.",
      },
    ],
  }),
  component: Impact,
});

type Tag = "Disclosed" | "Computed" | "Assumed";

/* Derivation chain, kept as constants so no figure on this page is a magic number. */
const NOV_Q_CR = 3218;
const REV_Q_CR = 318;
const ANNUAL_NOV_CR = NOV_Q_CR * 4; // 12,872
const AOV_ASSUMED = 1700; // last disclosed FY26, held flat
const MONTHLY_TXNS = (ANNUAL_NOV_CR * 1e7) / AOV_ASSUMED / 12; // ≈6.31M

const facts: { label: string; value: string; tag: Tag; note: string }[] = [
  {
    label: "Q1 FY27 NOV",
    value: `₹${NOV_Q_CR.toLocaleString("en-IN")} Cr`,
    tag: "Disclosed",
    note: "+60% YoY, going-out segment",
  },
  {
    label: "Q1 FY27 revenue",
    value: `₹${REV_Q_CR} Cr`,
    tag: "Disclosed",
    note: "+54% YoY",
  },
  { label: "Blended take rate", value: "9.9%", tag: "Computed", note: "318 ÷ 3,218" },
  {
    label: "Annualised NOV",
    value: `₹${ANNUAL_NOV_CR.toLocaleString("en-IN")} Cr`,
    tag: "Computed",
    note: "Q1 × 4 exactly, no seasonality adjustment",
  },
  {
    label: "AOV used to derive transactions",
    value: `₹${AOV_ASSUMED.toLocaleString("en-IN")}`,
    tag: "Assumed",
    note: "Last disclosed FY26 figure, held flat. Not disclosed for FY27.",
  },
  {
    label: "Monthly transactions",
    value: `≈${(MONTHLY_TXNS / 1e6).toFixed(2)}M`,
    tag: "Computed",
    note: "₹12,872 Cr ÷ ₹1,700 ÷ 12. Rests on the assumed AOV above.",
  },
  {
    label: "Movie share of transactions",
    value: "60%",
    tag: "Assumed",
    note: "Mix is not disclosed and is seasonal",
  },
];

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  prefix = "",
  note,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  prefix?: string;
  note: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <span className="rounded-lg bg-surface px-2.5 py-1 text-sm font-bold tabular-nums">
          {prefix}
          {value.toLocaleString("en-IN")}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-foreground/10 accent-foreground"
      />
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{note}</p>
    </div>
  );
}

function Impact() {
  const [attachRate, setAttachRate] = useState(6);
  const [cannibalisation, setCannibalisation] = useState(35);
  const [diningAov, setDiningAov] = useState(1900);
  const [diningTakeRate, setDiningTakeRate] = useState(6);

  const monthlyTxns = MONTHLY_TXNS;
  const movieTxns = monthlyTxns * 0.6;
  const attached = movieTxns * (attachRate / 100);
  const incremental = attached * (1 - cannibalisation / 100);
  const monthlyNovCr = (incremental * diningAov) / 1e7;
  const annualNovCr = monthlyNovCr * 12;
  const annualRevenueCr = annualNovCr * (diningTakeRate / 100);
  const frequencyLift = (incremental / monthlyTxns) * 100;

  const outputs = [
    { label: "Incremental dining bookings / month", value: `${Math.round(incremental / 1000)}K` },
    { label: "Incremental NOV / year", value: `₹${Math.round(annualNovCr).toLocaleString("en-IN")} Cr` },
    {
      label: "Incremental revenue / year",
      value: `₹${Math.round(annualRevenueCr).toLocaleString("en-IN")} Cr`,
    },
    { label: "Lift on transactions per user", value: `+${frequencyLift.toFixed(1)}%` },
  ];

  return (
    <div className="page-wash">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-14 sm:px-6 sm:pt-20">
        <p className="eyebrow">The model</p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-[1.05] sm:text-5xl">
          A sensitivity model, not a forecast.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Every input below is labelled disclosed, computed from disclosed figures, or assumed. Move
          the assumed ones and watch the case get stronger or collapse. Dining and ticketing already
          sit in the same app, so this adds sequencing rather than supply, which makes cannibalisation
          the load-bearing assumption here, not the attach rate. The case collapses above 60%
          cannibalisation, and again below a 4% attach rate.
        </p>

        <section className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="card-soft space-y-8 p-6 sm:p-8">
            <h2 className="text-2xl">Dials</h2>
            <Slider
              label="Attach rate"
              value={attachRate}
              min={1}
              max={20}
              step={0.5}
              suffix="%"
              note="Share of movie bookings that add a dining booking in the same session. Modelled floor 2%; below 4% the feature is not worth its surface area."
              onChange={setAttachRate}
            />
            <Slider
              label="Cannibalisation"
              value={cannibalisation}
              min={0}
              max={90}
              step={5}
              suffix="%"
              note="The load-bearing assumption. Dining already exists on District, so some of these dinners get booked with or without a prompt. 35% is my estimate and I have no way to verify it from outside. Above 60% this moves bookings around rather than creating them and the case dies."
              onChange={setCannibalisation}
            />
            <Slider
              label="Dining AOV"
              value={diningAov}
              min={600}
              max={3000}
              step={100}
              suffix=""
              prefix="₹"
              note="Assumed. Median price-for-two across the 64 venues I collected by hand. AOV is the bill for the table, not per head, since one booking covers the party."
              onChange={setDiningAov}
            />
            <Slider
              label="Dining take rate"
              value={diningTakeRate}
              min={2}
              max={12}
              step={0.5}
              suffix="%"
              note="Assumed thinner than the 9.9% blend. That blend is by value, not transaction count: at 6% on dining, ticketing has to run 10.9% to 11.6% depending on dining's share of NOV, which is where convenience fees sit."
              onChange={setDiningTakeRate}
            />
          </div>

          <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <div className="night-band overflow-hidden rounded-[calc(var(--radius)+4px)] p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dinner">
                What those dials produce
              </p>
              <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-6">
                {outputs.map((o) => (
                  <div key={o.label}>
                    <p className="text-3xl font-semibold tracking-tight tabular-nums">{o.value}</p>
                    <p className="mt-1 text-xs leading-relaxed text-night-foreground/65">{o.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-soft p-6 sm:p-8">
              <h2 className="text-2xl">Inputs</h2>
              <ul className="mt-5 space-y-4">
                {facts.map((f) => (
                  <li key={f.label} className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.note}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums">{f.value}</p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] ${
                          f.tag === "Disclosed"
                            ? "bg-emerald-500/12 text-emerald-700"
                            : f.tag === "Computed"
                              ? "bg-film/10 text-film"
                              : "bg-dinner/15 text-amber-accent-foreground"
                        }`}
                      >
                        {f.tag}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl sm:text-3xl">What I cannot know from outside</h2>
          <ol className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
            {[
              "How many dining bookings on District already happen on the same evening as a film booking by the same user. That single query decides whether cannibalisation is 20% or 70%, and it is the difference between this being worth building and being a reshuffle.",
              "Has the user base grown, or has frequency? Current NOV implies ~6.31M monthly transactions against a last-disclosed 2M monthly transacting users at 2 each. If frequency already rose, this pushes on a door that is opening anyway.",
              "The transaction mix across movies, dining, events and sports. I assumed 60% movies; it is not disclosed, and the business is lumpy and seasonal.",
              "The take rate on dining specifically. Blended is 9.9%; dining is likely thinner than ticketing, but the split between them is not published.",
            ].map((t, i) => (
              <li key={t} className="flex gap-4 text-sm leading-relaxed text-muted-foreground">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-xs font-bold text-foreground">
                  {i + 1}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
          <div className="mt-12 rounded-2xl border border-film/15 bg-film/5 p-6 sm:p-8">
            <p className="eyebrow">North star</p>
            <p className="mt-2 max-w-3xl text-lg font-semibold leading-snug">
              Going-out occasions per active user per month — not GMV, which rewards selling one
              expensive ticket rather than fixing frequency.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}