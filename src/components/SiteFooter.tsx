export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/50">
      <div className="mx-auto max-w-6xl space-y-3 px-5 py-12 text-sm text-muted-foreground">
        <p className="text-base font-semibold text-foreground">Interval</p>
        <p className="max-w-3xl leading-relaxed">
          Interval is an independent concept prototype for planning an evening out in Delhi NCR. It
          is not affiliated with, endorsed by, or connected to Eternal, District or BookMyShow. No
          logos, wordmarks or trademarks of those companies are used here.
        </p>
        <p className="max-w-3xl leading-relaxed">
          Showtimes, restaurant details and prices are hand-collected from public sources and
          verified on 22 August 2026. Nothing here is bookable: there are no payments, no live
          inventory and no accounts. Financial figures cited on the Impact page come from public
          filings and are modelled, not disclosed.
        </p>
        <p className="max-w-3xl leading-relaxed">
          Film titles are illustrative. My dataset contains cinema showtimes only, not per-film
          schedules — collecting those was out of scope. Restaurant and cinema data is real and
          hand-collected.
        </p>
      </div>
    </footer>
  );
}
