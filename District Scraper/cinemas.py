"""Cinemas: list per city, per-cinema showtimes, coordinates, and "near these points".

Built for the Interval planner: give it restaurant coordinates, get back the
cinemas within walking distance and what's actually playing there, per film.
"""
import asyncio
import json
import math
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import httpx
from bs4 import BeautifulSoup, NavigableString
from pydantic import BaseModel, Field

from .fetcher import FetchError, fetcher
from .parsers import CERT_RE, DURATION_RE, MOVIE_HREF, _abs, _meta, _path, img_src, parse_movie_cards, parse_movie_detail

CINEMA_HREF = re.compile(r"^/movies/([a-z0-9-]+-CD(\d+))/?$")
TIME_RE = re.compile(r"^(\d{1,2}):(\d{2})\s?(AM|PM)$", re.I)
FORMAT_RE = re.compile(r"^[A-Z0-9][A-Z0-9 +\-/]{1,20}$")  # IMAX, GOLD, 4DX-2D, RECLINERS...
PIN_RE = re.compile(r"\b\d{6}\b")
CERT_ONLY = re.compile(r"^(U/A\s?\d+\+|UA\s?\d+\+|UA|U|A|S)$")

DATA_DIR = Path(os.getenv("DATA_DIR", Path(__file__).parent / "data"))
COORD_CACHE = DATA_DIR / "cinema_coords.json"
KNOWN = DATA_DIR / "known_cinemas.json"
GEOCODE = os.getenv("GEOCODE", "1") == "1"
GEOCODE_UA = os.getenv("GEOCODE_UA", "district-scraper/1.0 (student project)")


# ---------------------------------------------------------------- models
class Session(BaseModel):
    time: str
    format: Optional[str] = None


class CinemaFilm(BaseModel):
    title: str
    movie_id: Optional[str] = None
    slug: Optional[str] = None
    poster: Optional[str] = None
    certificate: Optional[str] = None
    languages: Optional[str] = None
    runtime_mins: Optional[int] = None
    runtime_source: Optional[str] = None  # "cinema_page" | "movie_page" | None
    sessions: List[Session] = []


class Cinema(BaseModel):
    cinema_id: str
    name: str
    url: str
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    coord_source: Optional[str] = None  # "page" | "known" | "geocoded" | "cache"
    distance_km: Optional[float] = None
    films: List[CinemaFilm] = []


class Point(BaseModel):
    lat: float
    lng: float


class NearbyRequest(BaseModel):
    city: str = "delhi-ncr"
    points: List[Point]
    radius_km: float = 2.0
    date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="YYYY-MM-DD; default = today")
    max_cinemas: int = 60
    with_runtimes: bool = True


class FilmSummary(BaseModel):
    """One film across all returned cinemas — what the film picker shows."""
    title: str
    movie_id: Optional[str] = None
    slug: Optional[str] = None
    poster: Optional[str] = None
    certificate: Optional[str] = None
    languages: Optional[str] = None
    runtime_mins: Optional[int] = None
    cinemas: int = 0
    sessions: int = 0


class NearbyResponse(BaseModel):
    city: str
    date: Optional[str] = None
    source_url: str
    scanned: int
    count: int
    cinemas: List[Cinema]
    films: List[FilmSummary] = []
    warnings: List[str] = []


# ---------------------------------------------------------------- geo helpers
def haversine_km(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    R = 6371.0
    dlat, dlng = math.radians(b[0] - a[0]), math.radians(b[1] - a[1])
    h = math.sin(dlat / 2) ** 2 + math.cos(math.radians(a[0])) * math.cos(math.radians(b[0])) * math.sin(dlng / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def _in_india(lat: float, lng: float) -> bool:
    return 6 <= lat <= 37.5 and 68 <= lng <= 98


def _norm(name: str) -> set:
    stop = {"pvr", "inox", "cinepolis", "the", "mall", "new", "delhi", "in", "at", "with", "laser", "a", "of"}
    toks = set(re.findall(r"[a-z0-9]+", name.lower()))
    return toks - stop or toks


def _load(path: Path, default):
    try:
        return json.loads(path.read_text())
    except (OSError, ValueError):
        return default


_known: List[dict] = _load(KNOWN, [])
_coord_cache: Dict[str, dict] = _load(COORD_CACHE, {})


def _save_cache() -> None:
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        COORD_CACHE.write_text(json.dumps(_coord_cache, indent=1))
    except OSError:
        pass


def known_match(name: str) -> Optional[dict]:
    """Match a District cinema name against the hand-verified seed list."""
    toks = _norm(name)
    best, best_score = None, 0.0
    for k in _known:
        kt = _norm(k["name"])
        brand_ok = any(b in name.lower() and b in k["name"].lower() for b in ("pvr", "inox", "cinepolis", "wave")) \
            or not any(b in name.lower() for b in ("pvr", "inox", "cinepolis"))
        if not brand_ok:
            continue
        score = len(toks & kt) / max(1, len(toks | kt))
        if score > best_score:
            best, best_score = k, score
    return best if best_score >= 0.5 else None


# ---------------------------------------------------------------- parsers
def parse_cinema_list(html: str) -> List[Cinema]:
    soup = BeautifulSoup(html, "lxml")
    seen: Dict[str, Cinema] = {}
    for a in soup.find_all("a", href=True):
        m = CINEMA_HREF.match(_path(a["href"]))
        if not m:
            continue
        slug, cid = m.group(1), m.group(2)
        if cid in seen:
            continue
        strings = [s for s in a.stripped_strings]
        name = next((s for s in strings if len(s) > 3 and not re.search(r"km away|^\d", s)), None)
        if not name:
            name = re.sub(r"-in-[a-z-]+-CD\d+$", "", slug).replace("-", " ").title()
        address = next((s for s in strings if PIN_RE.search(s) and s != name), None)
        seen[cid] = Cinema(cinema_id=cid, name=name, url=_abs(f"/movies/{slug}"), address=address)
    return list(seen.values())


def _coords_from_html(html: str) -> Optional[Tuple[float, float]]:
    q = r'\\?"'  # plain or escaped quote (Next.js flight data escapes JSON inside strings)
    num = r'\\?"?(-?\d{1,3}\.\d{3,})\\?"?'
    pats = [
        q + r"lat(?:itude)?" + q + r"\s*:\s*" + num + r"\s*,\s*" + q + r"(?:lng|lon|long|longitude)" + q + r"\s*:\s*" + num,
        r"(?:maps\?q=|query=|destination=|@|ll=)(-?\d{1,2}\.\d{3,}),\s*(-?\d{2,3}\.\d{3,})",
        q + r"geo" + q + r"\s*:\s*\{[^}]*?latitude" + q + r"\s*:\s*" + num + r"[^}]*?longitude" + q + r"\s*:\s*" + num,
    ]
    for p in pats:
        for m in re.finditer(p, html):
            lat, lng = float(m.group(1)), float(m.group(2))
            if _in_india(lat, lng):
                return lat, lng
    return None


def _runtime_mins(text: Optional[str]) -> Optional[int]:
    if not text:
        return None
    m = re.match(r"^PT(?:(\d+)H)?(?:(\d+)M)?$", text)
    if m and (m.group(1) or m.group(2)):
        return int(m.group(1) or 0) * 60 + int(m.group(2) or 0)
    h = re.search(r"(\d+)\s?h", text)
    mm = re.search(r"(\d+)\s?m", text)
    if h or mm:
        return int(h.group(1) if h else 0) * 60 + int(mm.group(1) if mm else 0)
    return None


def parse_cinema_page(html: str, base: Cinema) -> Cinema:
    """Films + showtimes (the day District shows by default), address, coordinates."""
    soup = BeautifulSoup(html, "lxml")
    coords = _coords_from_html(html)
    for t in soup(["script", "style", "noscript", "svg"]):
        t.decompose()

    title = _meta(soup, "og:title") or (soup.h1.get_text(strip=True) if soup.h1 else base.name)
    name = re.split(r"\s+[—–-]\s+Showtimes|\s+-\s+Showtimes| in [A-Z][a-z]+ - Showtimes", title)[0].strip()

    films: List[CinemaFilm] = []
    current: Optional[CinemaFilm] = None
    last_text: Optional[str] = None
    address: Optional[str] = base.address

    def start_film(title: str, movie_id: Optional[str] = None, slug: Optional[str] = None) -> CinemaFilm:
        for f in films:  # same film can appear twice (e.g. per format block)
            if f.title == title:
                f.movie_id, f.slug = f.movie_id or movie_id, f.slug or slug
                return f
        f = CinemaFilm(title=title, movie_id=movie_id, slug=slug)
        films.append(f)
        return f

    for node in soup.body.descendants if soup.body else []:
        if not isinstance(node, NavigableString):
            continue
        s = str(node).strip()
        if not s:
            continue
        a = node.find_parent("a", href=True)
        mm = MOVIE_HREF.match(_path(a["href"])) if a else None

        if address is None and PIN_RE.search(s) and len(s) > 15:
            address = s
        if mm and not TIME_RE.match(s):
            img = a.find("img", alt=True)
            t = (img["alt"].strip() if img and img["alt"].strip() else None) or next(a.stripped_strings)
            current = start_film(t, mm.group(2), mm.group(1))
            if current.poster is None:
                current.poster = img_src(a.find("img"))
        elif TIME_RE.match(s):
            if current is not None:
                current.sessions.append(Session(time=_fmt_time(s)))
        elif current is not None and current.sessions and FORMAT_RE.match(s) and not CERT_ONLY.match(s) \
                and current.sessions[-1].format is None and not current.sessions[-1].time == s:
            current.sessions[-1].format = s
        elif CERT_RE.match(s) or CERT_ONLY.match(s):
            # "UA16+ | Hindi" or a bare "A" chip: the film title is the text right before it
            title_like = last_text and not TIME_RE.match(last_text) and not CERT_ONLY.match(last_text) \
                and not FORMAT_RE.match(last_text)
            if title_like and (current is None or current.title != last_text):
                current = start_film(last_text)
            if current is not None and current.certificate is None:
                cm = CERT_RE.match(s)
                current.certificate = (cm.group(1) if cm else s).replace(" ", "")
                if cm:
                    current.languages = cm.group(2)
        elif current is not None and current.runtime_mins is None and DURATION_RE.fullmatch(s):
            current.runtime_mins = _runtime_mins(s)
            current.runtime_source = "cinema_page"
        last_text = s

    for f in films:  # dedupe + sort sessions
        uniq = {}
        for ses in f.sessions:
            uniq.setdefault((ses.time, ses.format), ses)
        f.sessions = sorted(uniq.values(), key=lambda x: _mins(x.time))
    films = [f for f in films if f.sessions]

    out = base.model_copy(update={"name": name or base.name, "address": address, "films": films})
    if coords and out.lat is None:
        out.lat, out.lng, out.coord_source = coords[0], coords[1], "page"
    return out


def _fmt_time(s: str) -> str:
    m = TIME_RE.match(s)
    return f"{int(m.group(1)):02d}:{m.group(2)} {m.group(3).upper()}"


def _mins(label: str) -> int:
    m = TIME_RE.match(label)
    if not m:
        return 0
    h = int(m.group(1)) % 12 + (12 if m.group(3).upper() == "PM" else 0)
    return h * 60 + int(m.group(2))


# ---------------------------------------------------------------- orchestration
async def _geocode(query: str) -> Optional[Tuple[float, float]]:
    if not GEOCODE or not query:
        return None
    try:
        async with httpx.AsyncClient(timeout=10, headers={"User-Agent": GEOCODE_UA}) as c:
            r = await c.get("https://nominatim.openstreetmap.org/search",
                            params={"q": query, "format": "json", "limit": 1, "countrycodes": "in"})
            await asyncio.sleep(1.1)  # Nominatim policy: max 1 req/s
            data = r.json() if r.status_code == 200 else []
            if data:
                lat, lng = float(data[0]["lat"]), float(data[0]["lon"])
                return (lat, lng) if _in_india(lat, lng) else None
    except (httpx.HTTPError, ValueError, KeyError):
        pass
    return None


_geo_lock = asyncio.Lock()


async def _resolve_coords(c: Cinema, page: Optional[Cinema]) -> Cinema:
    if c.cinema_id in _coord_cache:
        hit = _coord_cache[c.cinema_id]
        return c.model_copy(update={"lat": hit["lat"], "lng": hit["lng"], "coord_source": hit.get("source", "cache")})
    k = known_match(c.name)
    if k:
        return c.model_copy(update={"lat": k["lat"], "lng": k["lng"], "coord_source": "known"})
    if page and page.lat is not None:
        _coord_cache[c.cinema_id] = {"lat": page.lat, "lng": page.lng, "source": "page", "name": c.name}
        _save_cache()
        return c.model_copy(update={"lat": page.lat, "lng": page.lng, "coord_source": "page"})
    addr = (page.address if page else None) or c.address
    async with _geo_lock:
        hit = await _geocode(addr or c.name) or (await _geocode(c.name) if addr else None)
    if hit:
        _coord_cache[c.cinema_id] = {"lat": hit[0], "lng": hit[1], "source": "geocoded", "name": c.name}
        _save_cache()
        return c.model_copy(update={"lat": hit[0], "lng": hit[1], "coord_source": "geocoded"})
    return c


async def _page(c: Cinema, date: Optional[str] = None) -> Optional[Cinema]:
    url = c.url + (f"?fromdate={date}" if date else "")
    try:
        html, _ = await fetcher.get(url)
    except FetchError:
        return None
    return parse_cinema_page(html, c)


async def cinemas_near(req: NearbyRequest) -> NearbyResponse:
    warnings: List[str] = []
    city = req.city.strip().lower().replace(" ", "-")
    path = f"/movies/cinemas-in-{city}"
    try:
        html, _ = await fetcher.get(path)
    except FetchError as e:
        if e.status != 404 or city == "delhi-ncr":
            raise
        warnings.append(f"No cinema list for '{city}', used delhi-ncr instead")
        path = "/movies/cinemas-in-delhi-ncr"
        html, _ = await fetcher.get(path)

    listing = parse_cinema_list(html)[: req.max_cinemas]
    points = [(p.lat, p.lng) for p in req.points]

    def nearest(c: Cinema) -> Optional[float]:
        if c.lat is None or not points:
            return None
        return round(min(haversine_km((c.lat, c.lng), p) for p in points), 3)

    # 1) cheap pass: coordinates we already know -> skip pages that are obviously far away
    async def resolve(c: Cinema) -> Optional[Cinema]:
        pre = await _resolve_coords(c, None) if (c.cinema_id in _coord_cache or known_match(c.name)) else None
        if pre is not None and pre.lat is not None:
            d = nearest(pre)
            if d is not None and d > req.radius_km:
                return None
        page = await _page(c, req.date)
        full = await _resolve_coords(page or c, page)
        if full.lat is None:
            warnings.append(f"No coordinates for {c.name}")
            return None
        full.distance_km = nearest(full)
        if full.distance_km is None or full.distance_km > req.radius_km:
            return None
        if page is None:
            warnings.append(f"Could not load showtimes for {c.name}")
        return full

    results = [r for r in await asyncio.gather(*(resolve(c) for c in listing)) if r]

    # 2) runtimes from the movie pages (planner needs them to sequence the evening)
    if req.with_runtimes:
        need = list({f.slug for c in results for f in c.films if f.slug and f.runtime_mins is None})[:30]
        rt = dict(zip(need, await asyncio.gather(*(_runtime_for(s) for s in need))))
        for c in results:
            for f in c.films:
                if f.runtime_mins is None and rt.get(f.slug):
                    f.runtime_mins, f.runtime_source = rt[f.slug], "movie_page"

    results.sort(key=lambda c: c.distance_km or 0)
    films = await _film_summary(results, city)
    return NearbyResponse(city=city, date=req.date, source_url=fetcher.normalize(path), scanned=len(listing),
                          count=len(results), cinemas=results, films=films, warnings=warnings)


def _film_key(title: str) -> str:
    return re.sub(r"[^a-z0-9]", "", title.lower())


async def _film_summary(results: List[Cinema], city: str) -> List[FilmSummary]:
    by: Dict[str, FilmSummary] = {}
    for c in results:
        for f in c.films:
            k = f.movie_id or _film_key(f.title)
            s = by.get(k) or FilmSummary(title=f.title, movie_id=f.movie_id, slug=f.slug)
            for attr in ("poster", "certificate", "languages", "runtime_mins"):
                if getattr(s, attr) is None and getattr(f, attr) is not None:
                    setattr(s, attr, getattr(f, attr))
            s.cinemas += 1
            s.sessions += len(f.sessions)
            by[k] = s
    films = list(by.values())
    if any(f.poster is None for f in films):  # posters from the city's now-showing page
        try:
            html, _ = await fetcher.get(f"/movies/{city}-movie-tickets")
            cards = {m.movie_id: m for m in parse_movie_cards(html)}
            cards_by_title = {_film_key(m.title): m for m in cards.values()}
            for f in films:
                m = cards.get(f.movie_id) or cards_by_title.get(_film_key(f.title))
                if m and f.poster is None:
                    f.poster = m.image
        except (FetchError, ValueError):
            pass
    # most-screened first: that's what people are most likely to pick
    return sorted(films, key=lambda f: (-f.sessions, f.title))


async def _runtime_for(slug: str) -> Optional[int]:
    try:
        html, _ = await fetcher.get(f"/movies/{slug}")
    except FetchError:
        return None
    return _runtime_mins(parse_movie_detail(html, slug).duration)
