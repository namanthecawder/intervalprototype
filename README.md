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

Pick an area, a day and (optionally) a film. A small API (`district-scraper/`)
pulls that day's per-film showtimes from District's public listings, finds
restaurants within walking distance of each cinema (OpenStreetMap, or Google
Places with a key), and merges them with 64 hand-collected restaurants. The
planner then sequences dinner, walk and film. If the API is down, the app falls
back to the hand-collected set below.

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
- The hand-collected fallback showtimes are aggregated per multiplex, not per film.
  Live data from the scraper is per film, with format (IMAX, GOLD…) and runtime.
- `meal_duration_mins` is collected for 24 restaurants and rule-derived for 40.
  The `meal_duration_source` column marks which is which.
- Ratings come from Zomato and are compressed by that platform's own distribution.

## Running it locally

Two processes: the scraper API and the web app.

```bash
# 1. Scraper API (Python 3.10+)
cd district-scraper
pip install -r requirements.txt
uvicorn app.main:app --port 8000

# 2. Web app (in another terminal, from the repo root)
cp .env.example .env          # points the app at http://localhost:8000
bun install                   # or: npm install
bun run dev                   # or: npm run dev
```

Optional: set `GOOGLE_MAPS_API_KEY` before starting the API to get ratings and
prices for restaurants it discovers (OpenStreetMap is used otherwise).

The first load for an area takes 20–40 s while the API scans that city's cinemas
(one request per cinema, rate-limited). After that, pages are cached for 10 minutes
and cinema coordinates are saved to `district-scraper/app/data/cinema_coords.json`.
The status line under the controls shows whether plans use live or saved data.

To deploy, host the API anywhere that runs Python (Render, Railway, Fly.io) and set
`VITE_DISTRICT_API_URL` to its URL in your web host's environment variables.

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
├── district-scraper/        # FastAPI service: live cinemas + showtimes near restaurants
├── merge_and_check.py      # dataset validation + distance computation
├── PRD_Interval.md         # one-page product spec
└── src/                    # the app
    └── lib/districtApi.ts  # client for the scraper API
```
