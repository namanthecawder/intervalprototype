# District Scraper API

A FastAPI service that scrapes public **events** and **movies** listings from [district.in](https://www.district.in) (Zomato's going-out app) and serves them as clean JSON.

## Quick start

```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open **http://127.0.0.1:8000/docs** for interactive Swagger docs.

Docker:
```bash
docker build -t district-scraper . && docker run -p 8000:8000 district-scraper
```

## Endpoints

| Method | Path | What it does |
|---|---|---|
| GET | `/events` | Event cards. Params: `city`, `category`, `city_filter`, `max_price`, `limit`, `fresh` |
| GET | `/events/{slug}` | Full event: date, venue, price, description, artists, rules, organiser, gates-open time |
| GET | `/movies` | Now-showing movies. Params: `city`, `language`, `limit`, `fresh` |
| GET | `/movies/{slug}` | Movie detail: certificate, languages, genres, duration, synopsis, poster |
| GET | `/cinemas?city=` | Cinemas District lists for a city (`gurgaon`, `noida`, `new-delhi`, `delhi-ncr`, `mumbai`…) |
| GET | `/cinemas/{slug}` | One cinema: address, coordinates, and today's films with per-film showtimes + format |
| POST | `/cinemas/nearby` | **Used by Interval.** Cinemas within `radius_km` of any of the given points, with films, showtimes and runtimes |
| POST | `/restaurants/nearby` | Restaurants, cafés and bars within `radius_m` of each point (e.g. each cinema). Google Places if `GOOGLE_MAPS_API_KEY` is set, otherwise OpenStreetMap |
| POST | `/restaurants/district` | District dining details (price for two, rating, booking, offers) for District **or Zomato** URLs — they share slugs |
| GET | `/scrape?url=` | Pull every event + movie card from **any** district.in page (artist, venue, genre pages) |
| GET | `/categories` | Valid event categories |
| DELETE | `/cache` | Clear the in-memory cache |

### `POST /cinemas/nearby`

```bash
curl -X POST localhost:8000/cinemas/nearby -H "content-type: application/json" -d '{
  "city": "new-delhi",
  "points": [{"lat": 28.5283, "lng": 77.2190}],
  "radius_km": 2
}'
```

How it finds coordinates for each cinema, cheapest first:
1. `app/data/cinema_coords.json`: saved from earlier runs
2. `app/data/known_cinemas.json`: the 15 hand-verified Interval cinemas, matched by name
3. Coordinates embedded in the District cinema page
4. OpenStreetMap geocoding of the address (max 1 request/second; turn off with `GEOCODE=0`)

Cinemas already known to be too far away are skipped without fetching their page.
Runtimes come from the cinema page, or else each film's District page.

`/cinemas/nearby` also takes `"date": "2026-09-26"` (passed to District as `?fromdate=`) and returns
a `films` list for the film picker (title, poster, sessions, cinemas), most-screened first.

### `POST /restaurants/nearby`

```bash
curl -X POST localhost:8000/restaurants/nearby -H "content-type: application/json" -d '{
  "points": [{"lat": 28.5056, "lng": 77.0965}], "radius_m": 1200, "per_point": 25
}'
```

| Provider | Needs | Gives |
|---|---|---|
| OpenStreetMap (default) | nothing | name, location, cuisine, hours |
| Google Places | `GOOGLE_MAPS_API_KEY` ([get one](https://developers.google.com/maps/documentation/places/web-service/get-api-key), enable *Places API (New)*) | + rating, rating count, price level |

Results are cached per point for 24 h (`MAPS_TTL`).

### Examples

```bash
curl "localhost:8000/events?city=mumbai&category=comedy&max_price=500"
curl "localhost:8000/events/daniel-fernandes-do-you-know-who-i-am-sep27-2026-buy-tickets"
curl "localhost:8000/movies?city=bengaluru&language=hindi"
curl "localhost:8000/movies/the-paradise-movie-tickets-MV185027"
curl "localhost:8000/scrape?url=https://www.district.in/events/a-r-rahman/artist"
```

Sample `/events` item:
```json
{
  "title": "F9 Go Karting | Sector 59",
  "url": "https://www.district.in/events/f9-gokarting-sector-59-buy-tickets",
  "slug": "f9-gokarting-sector-59-buy-tickets",
  "date_text": "Daily, Multiple slots",
  "venue": "F9 Go Karting Sector 59, Gurugram",
  "city": "Gurugram",
  "price_text": "₹675 onwards",
  "price_min": 675,
  "offer": "Buy 2, Get 1 Free on select tickets"
}
```

Event categories: `comedy, conferences, fests, fitness, food, music, navratri, nightlife, openmics, performances, screenings, sports`.

## How it works

```
app/
  fetcher.py   HTTP client: browser headers, TTL cache, concurrency cap, polite delay, retries, optional Playwright fallback
  parsers.py   HTML -> Pydantic models
  models.py    Response schemas
  main.py      FastAPI routes
tests/         Parser + API tests on saved HTML fixtures (no network)
```

**Why the parsers don't use CSS classes:** District is a Next.js app with hashed class names that change on every deploy. The parsers rely on things that stay put: URL patterns (`/events/*-buy-tickets`, `/movies/*-MV123456`), OG/meta tags, JSON-LD, image `alt` text, and the order of text inside each card. That makes them much less likely to break.

## Config (env vars)

| Var | Default | Meaning |
|---|---|---|
| `CACHE_TTL` | 600 | Seconds to cache each page |
| `MAX_CONCURRENCY` | 3 | Parallel upstream requests |
| `MIN_DELAY` | 0.5 | Minimum seconds between requests |
| `GOOGLE_MAPS_API_KEY` | – | Use Google Places for restaurant discovery (ratings + prices) |
| `OVERPASS_URL` | overpass-api.de | OpenStreetMap endpoint |
| `CORS_ORIGINS` | `*` | Comma-separated origins allowed to call the API (set to your web app's URL in production) |
| `GEOCODE` | 1 | Fall back to OpenStreetMap geocoding when a cinema page has no coordinates |
| `USE_PLAYWRIGHT` | 0 | Set `1` to fall back to headless Chromium on 403/429 (`pip install playwright && playwright install chromium`) |

## Tests

```bash
pytest -q
```

## Known limitations

- **City is partly decided by your IP.** District geolocates visitors, so `/events` with no category shows events near the server. City+category URLs help, but some sections still lean local. Use `city_filter` to keep only matching venues.
- **Listing pages show what's rendered server-side** (usually the first ~10–40 items). Infinite-scroll results load via private APIs that this doesn't call.
- **Parsers were built from the live page structure on 24 Sep 2026.** If District redesigns, re-save a page into `tests/fixtures/` and adjust `parsers.py`.
- **District's dining listing pages render in the browser**, so restaurants are discovered through a maps provider and matched to District pages by Zomato URL, not crawled from District.

## Use responsibly

This is an unofficial, educational project. Check District's Terms of Service and `robots.txt` before running it at scale, keep the cache and rate limits on, and don't use it to resell tickets or data commercially.
