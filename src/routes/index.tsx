import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { cinemas as sampleCinemas, restaurants as handRestaurants } from "@/data/venues";
import { AREAS, fetchRestaurantsNear, fetchShowtimes, type Area } from "@/lib/districtApi";
import { fmt, rankPlans, type PlanInput } from "@/lib/planner";
import { DateStrip, FilmRail, nextDays, type Day } from "@/components/Pickers";
import { PlanItem } from "@/components/PlanList";
import { MapView } from "@/components/MapView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Interval — dinner and a film, timed" },
      {
        name: "description",
        content:
          "Pick a day and a film. Interval finds dinner a short walk from the cinema and times the evening.",
      },
      { property: "og:title", content: "Interval — dinner and a film, timed" },
    ],
  }),
  component: PlanPage,
});

const BUDGETS = [700, 1000, 1500, 2500];
const PEOPLE = [1, 2, 3, 4, 5, 6];
const HOME_BY = [22 * 60, 23 * 60, 23 * 60 + 30, 24 * 60 + 30];

function useIsDesktop() {
  const [v, setV] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setV(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return v;
}

function PlanPage() {
  const [area, setArea] = useState<Area>(AREAS[0]!);
  const [days, setDays] = useState<Day[]>([]);
  const [date, setDate] = useState<string>("");
  const [film, setFilm] = useState<string | null>(null);
  const [people, setPeople] = useState(2);
  const [budget, setBudget] = useState(1500);
  const [homeBy, setHomeBy] = useState(23 * 60 + 30);
  const [selected, setSelected] = useState(0);
  const [nowMins, setNowMins] = useState(0);
  const isDesktop = useIsDesktop();

  // Dates depend on the viewer's clock, so build them on the client.
  useEffect(() => {
    const d = nextDays(7);
    const n = new Date();
    const now = n.getHours() * 60 + n.getMinutes();
    setDays(d);
    // After ~19:30 there's rarely time for dinner and a film tonight: open on tomorrow.
    setDate(d[now < 19 * 60 + 30 ? 0 : 1]!.iso);
    setNowMins(now);
  }, []);

  const showtimes = useQuery({
    queryKey: ["showtimes", area.city, date],
    queryFn: ({ signal }) => fetchShowtimes(area, date, signal),
    enabled: !!date,
    staleTime: 10 * 60 * 1000,
    retry: 0,
  });
  const liveCinemas = showtimes.data?.cinemas.length ? showtimes.data.cinemas : null;

  const nearby = useQuery({
    queryKey: ["restaurants-near", area.name, liveCinemas?.map((c) => c.name).join("|")],
    queryFn: ({ signal }) => fetchRestaurantsNear(area.name, liveCinemas!, signal),
    enabled: !!liveCinemas,
    staleTime: 60 * 60 * 1000,
    retry: 0,
  });

  const cinemaList = liveCinemas ?? sampleCinemas;
  const restaurantList = nearby.data ?? handRestaurants;
  const films = showtimes.data?.films ?? [];
  const activeFilm = film && films.some((f) => f.title === film) ? film : null;
  const isToday = days[0]?.iso === date;

  const input: PlanInput = {
    area: area.name,
    budgetPerPerson: budget,
    partySize: people,
    latestEndMins: homeBy,
    film: activeFilm,
    ...(isToday ? { notBeforeMins: nowMins + 20 } : {}),
  };
  const plans = useMemo(
    () => (date ? rankPlans(input, cinemaList, restaurantList) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      area.name,
      budget,
      people,
      homeBy,
      activeFilm,
      isToday,
      nowMins,
      cinemaList,
      restaurantList,
      date,
    ],
  );
  const planKey = plans.map((p) => p.id).join("~");
  useEffect(() => setSelected(0), [planKey]);
  const current = plans[selected] ?? null;
  const areaCinemas = cinemaList.filter((c) => c.area === area.name);

  const loading = !date || showtimes.isLoading;
  const status = loading
    ? "Finding showtimes…"
    : liveCinemas
      ? nearby.isFetching
        ? "Finding dinner nearby…"
        : `Live · ${liveCinemas.length} cinemas`
      : "Saved showtimes";

  const map = (
    <MapView plan={current} cinemas={areaCinemas} center={area.center} className="h-full w-full" />
  );
  const lastHome = HOME_BY[HOME_BY.length - 1]!;
  const topBudget = BUDGETS[BUDGETS.length - 1]!;

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:grid lg:grid-cols-[minmax(0,600px)_1fr] lg:gap-12">
      <section className="pb-16 pt-8 sm:pt-10">
        <h1 className="text-[2.4rem] leading-[1.02] sm:text-[2.9rem]">
          Dinner and a film,
          <br />
          <span className="text-muted-foreground">timed.</span>
        </h1>

        {/* area */}
        <div role="tablist" aria-label="Area" className="mt-7 flex gap-5 border-b border-border">
          {AREAS.map((a) => {
            const on = a.name === area.name;
            return (
              <button
                key={a.name}
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setArea(a);
                  setFilm(null);
                }}
                className={`-mb-px border-b-2 pb-2.5 text-[0.95rem] transition-colors ${
                  on
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {a.name}
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <DateStrip days={days} value={date} onChange={setDate} />
        </div>

        <div className="mt-5">
          {liveCinemas || loading ? (
            <FilmRail films={films} value={activeFilm} onChange={setFilm} loading={loading} />
          ) : (
            <p className="rounded-xl bg-surface px-4 py-3 text-sm text-muted-foreground">
              Film choice needs live showtimes.{" "}
              <button
                className="font-medium text-foreground underline underline-offset-4"
                onClick={() => void showtimes.refetch()}
              >
                Retry
              </button>
            </p>
          )}
        </div>

        {/* preferences */}
        <div className="mt-5 flex flex-wrap gap-2">
          <Pick
            value={people}
            onChange={setPeople}
            label="People"
            options={PEOPLE.map((p) => [p, `${p} ${p === 1 ? "person" : "people"}`])}
          />
          <Pick
            value={budget}
            onChange={setBudget}
            label="Food budget per person"
            options={BUDGETS.map((b) => [b, `₹${b.toLocaleString("en-IN")} each on food`])}
          />
          <Pick
            value={homeBy}
            onChange={setHomeBy}
            label="Home by"
            options={HOME_BY.map((t) => [t, `Home by ${fmt(t)}`])}
          />
        </div>

        {/* results */}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
          <h2 className="text-base font-medium tracking-normal">
            {loading
              ? "Plans"
              : plans.length
                ? `${plans.length} plan${plans.length === 1 ? "" : "s"}`
                : "No plans"}
          </h2>
          <span
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
            aria-live="polite"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                loading || nearby.isFetching
                  ? "animate-pulse bg-dinner"
                  : liveCinemas
                    ? "bg-emerald-500"
                    : "bg-foreground/30"
              }`}
            />
            {status}
          </span>
        </div>

        {loading ? (
          <ul className="mt-3 space-y-2">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-[76px] animate-pulse rounded-2xl bg-surface" />
            ))}
          </ul>
        ) : plans.length ? (
          <ol className="mt-2 space-y-1">
            {plans.map((p, i) => (
              <PlanItem
                key={p.id}
                plan={p}
                rank={i + 1}
                partySize={people}
                selected={i === selected}
                onSelect={() => setSelected(i)}
                mapSlot={
                  isDesktop === false && i === selected ? (
                    <div className="h-52 overflow-hidden rounded-xl border border-border">
                      {map}
                    </div>
                  ) : undefined
                }
              />
            ))}
          </ol>
        ) : (
          <Empty>
            {isToday && nowMins > 19 * 60 ? (
              <>
                Too late for a full evening tonight.{" "}
                <button
                  className="font-medium text-foreground underline underline-offset-4"
                  onClick={() => setDate(days[1]!.iso)}
                >
                  See tomorrow
                </button>
              </>
            ) : (
              <>
                {activeFilm ? (
                  <>
                    No showing of <span className="text-foreground">{activeFilm}</span> leaves time
                    for dinner and gets you home by {fmt(homeBy)}.
                  </>
                ) : (
                  <>Nothing fits by {fmt(homeBy)} on this budget.</>
                )}{" "}
                <button
                  className="font-medium text-foreground underline underline-offset-4"
                  onClick={() => (homeBy < lastHome ? setHomeBy(lastHome) : setBudget(topBudget))}
                >
                  {homeBy < lastHome ? `Try home by ${fmt(lastHome)}` : "Raise the budget"}
                </button>
              </>
            )}
          </Empty>
        )}
      </section>

      {/* map, desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-14 h-[calc(100vh-3.5rem)] py-6">
          <div className="h-full overflow-hidden rounded-3xl border border-border">
            {isDesktop ? map : null}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 rounded-2xl bg-surface px-5 py-6 text-sm leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

function Pick<T extends number>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
  label: string;
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as T)}
        className="tnum cursor-pointer appearance-none rounded-full border border-border bg-card py-1.5 pl-3.5 pr-7 text-[0.85rem] font-medium text-foreground outline-none transition-colors hover:bg-foreground/[0.07] focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-muted-foreground" />
    </label>
  );
}
