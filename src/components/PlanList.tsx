import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

import { fetchDistrictDetails } from "@/lib/districtApi";
import { fmt, TRAVEL_HOME_MINS, type Plan } from "@/lib/planner";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const distance = (km: number) =>
  km < 0.08 ? "same building" : km < 1 ? `${Math.round(km * 20) * 50} m` : `${km.toFixed(1)} km`;
const short = (s: string) => s.split(",")[0]!.replace(/\s*\(.*\)$/, "");

type Seg = { kind: "dinner" | "walk" | "gap" | "film" | "home"; from: number; to: number };

function segments(p: Plan): Seg[] {
  const home = p.endsAt + TRAVEL_HOME_MINS;
  if (p.order === "film-first") {
    const w = p.showEnd + p.walkMins;
    return [
      { kind: "film", from: p.showStart, to: p.showEnd },
      { kind: "walk", from: p.showEnd, to: w },
      { kind: "gap", from: w, to: p.dinnerStart },
      { kind: "dinner", from: p.dinnerStart, to: p.dinnerEnd },
      { kind: "home", from: p.dinnerEnd, to: home },
    ];
  }
  const w = p.dinnerEnd + p.walkMins;
  return [
    { kind: "dinner", from: p.dinnerStart, to: p.dinnerEnd },
    { kind: "walk", from: p.dinnerEnd, to: w },
    { kind: "gap", from: w, to: p.showStart },
    { kind: "film", from: p.showStart, to: p.showEnd },
    { kind: "home", from: p.showEnd, to: home },
  ];
}

const SEG: Record<Seg["kind"], string> = {
  dinner: "bg-dinner",
  film: "bg-film",
  walk: "bg-foreground/25",
  gap: "bg-foreground/10",
  home: "bg-foreground/10",
};

function Timeline({ plan }: { plan: Plan }) {
  const segs = segments(plan).filter((s) => s.to > s.from);
  const start = segs[0]!.from;
  const end = segs[segs.length - 1]!.to;
  return (
    <div className="flex h-1.5 w-full gap-0.5" aria-hidden>
      {segs.map((s, i) => (
        <div
          key={i}
          className={`h-full rounded-full ${SEG[s.kind]}`}
          style={{ width: `${((s.to - s.from) / (end - start)) * 100}%` }}
        />
      ))}
    </div>
  );
}

function Stop({
  color,
  time,
  title,
  meta,
}: {
  color: string;
  time: string;
  title: ReactNode;
  meta: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[4.75rem_1fr] gap-3 sm:grid-cols-[6.5rem_1fr]">
      <span className="mono pt-0.5 text-[0.78rem] text-muted-foreground">{time}</span>
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-medium leading-snug">
          <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
          <span className="min-w-0 truncate">{title}</span>
        </p>
        <p className="mt-0.5 pl-4 text-[0.8rem] leading-snug text-muted-foreground">{meta}</p>
      </div>
    </div>
  );
}

function LinkButton({ href, children, strong = false }: { href: string; children: ReactNode; strong?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[0.8rem] font-medium transition-colors ${
        strong
          ? "bg-foreground text-background hover:bg-foreground/85"
          : "border border-border bg-card hover:border-foreground/30"
      }`}
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
    </a>
  );
}

export function PlanItem({
  plan,
  rank,
  partySize,
  selected,
  onSelect,
  mapSlot,
}: {
  plan: Plan;
  rank: number;
  partySize: number;
  selected: boolean;
  onSelect: () => void;
  mapSlot?: ReactNode;
}) {
  const r = plan.restaurant;
  const filmFirst = plan.order === "film-first";
  const start = filmFirst ? plan.showStart : plan.dinnerStart;
  const home = plan.endsAt + TRAVEL_HOME_MINS;
  const filmTitle = plan.filmIsReal ? plan.film.title : `${fmt(plan.showStart)} show`;

  // District booking + offers for hand-collected restaurants that have a Zomato/District URL
  const district = useQuery({
    queryKey: ["district", r.sourceUrl],
    queryFn: ({ signal }) => fetchDistrictDetails(r.sourceUrl, signal),
    enabled: selected && /zomato\.com|district\.in/.test(r.sourceUrl),
    staleTime: 60 * 60 * 1000,
    retry: 0,
  });
  const d = district.data;

  const directions = `https://www.google.com/maps/dir/?api=1&origin=${r.lat},${r.lng}&destination=${plan.cinema.lat},${plan.cinema.lng}&travelmode=walking`;
  const dinnerMeta = [
    r.cuisines.slice(0, 2).join(", "),
    r.rating ? `★ ${r.rating}` : null,
    `${r.priceEstimated ? "~" : ""}${inr(plan.costDinnerPerPerson)} pp`,
    `${r.mealDurationMins} min`,
  ]
    .filter(Boolean)
    .join(" · ");
  const filmMeta = [
    short(plan.cinema.name),
    plan.format,
    plan.filmIsReal ? plan.film.certificate || null : null,
    plan.filmIsReal && !plan.film.runtimeEstimated ? `${plan.film.runtimeMins} min` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const dinner = (
    <Stop
      key="d"
      color="bg-dinner"
      time={`${fmt(plan.dinnerStart)}–${fmt(plan.dinnerEnd)}`}
      title={r.name}
      meta={dinnerMeta}
    />
  );
  const film = (
    <Stop
      key="f"
      color="bg-film"
      time={`${fmt(plan.showStart)}–${fmt(plan.showEnd)}`}
      title={filmTitle}
      meta={filmMeta}
    />
  );
  const walk = (
    <Stop
      key="w"
      color="bg-foreground/25"
      time={`${plan.walkMins} min`}
      title={<span className="font-normal text-muted-foreground">Walk · {distance(plan.distanceKm)}</span>}
      meta={null}
    />
  );

  return (
    <li
      className={`rounded-2xl border transition-all ${
        selected ? "border-foreground/15 bg-card shadow-[0_8px_30px_-12px_oklch(0.19_0.005_285/18%)]" : "border-transparent hover:bg-card/70"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-expanded={selected}
        className="flex w-full items-start gap-4 px-4 py-4 text-left sm:px-5"
      >
        <span className="mono mt-0.5 w-5 shrink-0 text-xs text-muted-foreground">{String(rank).padStart(2, "0")}</span>
        <span className="min-w-0 flex-1">
          <span className="mono block text-[0.78rem] text-muted-foreground">
            {fmt(start)} → {fmt(home)}
          </span>
          <span className="mt-1 flex min-w-0 flex-col text-[1.02rem] font-medium leading-snug sm:flex-row sm:items-center sm:gap-2">
            <span className="min-w-0 truncate">{filmFirst ? filmTitle : short(r.name)}</span>
            <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground sm:gap-2 sm:text-foreground">
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate">{filmFirst ? short(r.name) : filmTitle}</span>
            </span>
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="tnum block text-[1.02rem] font-medium">{inr(plan.costPerPerson)}</span>
          <span className="block text-[0.72rem] text-muted-foreground">per person</span>
        </span>
      </button>

      {selected ? (
        <div className="space-y-5 px-4 pb-5 sm:px-5 sm:pl-14">
          <Timeline plan={plan} />
          <div className="space-y-3">{filmFirst ? [film, walk, dinner] : [dinner, walk, film]}</div>
          {mapSlot}
          <div className="flex flex-wrap items-center gap-2">
            {plan.film.url || plan.cinema.url ? (
              <LinkButton href={plan.film.url ?? plan.cinema.url!} strong>
                Tickets
              </LinkButton>
            ) : null}
            {d?.bookable ? <LinkButton href={d.url}>Book a table</LinkButton> : null}
            <LinkButton href={directions}>Walking directions</LinkButton>
            <span className="tnum ml-auto text-[0.75rem] text-muted-foreground">
              {inr(plan.costTotal)} for {partySize}
            </span>
          </div>
          {d?.offers.length ? (
            <p className="text-[0.8rem] text-muted-foreground">
              <span className="font-medium text-foreground">Offer · </span>
              {d.offers[0]}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
