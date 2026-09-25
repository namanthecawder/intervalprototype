from contextlib import asynccontextmanager
from typing import Optional

import os

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import cinemas as cin
from . import restaurants as rest
from . import parsers
from .fetcher import FetchError, fetcher
from .models import EventDetail, ListResponse, MovieDetail

# Category slugs as they appear in District URLs: /events/{slug}-in-{city}-book-tickets
EVENT_CATEGORIES = {
    "music": "music", "nightlife": "nightlife", "comedy": "comedy-shows",
    "sports": "sports-events", "performances": "performances", "navratri": "navratri",
    "fests": "fests-fairs", "food": "food-drinks", "screenings": "screenings",
    "fitness": "fitness-events", "conferences": "conferences", "openmics": "openmics",
}

# District spells cities differently in events vs movies URLs
EVENT_CITY = {"bengaluru": "bangalore", "gurugram": "gurgaon", "delhi-ncr": "delhi", "new-delhi": "delhi"}
MOVIE_CITY = {"bangalore": "bengaluru", "delhi": "delhi-ncr", "new-delhi": "delhi-ncr",
              "gurgaon": "delhi-ncr", "gurugram": "delhi-ncr"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await fetcher.close()


app = FastAPI(
    title="District Scraper API",
    version="1.0.0",
    description="Unofficial API that scrapes public event and movie listings from district.in.",
    lifespan=lifespan,
)

# The Interval web app calls this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


def _slugify(s: str) -> str:
    return s.strip().lower().replace(" ", "-")


async def _get(path: str, fresh: bool):
    try:
        return await fetcher.get(path, use_cache=not fresh)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except FetchError as e:
        code = 404 if e.status == 404 else 502
        raise HTTPException(code, f"Upstream error: {e}")


@app.get("/", tags=["meta"])
def root():
    return {
        "name": "District Scraper API",
        "docs": "/docs",
        "endpoints": ["/events", "/events/{slug}", "/movies", "/movies/{slug}", "/cinemas",
                      "/cinemas/{slug}", "POST /cinemas/nearby", "POST /restaurants/nearby",
                      "POST /restaurants/district", "/scrape", "/categories"],
    }


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}


@app.get("/categories", tags=["meta"])
def categories():
    return {"event_categories": sorted(EVENT_CATEGORIES)}


@app.get("/events", response_model=ListResponse, tags=["events"])
async def list_events(
    city: Optional[str] = Query(None, description="e.g. mumbai, bangalore, gurgaon"),
    category: Optional[str] = Query(None, description="see /categories"),
    city_filter: Optional[str] = Query(None, description="keep only cards whose venue/city contains this text"),
    max_price: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200),
    fresh: bool = Query(False, description="bypass cache"),
):
    if category:
        cat = EVENT_CATEGORIES.get(category.lower())
        if not cat:
            raise HTTPException(400, f"Unknown category. Use one of {sorted(EVENT_CATEGORIES)}")
        if not city:
            raise HTTPException(400, "`category` needs a `city`")
        c = _slugify(city)
        path = f"/events/{cat}-in-{EVENT_CITY.get(c, c)}-book-tickets"
    else:
        path = "/events/"

    html, cached = await _get(path, fresh)
    items = parsers.parse_event_cards(html)
    if city_filter:
        needle = city_filter.lower()
        items = [e for e in items if needle in f"{e.venue or ''} {e.city or ''}".lower()]
    if max_price is not None:
        items = [e for e in items if e.price_min is not None and e.price_min <= max_price]
    items = items[:limit]
    return ListResponse(source_url=fetcher.normalize(path), count=len(items), cached=cached, items=items)


@app.get("/events/{slug}", response_model=EventDetail, tags=["events"])
async def event_detail(slug: str, fresh: bool = False):
    html, _ = await _get(f"/events/{slug}", fresh)
    return parsers.parse_event_detail(html, slug)


@app.get("/movies", response_model=ListResponse, tags=["movies"])
async def list_movies(
    city: Optional[str] = Query(None, description="e.g. mumbai, bengaluru, delhi-ncr"),
    language: Optional[str] = Query(None, description="filter, e.g. hindi"),
    limit: int = Query(50, ge=1, le=200),
    fresh: bool = False,
):
    if city:
        c = _slugify(city)
        path = f"/movies/{MOVIE_CITY.get(c, c)}-movie-tickets"
    else:
        path = "/movies/"
    html, cached = await _get(path, fresh)
    items = parsers.parse_movie_cards(html)
    if language:
        items = [m for m in items if m.languages and language.lower() in m.languages.lower()]
    items = items[:limit]
    return ListResponse(source_url=fetcher.normalize(path), count=len(items), cached=cached, items=items)


@app.get("/movies/{slug}", response_model=MovieDetail, tags=["movies"])
async def movie_detail(slug: str, fresh: bool = False):
    html, _ = await _get(f"/movies/{slug}", fresh)
    return parsers.parse_movie_detail(html, slug)


@app.get("/cinemas", tags=["cinemas"])
async def list_cinemas(city: str = Query("delhi-ncr", description="e.g. gurgaon, noida, new-delhi, mumbai"),
                       fresh: bool = False):
    path = f"/movies/cinemas-in-{_slugify(city)}"
    html, cached = await _get(path, fresh)
    items = cin.parse_cinema_list(html)
    return {"source_url": fetcher.normalize(path), "cached": cached, "count": len(items), "items": items}


@app.get("/cinemas/{slug}", response_model=cin.Cinema, tags=["cinemas"])
async def cinema_detail(slug: str, fresh: bool = False):
    """Films and showtimes for one cinema, e.g. pvr-select-city-walk-saket-new-delhi-in-new-delhi-CD1022254"""
    m = cin.CINEMA_HREF.match(f"/movies/{slug}")
    if not m:
        raise HTTPException(400, "Cinema slug must end in -CD<digits>")
    html, _ = await _get(f"/movies/{slug}", fresh)
    base = cin.Cinema(cinema_id=m.group(2), name=slug, url=fetcher.normalize(f"/movies/{slug}"))
    return await cin._resolve_coords(cin.parse_cinema_page(html, base), cin.parse_cinema_page(html, base))


@app.post("/cinemas/nearby", response_model=cin.NearbyResponse, tags=["cinemas"])
async def cinemas_nearby(req: cin.NearbyRequest):
    """Cinemas within `radius_km` of ANY of the given points (e.g. restaurants), with today's
    films, showtimes and runtimes. First call for a city is slow (one request per cinema);
    after that pages are cached and coordinates are stored on disk."""
    if not req.points:
        raise HTTPException(400, "Send at least one point")
    try:
        return await cin.cinemas_near(req)
    except FetchError as e:
        raise HTTPException(404 if e.status == 404 else 502, f"Upstream error: {e}")


@app.post("/restaurants/nearby", response_model=rest.NearbyRestaurantsResponse, tags=["restaurants"])
async def restaurants_nearby(req: rest.NearbyRestaurantsRequest):
    """Restaurants, cafes and bars within `radius_m` of each point (e.g. each cinema).
    Uses Google Places if GOOGLE_MAPS_API_KEY is set, else OpenStreetMap."""
    try:
        return await rest.restaurants_near(req)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except FetchError as e:
        raise HTTPException(502, f"Maps provider error: {e}")


@app.post("/restaurants/district", tags=["restaurants"])
async def restaurants_district(req: rest.DistrictLookupRequest):
    """District dining details (price for two, rating, booking, offers) for District or Zomato URLs."""
    items, warnings = await rest.district_lookup(req.urls)
    return {"count": len(items), "items": items, "warnings": warnings}


@app.get("/scrape", tags=["generic"])
async def scrape_any(url: str = Query(..., description="any district.in listing URL"), fresh: bool = False):
    """Pull every event and movie card from any district.in page (artist, venue, genre pages...)."""
    html, cached = await _get(url, fresh)
    events = parsers.parse_event_cards(html)
    movies = parsers.parse_movie_cards(html)
    return {"source_url": fetcher.normalize(url), "cached": cached,
            "events": events, "movies": movies}


@app.delete("/cache", tags=["meta"])
def clear_cache():
    return {"cleared": fetcher.clear()}
