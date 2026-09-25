"""Restaurants near cinemas.

Discovery uses a maps provider:
  * Google Places (New) when GOOGLE_MAPS_API_KEY is set: rating, price level, hours.
  * OpenStreetMap / Overpass otherwise: free, no key, names + cuisines + hours.
Details (price for two, rating, table booking, offers) come from District's
dining pages when we know the page, e.g. from a Zomato URL (same slug).
"""
import asyncio
import math
import os
import re
import time
from typing import Dict, List, Literal, Optional, Tuple
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from pydantic import BaseModel, Field

from .cinemas import Point, _coords_from_html, haversine_km
from .fetcher import FetchError, fetcher
from .parsers import _meta

GOOGLE_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
OVERPASS_URL = os.getenv("OVERPASS_URL", "https://overpass-api.de/api/interpreter")
UA = os.getenv("GEOCODE_UA", "district-scraper/1.0 (student project)")
MAPS_TTL = int(os.getenv("MAPS_TTL", str(24 * 3600)))

# Google price levels -> rough price for two in Delhi NCR (INR)
PRICE_LEVEL_FOR_TWO = {
    "PRICE_LEVEL_INEXPENSIVE": 600,
    "PRICE_LEVEL_MODERATE": 1200,
    "PRICE_LEVEL_EXPENSIVE": 2500,
    "PRICE_LEVEL_VERY_EXPENSIVE": 4000,
}
KIND = {"restaurant": "restaurant", "fast_food": "quick bite", "cafe": "cafe", "bar": "bar",
        "pub": "bar", "food_court": "quick bite"}


# ---------------------------------------------------------------- models
class Restaurant(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    kind: Optional[str] = None           # restaurant | cafe | bar | quick bite
    cuisines: List[str] = []
    price_for_two: Optional[int] = None
    price_source: Optional[str] = None   # district | google_range | google_level
    rating: Optional[float] = None
    rating_count: Optional[int] = None
    address: Optional[str] = None
    opening_hours: Optional[str] = None
    maps_url: Optional[str] = None
    district_url: Optional[str] = None
    bookable_on_district: Optional[bool] = None
    offers: List[str] = []
    source: str                          # osm | google | district
    distance_m: Optional[int] = None     # to the nearest query point (cinema)
    nearest_point: Optional[int] = None  # index into request.points


class NearbyRestaurantsRequest(BaseModel):
    points: List[Point] = Field(..., min_length=1, max_length=40)
    radius_m: int = Field(1200, ge=100, le=3000)
    per_point: int = Field(25, ge=1, le=60)
    provider: Literal["auto", "google", "osm"] = "auto"


class NearbyRestaurantsResponse(BaseModel):
    provider: str
    count: int
    restaurants: List[Restaurant]
    warnings: List[str] = []


class DistrictLookupRequest(BaseModel):
    urls: List[str] = Field(..., min_length=1, max_length=80,
                            description="District dining URLs or Zomato restaurant URLs (same slug)")


# ---------------------------------------------------------------- helpers
_maps_cache: Dict[str, Tuple[float, list]] = {}


def _cache_key(provider: str, p: Point, r: int) -> str:
    return f"{provider}:{p.lat:.4f},{p.lng:.4f}:{r}"


def _title(s: str) -> str:
    return " ".join(w.capitalize() for w in s.replace("_", " ").split())


def _norm_name(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", re.sub(r"\(.*?\)", "", s.lower()))


def to_district_url(url: str) -> Optional[str]:
    """Zomato and District dining share slugs: zomato.com/ncr/x -> district.in/dining/ncr/x."""
    u = urlparse(url.strip())
    parts = [p for p in u.path.split("/") if p]
    if u.hostname and u.hostname.endswith("district.in") and len(parts) >= 3 and parts[0] == "dining":
        return f"https://www.district.in/dining/{parts[1]}/{parts[2]}"
    if u.hostname and u.hostname.endswith("zomato.com") and len(parts) >= 2:
        return f"https://www.district.in/dining/{parts[0]}/{parts[1]}"
    return None


# ---------------------------------------------------------------- providers
async def _overpass(points: List[Point], radius_m: int) -> List[Restaurant]:
    clauses = "".join(
        f'nwr["amenity"~"^(restaurant|fast_food|cafe|bar|pub|food_court)$"]["name"](around:{radius_m},{p.lat},{p.lng});'
        for p in points
    )
    query = f"[out:json][timeout:25];({clauses});out center tags 600;"
    async with httpx.AsyncClient(timeout=40, headers={"User-Agent": UA}) as c:
        r = await c.post(OVERPASS_URL, data={"data": query})
        r.raise_for_status()
        elements = r.json().get("elements", [])
    return parse_overpass(elements)


def parse_overpass(elements: List[dict]) -> List[Restaurant]:
    out = []
    for e in elements:
        t = e.get("tags", {})
        lat = e.get("lat") or (e.get("center") or {}).get("lat")
        lng = e.get("lon") or (e.get("center") or {}).get("lon")
        if lat is None or lng is None or not t.get("name"):
            continue
        addr = ", ".join(x for x in (t.get("addr:housename"), t.get("addr:street"),
                                     t.get("addr:suburb"), t.get("addr:city")) if x) or None
        cuisines = [_title(c) for c in re.split(r"[;,]", t.get("cuisine", "")) if c.strip()]
        out.append(Restaurant(
            id=f"osm:{e['type']}/{e['id']}", name=t["name"], lat=lat, lng=lng,
            kind=KIND.get(t.get("amenity", ""), "restaurant"), cuisines=cuisines, address=addr,
            opening_hours=t.get("opening_hours"),
            maps_url=f"https://www.openstreetmap.org/{e['type']}/{e['id']}", source="osm",
        ))
    return out


async def _google(points: List[Point], radius_m: int, per_point: int) -> List[Restaurant]:
    fields = ",".join(f"places.{f}" for f in (
        "id", "displayName", "location", "rating", "userRatingCount", "priceLevel", "priceRange",
        "primaryType", "types", "formattedAddress", "googleMapsUri", "regularOpeningHours.weekdayDescriptions",
    ))
    headers = {"X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": fields, "Content-Type": "application/json"}

    async def one(p: Point) -> List[dict]:
        body = {
            "includedTypes": ["restaurant", "cafe", "bar"],
            "maxResultCount": min(20, per_point),
            "rankPreference": "DISTANCE",
            "locationRestriction": {"circle": {"center": {"latitude": p.lat, "longitude": p.lng},
                                               "radius": float(radius_m)}},
        }
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.post("https://places.googleapis.com/v1/places:searchNearby", json=body, headers=headers)
            r.raise_for_status()
            return r.json().get("places", [])

    out = []
    for places in await asyncio.gather(*(one(p) for p in points)):
        for pl in places:
            loc = pl.get("location") or {}
            price, src = None, None
            rng = pl.get("priceRange") or {}
            try:
                lo = int(rng["startPrice"]["units"])
                hi = int(rng.get("endPrice", rng["startPrice"])["units"])
                price, src = (lo + hi), "google_range"  # per-person range midpoint x2 people
            except (KeyError, TypeError, ValueError):
                if pl.get("priceLevel") in PRICE_LEVEL_FOR_TWO:
                    price, src = PRICE_LEVEL_FOR_TWO[pl["priceLevel"]], "google_level"
            ptype = pl.get("primaryType", "restaurant")
            cuisines = [_title(t.replace("_restaurant", "")) for t in pl.get("types", [])
                        if t.endswith("_restaurant") and t != "restaurant"]
            hours = (pl.get("regularOpeningHours") or {}).get("weekdayDescriptions")
            out.append(Restaurant(
                id=f"google:{pl['id']}", name=(pl.get("displayName") or {}).get("text", "?"),
                lat=loc.get("latitude"), lng=loc.get("longitude"),
                kind="bar" if "bar" in ptype else "cafe" if "cafe" in ptype else
                     "quick bite" if "fast_food" in ptype else "restaurant",
                cuisines=cuisines, price_for_two=price, price_source=src,
                rating=pl.get("rating"), rating_count=pl.get("userRatingCount"),
                address=pl.get("formattedAddress"), opening_hours="; ".join(hours) if hours else None,
                maps_url=pl.get("googleMapsUri"), source="google",
            ))
    return out


# ---------------------------------------------------------------- orchestration
async def restaurants_near(req: NearbyRestaurantsRequest) -> NearbyRestaurantsResponse:
    provider = req.provider
    if provider == "auto":
        provider = "google" if GOOGLE_KEY else "osm"
    if provider == "google" and not GOOGLE_KEY:
        raise ValueError("provider=google needs GOOGLE_MAPS_API_KEY")

    warnings: List[str] = []
    # Serve cached points, query only the rest (Overpass asks for gentle use).
    found: List[Restaurant] = []
    todo: List[Point] = []
    for p in req.points:
        hit = _maps_cache.get(_cache_key(provider, p, req.radius_m))
        if hit and time.time() - hit[0] < MAPS_TTL:
            found.extend(hit[1])
        else:
            todo.append(p)
    if todo:
        try:
            fresh = await (_google(todo, req.radius_m, req.per_point) if provider == "google"
                           else _overpass(todo, req.radius_m))
        except (httpx.HTTPError, ValueError) as e:
            raise FetchError(OVERPASS_URL if provider == "osm" else "places.googleapis.com", None, str(e))
        for p in todo:  # cache per point so neighbouring searches reuse it
            mine = [r for r in fresh if haversine_km((r.lat, r.lng), (p.lat, p.lng)) * 1000 <= req.radius_m + 5]
            _maps_cache[_cache_key(provider, p, req.radius_m)] = (time.time(), mine)
        found.extend(fresh)

    # distance to nearest point, dedupe (same place from overlapping circles / chains next door)
    pts = [(p.lat, p.lng) for p in req.points]
    uniq: Dict[str, Restaurant] = {}
    for r in found:
        ds = [haversine_km((r.lat, r.lng), p) for p in pts]
        i = min(range(len(ds)), key=ds.__getitem__)
        if ds[i] * 1000 > req.radius_m + 5:
            continue
        r = r.model_copy(update={"distance_m": round(ds[i] * 1000), "nearest_point": i})
        key = r.id
        dup = next((k for k, u in uniq.items() if _norm_name(u.name) == _norm_name(r.name)
                    and haversine_km((u.lat, u.lng), (r.lat, r.lng)) < 0.08), None)
        if dup:
            continue
        uniq[key] = r

    # keep the closest N per point
    by_point: Dict[int, List[Restaurant]] = {}
    for r in uniq.values():
        by_point.setdefault(r.nearest_point or 0, []).append(r)
    result = [r for lst in by_point.values()
              for r in sorted(lst, key=lambda x: x.distance_m or 0)[: req.per_point]]
    result.sort(key=lambda r: (r.nearest_point or 0, r.distance_m or 0))
    if provider == "osm":
        warnings.append("OpenStreetMap has no ratings or prices; add GOOGLE_MAPS_API_KEY for both")
    return NearbyRestaurantsResponse(provider=provider, count=len(result), restaurants=result, warnings=warnings)


# ---------------------------------------------------------------- District dining pages
CUISINE_WORDS = {
    "north indian", "south indian", "chinese", "italian", "continental", "asian", "japanese", "thai",
    "mexican", "american", "mughlai", "biryani", "pizza", "burger", "cafe", "desserts", "bakery",
    "fast food", "street food", "seafood", "mediterranean", "european", "korean", "lebanese",
    "indo-chinese", "pan-asian", "sushi", "salad", "healthy food", "beverages", "kebab", "rolls",
    "momos", "sichuan", "cantonese", "burmese", "oriental", "modern indian", "finger food", "bar food",
    "coffee", "tea", "ice cream", "sandwich", "wraps", "north eastern", "bengali", "punjabi", "goan",
    "kerala", "chettinad", "hyderabadi", "awadhi", "rajasthani", "gujarati", "french", "spanish",
    "vietnamese", "tibetan", "nepalese", "middle eastern", "turkish", "greek", "steak", "grill", "bbq",
}
HOURS_RE = re.compile(r"(\d{1,2}(?::\d{2})?\s?[AP]M)\s*(?:to|-|–)\s*(\d{1,2}(?::\d{2})?\s?[AP]M)", re.I)
PRICE2_RE = re.compile(r"₹\s?([\d,]+)\s*(?:for two|for 2)", re.I)
RATING_RE = re.compile(r"\b([1-5]\.\d)\b[^\d₹]{0,20}?\(?([\d,.]+\s?[kK]?)\s*(?:ratings|reviews)", re.I)
OFFER_RE = re.compile(r"(flat\s+\d+%\s*off[^\n]{0,60}|\d+%\s*off[^\n]{0,60}|buy\s*\d+\s*get\s*\d+[^\n]{0,40})", re.I)


class DistrictRestaurant(BaseModel):
    url: str
    name: str
    locality: Optional[str] = None
    cuisines: List[str] = []
    price_for_two: Optional[int] = None
    rating: Optional[float] = None
    rating_count: Optional[int] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    hours: Optional[str] = None
    bookable: bool = False
    offers: List[str] = []


def _count(s: str) -> Optional[int]:
    s = s.strip().lower().replace(",", "")
    try:
        return int(float(s[:-1]) * 1000) if s.endswith("k") else int(float(s))
    except ValueError:
        return None


def parse_dining_page(html: str, url: str) -> DistrictRestaurant:
    coords = _coords_from_html(html)
    soup = BeautifulSoup(html, "lxml")
    title = _meta(soup, "og:title") or (soup.title.string if soup.title else "") or ""
    parts = [p.strip() for p in re.split(r"\s+\|\s+", title) if p.strip()]
    name = re.sub(r"^Book a Table at\s+", "", parts[0]) if parts else url.rsplit("/", 1)[-1]
    locality = parts[1] if len(parts) > 2 else None

    for t in soup(["script", "style", "noscript", "svg"]):
        t.decompose()
    lines = [l.strip() for l in soup.get_text("\n").split("\n") if l.strip()]
    text = "\n".join(lines)

    cuisines: List[str] = []
    for l in lines[:120]:
        toks = [t.strip() for t in l.split(",")]
        if 1 <= len(toks) <= 8 and all(len(t) < 25 for t in toks) and \
                sum(t.lower() in CUISINE_WORDS for t in toks) >= max(1, len(toks) // 2 + (len(toks) > 1)):
            cuisines = toks
            break

    price = PRICE2_RE.search(text)
    rating = RATING_RE.search(text)
    hours = HOURS_RE.search(text)
    address = next((l for l in lines if len(l) > 25 and re.search(r"(Sector|Floor|Road|Marg|Mall|Block|Phase|Nagar)", l)
                    and "₹" not in l and not OFFER_RE.search(l)), None)
    offers = list(dict.fromkeys(m.group(1).strip() for m in OFFER_RE.finditer(text)))[:5]
    bookable = bool(re.search(r"book\s+(a\s+)?table", text, re.I)) or url.endswith("/book")

    return DistrictRestaurant(
        url=url, name=name.strip(), locality=locality, cuisines=cuisines,
        price_for_two=int(price.group(1).replace(",", "")) if price else None,
        rating=float(rating.group(1)) if rating else None,
        rating_count=_count(rating.group(2)) if rating else None,
        address=address, lat=coords[0] if coords else None, lng=coords[1] if coords else None,
        hours=f"{hours.group(1)} – {hours.group(2)}" if hours else None,
        bookable=bookable, offers=offers,
    )


async def district_lookup(urls: List[str]) -> Tuple[List[DistrictRestaurant], List[str]]:
    warnings: List[str] = []

    async def one(u: str) -> Optional[DistrictRestaurant]:
        d = to_district_url(u)
        if not d:
            warnings.append(f"Not a District or Zomato restaurant URL: {u}")
            return None
        try:
            html, _ = await fetcher.get(d)
        except FetchError as e:
            warnings.append(f"{d}: {e}")
            return None
        return parse_dining_page(html, d)

    res = await asyncio.gather(*(one(u) for u in urls))
    return [r for r in res if r], warnings
