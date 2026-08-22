# Interval

**Plan the whole evening, not half of it.** — a going-out planner for Delhi NCR
that pairs a film with a nearby restaurant and sequences the timings so the plan
actually works.

**[Live demo](https://YOUR-DOMAIN-HERE)** · [Write-up](#) · [Dataset](./data/restaurants_merged.csv)

> A concept prototype. Not affiliated with, endorsed by, or connected to Eternal,
> District or BookMyShow.

---

## Why this exists

Eternal owns both sides of a going-out evening in India — the restaurant graph
(Zomato) and cinema ticketing (District). Today those two journeys don't connect.
You book a film on one surface and work out dinner yourself, or skip dinner
entirely.

District's constraint is **frequency, not margin**: high order value, roughly two
transactions per user per month. Frequency is the cheapest lever available, and
connecting two bookings the company already owns is the cheapest way to pull it.

This is what that connection looks like when you build it instead of describing it.

## The dataset

Everything here runs on data I collected by hand. There is no API and no scraping.

| | Count | Fields |
|---|---|---|
| Cinemas | 15 | area, coordinates, Saturday showtimes, average ticket price |
| Restaurants | 64 | cuisine, coordinates, price for two, rating, reservations, meal duration |

Collected across Gurugram, Noida and South Delhi in August 2026 from Zomato,
Google Maps and District. Every restaurant added in the second pass carries a
`source_url` and a `checked_on` date.

**Distances are computed, not entered.** `merge_and_check.py` recalculates every
restaurant's distance to every cinema with the haversine formula, then flags rows
that look wrong — coordinates outside NCR, hand-typed coordinates, missing
sources, prices or ratings out of range. Run it yourself:

```bash
python3 merge_and_check.py
```

**Known limits, stated up front:**
- Showtimes are aggregated across all screens and films at each multiplex, not per-film.
- `meal_duration_mins` is collected for 24 restaurants and rule-derived for 40.
  The `meal_duration_source` column marks which is which.
- Ratings come from Zomato and are compressed by that platform's own distribution.

## How the algorithm works

For every showtime after 17:00 in the selected area:

1. Find restaurants within 2 km of that cinema.
2. Keep pairs where a meal of **that restaurant's own duration** ends 20 minutes
   before the showtime, walking at 12 min/km.
3. Score on budget fit (50%), rating (30%), travel time (20%).
4. Return the top three, forcing variety — no two plans share a restaurant.

**Meal duration is a per-restaurant field, not a constant.** A ₹500
counter-service place is a 45-minute meal; a ₹4,500 restaurant is 100 minutes.
Treating every meal as the same length is what makes naive versions of this
produce plans people abandon.

**The order flips.** If a showtime is early enough that dinner can't finish before
it, the plan inverts — film first, dinner after. That behaviour wasn't in my
original spec. It came out of testing the prototype and finding it confidently
proposing dinner at 16:13.

## What it's worth

A sensitivity model against Eternal's Q1 FY27 disclosures (NOV ₹3,218 Cr, revenue
₹318 Cr, so a computable 9.9% take rate):

| Attach rate | Incremental NOV/yr | % of current NOV | % of annual EBITDA loss |
|---|---|---|---|
| 4% | ₹242 Cr | 1.9% | 10% |
| 10% | ₹604 Cr | 4.7% | 24% |
| 20% | ₹1,208 Cr | 9.4% | 48% |

**The honest read: this is a good feature, not a strategy.** At a realistic attach
rate it adds ~5% to NOV and offsets about a quarter of District's annual EBITDA
loss — strong return for what is a routing problem rather than a supply problem,
since both sides already exist. It is not the path to a step change in the
business. Anyone claiming the going-out cross-sell is that path hasn't run the
arithmetic.

Every assumption is labelled with its source in
[`impact_model_v2.csv`](./data/impact_model_v2.csv). The two that carry the most
weight — transaction mix and dining take rate — are mine, not disclosures.

## What would prove this wrong

- Attach rate below 4%
- Cannibalisation above 60% — most attached dinners were already being booked on District
- Users changing the suggested slot more than half the time, meaning the
  sequencing is wrong and the value was only ever discovery

## Built with

Spec and dataset: mine. Implementation: Lovable, with the algorithm specified in
[`PRD_Interval.md`](./PRD_Interval.md) §5 and verified by hand against three
generated plans. Data validation: Python. Deployed on Vercel.

I'm not going to pretend a person hand-wrote every line of the UI. The parts that
took judgment were the dataset, the algorithm spec, the scoring weights, and
deciding what the model was allowed to claim — and those are the parts worth
reading.

## Repo

```
├── data/
│   ├── cinemas.csv
│   ├── restaurants_merged.csv
│   └── impact_model_v2.csv
├── merge_and_check.py      # dataset validation + distance computation
├── PRD_Interval.md         # one-page product spec
└── src/                    # the app
```
