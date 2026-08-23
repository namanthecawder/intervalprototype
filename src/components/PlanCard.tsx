import { fmt, type Plan } from "@/lib/planner";
import { filmMeta } from "@/data/films";

function Segment({
  label,
  detail,
  time,
  flex,
  minWidth,
  tone,
}: {
  label: string;
  detail: string;
  time: string;
  flex: number;
  minWidth: string;
  tone: "dinner" | "walk" | "film";
}) {
  const fill =
    tone === "dinner"
      ? "bg-lavender-deep"
      : tone === "walk"
        ? "bg-lavender"
        : "bg-primary";
  const text = tone === "film" ? "text-primary-foreground" : "text-foreground";
  return (
    <div style={{ flexGrow: flex, flexBasis: 0, minWidth }} className="min-w-0">
      <div className={`rounded-full ${fill} px-3.5 py-2 ${text}`}>
        <p className="whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[0.1em] opacity-80">
          {label}
        </p>
        <p className="whitespace-nowrap text-sm font-semibold tabular-nums">{time}</p>
      </div>
      <p className="mt-2 px-1 text-xs leading-snug text-muted-foreground">{detail}</p>
    </div>
  );
}

/** One labelled block in the detail row. min-w-0 is what stops cells colliding. */
function Fact({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold leading-snug break-words">{value}</dd>
      {sub ? (
        <dd className="mt-0.5 text-xs leading-snug text-muted-foreground break-words">
          {sub}
        </dd>
      ) : null}
    </div>
  );
}

export function PlanCard({
  plan,
  rank,
  partySize,
}: {
  plan: Plan;
  rank: number;
  partySize: number;
}) {
  const filmFirst = plan.order === "film-first";
  const start = filmFirst ? plan.showStart : plan.dinnerStart;
  const end = filmFirst ? plan.dinnerEnd : plan.showEnd;
  const total = end - start;
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const dinnerSegment = (
    <Segment
      key="dinner"
      tone="dinner"
      label="Dinner"
      time={`${fmt(plan.dinnerStart)}–${fmt(plan.dinnerEnd)}`}
      detail={plan.restaurant.locality}
      minWidth="9.5rem"
      flex={plan.restaurant.mealDurationMins}
    />
  );
  const walkSegment = (
    <Segment
      key="walk"
      tone="walk"
      label="Walk"
      time={`${plan.walkMins}m`}
      detail={`${plan.distanceKm.toFixed(1)} km`}
      minWidth="5.25rem"
      flex={Math.max(30, plan.walkMins * 1.6)}
    />
  );
  const filmSegment = (
    <Segment
      key="film"
      tone="film"
      label="Film"
      time={`${fmt(plan.showStart)}–${fmt(plan.showEnd)}`}
      detail={plan.film.title}
      minWidth="9.5rem"
      flex={plan.film.runtimeMins}
    />
  );

  return (
    <article className="card-soft col-span-full mx-auto flex w-full max-w-4xl flex-col gap-5 p-6 sm:p-7">
      {/* --- header --- */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Plan {rank} · {filmFirst ? "Film first" : "Dinner first"}
          </p>
          <h3 className="mt-1 text-xl leading-tight break-words">
            {plan.restaurant.name}
          </h3>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            {plan.restaurant.cuisines.slice(0, 3).join(", ")} ·{" "}
            {plan.restaurant.rating ? `${plan.restaurant.rating}★` : "rating unknown"} ·{" "}
            <span className="capitalize">
              {plan.restaurant.venueType.replace(/_/g, " ")}
            </span>{" "}
            · {plan.restaurant.mealDurationMins} min meal
          </p>
        </div>
        <span className="pill-active shrink-0 whitespace-nowrap">
          {inr(plan.costPerPerson)} per person
        </span>
      </div>

      {/* --- the timeline strip --- */}
      <div className="flex items-start gap-1.5">
        {filmFirst
          ? [filmSegment, walkSegment, dinnerSegment]
          : [dinnerSegment, walkSegment, filmSegment]}
      </div>

      {/* --- details --- */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-4 text-sm sm:grid-cols-4">
        <Fact label="Film" value={plan.film.title} sub={filmMeta(plan.film)} />
        <Fact
          label="Cinema"
          value={plan.cinema.name.split(",")[0]}
          sub={plan.cinema.locality}
        />
        <Fact
          label="Cost per person"
          value={inr(plan.costPerPerson)}
          sub={
            <>
              Dinner {inr(plan.costDinnerPerPerson)} + Film {inr(plan.costFilmPerPerson)}
              <br />
              {inr(plan.costTotal)} for party of {partySize}
            </>
          }
        />
        <Fact
          label="Evening length"
          value={`${Math.floor(total / 60)}h ${total % 60}m`}
          sub={`${fmt(start)} – ${fmt(end)}`}
        />
      </dl>

      {/* --- honesty row --- */}
      <div className="flex flex-wrap gap-1.5">
        <span className="pill border border-border">
          {plan.restaurant.takesReservations ? "Takes reservations" : "Walk-in only"}
        </span>
        <span className="pill border border-border">Bookability unverified</span>
        <span className="pill border border-border">Film title illustrative</span>
      </div>
    </article>
  );
}