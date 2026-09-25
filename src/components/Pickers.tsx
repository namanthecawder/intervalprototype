import { useState } from "react";

import type { FilmOption } from "@/lib/districtApi";

/* ---------------------------------------------------------------- dates */

export type Day = { iso: string; weekday: string; day: number; isToday: boolean };

export function nextDays(n = 7, from = new Date()): Day[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      iso,
      weekday: i === 0 ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" }),
      day: d.getDate(),
      isToday: i === 0,
    };
  });
}

export function DateStrip({
  days,
  value,
  onChange,
}: {
  days: Day[];
  value: string;
  onChange: (iso: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Date" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
      {days.length === 0
        ? Array.from({ length: 7 }, (_, i) => <div key={i} className="h-14 w-12 shrink-0 rounded-xl bg-surface" />)
        : days.map((d) => {
            const active = d.iso === value;
            return (
              <button
                key={d.iso}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange(d.iso)}
                className={`flex h-14 min-w-12 shrink-0 flex-col items-center justify-center rounded-xl px-2.5 transition-colors ${
                  active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <span className="text-[0.68rem] font-medium">{d.weekday}</span>
                <span className="tnum text-[1.05rem] font-medium leading-tight">{d.day}</span>
              </button>
            );
          })}
    </div>
  );
}

/* ---------------------------------------------------------------- films */

function Poster({ film }: { film: FilmOption }) {
  const [broken, setBroken] = useState(false);
  if (film.poster && !broken) {
    return (
      <img
        src={film.poster}
        alt=""
        loading="lazy"
        onError={() => setBroken(true)}
        className="h-full w-full object-cover"
      />
    );
  }
  // typographic fallback: deterministic tint from the title
  let h = 0;
  for (const ch of film.title) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return (
    <div
      className="flex h-full w-full items-end p-2"
      style={{ background: `linear-gradient(160deg, oklch(0.42 0.08 ${h}), oklch(0.22 0.04 ${h}))` }}
    >
      <span className="line-clamp-3 text-left text-[0.72rem] font-semibold leading-tight text-white/90">
        {film.title}
      </span>
    </div>
  );
}

export function FilmRail({
  films,
  value,
  onChange,
  loading,
}: {
  films: FilmOption[];
  value: string | null;
  onChange: (title: string | null) => void;
  loading: boolean;
}) {
  const tile = "relative aspect-[2/3] w-[5.25rem] overflow-hidden rounded-lg transition-all sm:w-[5.75rem]";
  const ring = (on: boolean) =>
    on ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "opacity-85 hover:opacity-100";

  return (
    <div
      role="radiogroup"
      aria-label="Film"
      className="no-scrollbar fade-right -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 py-1.5 sm:-mx-2 sm:scroll-px-2 sm:px-2"
    >
      <button type="button" role="radio" aria-checked={value === null} onClick={() => onChange(null)} className="shrink-0 snap-start text-left">
        <div className={`${tile} ${ring(value === null)} grid place-items-center bg-surface`}>
          <span className="text-sm font-medium">Any film</span>
        </div>
        <p className="mt-1.5 w-[5.25rem] text-[0.72rem] text-muted-foreground sm:w-[5.75rem]">Best timing</p>
      </button>

      {loading && films.length === 0
        ? Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="shrink-0">
              <div className={`${tile} animate-pulse bg-surface`} />
              <div className="mt-1.5 h-3 w-16 animate-pulse rounded bg-surface" />
            </div>
          ))
        : films.map((f) => {
            const on = value === f.title;
            return (
              <button
                key={f.title}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange(on ? null : f.title)}
                className="shrink-0 snap-start text-left"
                title={f.title}
              >
                <div className={`${tile} ${ring(on)}`}>
                  <Poster film={f} />
                </div>
                <p className="mt-1.5 line-clamp-1 w-[5.25rem] text-[0.72rem] font-medium sm:w-[5.75rem]">{f.title}</p>
                <p className="w-[5.25rem] text-[0.68rem] text-muted-foreground sm:w-[5.75rem]">
                  {f.sessions} show{f.sessions === 1 ? "" : "s"}
                </p>
              </button>
            );
          })}
    </div>
  );
}
