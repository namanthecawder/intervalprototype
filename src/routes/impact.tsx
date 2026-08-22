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

const facts: { label: string; value: string; tag: Tag; note: string }[] = [
  {
    label: "Q1 FY27 NOV",
    value: "₹3,218 Cr",
    tag: "Disclosed",
    note: "+60% YoY, going-out segment",
  },
  { label: "Q1 FY27 revenue", value: "₹318 Cr", tag: "Disclosed", note: "+54% YoY" },
  { label: "Blended take rate", value: "9.9%", tag: "Computed", note: "318 ÷ 3,218" },
  { label: "Annualised NOV", value: "≈₹12,900 Cr", tag: "Computed", note: "Q1 × 4, no seasonality" },
  {
    label: "Monthly transactions",
    value: "≈6.3M",
    tag: "Computed",
    note: "NOV ÷ AOV ₹1,700, AOV held flat from FY26",
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
        <span className="pill-active">
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
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-lavender-deep accent-primary"
      />
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{note}</p>
    </div>
  );
}

function Impact() {
  const [attachRate, setAttachRate] = useState(6);
  const [cannibalisation, setCannibalisation] = useState(35);
  const [diningAov, setDiningAov] = useState(1400);
  const [diningTakeRate, setDiningTakeRate] = useState(6);

  const monthlyTxns = 6.3e6;
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
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-14">
        <p className="pill-active">The model</p>
        <h1 className="mt-5 max-w-3xl text-4xl leading-[1.1] sm:text-5xl">
          A sensitivity model, not a forecast.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Every input below is labelled disclosed, computed from disclosed figures, or assumed. Move
          the assumed ones and watch the case get stronger or collapse. It collapses below a 4%
          attach rate, and again above 60% cannibalisation.
        </p>

        <section className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="card-soft space-y-7 p-6">
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
              note="Share of attached dinners that would have been booked anyway. Above 60% this moves bookings around rather than creating them."
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
              note="Assumed. Interval's own plan set averages roughly this per head including the ticket."
              onChange={setDiningAov}
            />
            <Slider
              label="Dining take rate"
              value={diningTakeRate}
              min={2}
              max={12}
              step={0.5}
              suffix="%"
              note="Assumed thinner than the 9.9% blended rate, since ticketing carries the blend."
              onChange={setDiningTakeRate}
            />
          </div>

          <div className="space-y-6">
            <div className="card-soft grid grid-cols-2 gap-5 p-6">
              {outputs.map((o) => (
                <div key={o.label}>
                  <p className="text-2xl font-extrabold tracking-tight">{o.value}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{o.label}</p>
                </div>
              ))}
            </div>

            <div className="card-soft p-6">
              <h2 className="text-2xl">Inputs</h2>
              <ul className="mt-5 space-y-4">
                {facts.map((f) => (
                  <li key={f.label} className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.note}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold">{f.value}</p>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        {f.tag}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-3xl">What I cannot know from outside</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              "Has the user base grown, or has frequency? Current NOV implies ~6.3M monthly transactions against a last-disclosed 2M monthly transacting users at 2 each. If frequency already rose, this pushes on a door that is opening anyway.",
              "The transaction mix across movies, dining, events and sports. I assumed 60% movies; it is not disclosed, and the business is lumpy and seasonal.",
              "The take rate on dining specifically. Blended is 9.9%; dining is likely thinner than ticketing.",
              "How much of this demand already sits inside the food-delivery app and simply is not routed to the going-out app.",
            ].map((t) => (
              <p key={t} className="card-soft p-5 text-sm leading-relaxed text-muted-foreground">
                {t}
              </p>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            North star for the feature is going-out occasions per active user per month — not GMV,
            which rewards selling one expensive ticket rather than fixing frequency.
          </p>
        </section>
      </div>
    </div>
  );
}
