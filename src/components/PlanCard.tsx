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
      <div className={`rounded-full ${fill} px-3 py-2 ${text}`}>
        <p className="truncate text-[0.7rem] font-bold uppercase tracking-[0.12em] opacity-80">
          {label}
        </p>
        <p className="truncate text-sm font-semibold">{time}</p>
      </div>
      <p className="mt-2 truncate px-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

export function PlanCard({ plan, rank, partySize }: { plan: Plan; rank: number; partySize: number }) {
  const total = plan.showEnd - plan.dinnerStart;
  return (
    <article className="card-soft flex h-full min-w-[19rem] flex-col gap-5 p-5 sm:min-w-[22rem]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Plan {rank}
          </p>
          <h3 className="mt-1 truncate text-xl">{plan.restaurant.name}</h3>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {plan.restaurant.cuisines.slice(0, 2).join(", ")} ·{" "}
            {plan.restaurant.rating ? `${plan.restaurant.rating}★` : "rating unknown"} ·{" "}
            {plan.restaurant.mealDurationMins} min meal
          </p>
        </div>
        <span className="pill-active shrink-0">
          ₹{plan.costPerPerson.toLocaleString("en-IN")} per person
        </span>
      </div>

      {/* The timeline strip: the most distinctive element on the page. */}
      <div className="flex items-start gap-1.5">
        <Segment
          tone="dinner"
          label="Dinner"
          time={`${fmt(plan.dinnerStart)}–${fmt(plan.dinnerEnd)}`}
          detail={plan.restaurant.locality}
          minWidth="8.75rem"
          flex={plan.restaurant.mealDurationMins}
        />
        <Segment
          tone="walk"
          label="Walk"
          time={`${plan.walkMins}m`}
          detail={`${plan.distanceKm.toFixed(1)} km`}
          minWidth="3.5rem"
          flex={Math.max(30, plan.walkMins * 1.6)}
        />
        <Segment
          tone="film"
          label="Film"
          time={`${fmt(plan.showStart)}–${fmt(plan.showEnd)}`}
          detail={plan.film.title}
          minWidth="8.75rem"
          flex={plan.film.runtimeMins}
        />
      </div>

      <dl className="grid grid-cols-2 gap-y-3 border-t border-border pt-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Film</dt>
          <dd className="truncate font-semibold">{plan.film.title}</dd>
          <dd className="text-xs text-muted-foreground">{filmMeta(plan.film)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Cinema</dt>
          <dd className="truncate font-semibold">{plan.cinema.name.split(",")[0]}</dd>
          <dd className="truncate text-xs text-muted-foreground">{plan.cinema.locality}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Per person</dt>
          <dd className="font-semibold">
            Dinner ₹{plan.costDinnerPerPerson.toLocaleString("en-IN")} + Film ₹{plan.costFilmPerPerson.toLocaleString("en-IN")} = ₹{plan.costPerPerson.toLocaleString("en-IN")}
          </dd>
          <dd className="text-xs text-muted-foreground">party of {partySize}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Evening length</dt>
          <dd className="font-semibold">
            {Math.floor(total / 60)}h {total % 60}m
          </dd>
          <dd className="text-xs text-muted-foreground">ends {fmt(plan.showEnd)}</dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap gap-1.5">
        <span className="pill border border-border">
          {plan.restaurant.takesReservations ? "Takes reservations" : "Walk-in only"}
        </span>
        <span className="pill border border-border">
          Bookability unverified
        </span>
      </div>
    </article>
  );
}
