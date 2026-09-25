"""HTML -> structured data.

District's markup uses hashed CSS class names that change on every deploy,
so these parsers deliberately avoid class selectors. They rely on things that
are stable: URL patterns, meta/OG tags, JSON-LD, image alt text, and the
order of text inside each card.
"""
import json
import re
from typing import Dict, List, Optional
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from .fetcher import BASE_URL
from .models import EventCard, EventDetail, MovieCard, MovieDetail

EVENT_HREF = re.compile(r"^/events/([a-z0-9-]+-buy-tickets)/?$")
MOVIE_HREF = re.compile(r"^/movies/([a-z0-9-]+-movie-tickets(?:-in-[a-z0-9-]+)?-(MV\d+))/?$")

DATE_RE = re.compile(
    r"^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Daily|Today|Tomorrow)\b|Multiple (slots|Dates)|\d{1,2}:\d{2}\s?(AM|PM)",
    re.I,
)
PRICE_RE = re.compile(r"₹\s?([\d,]+)")
OFFER_RE = re.compile(r"(\d+%\s*off|flat\b.*\boff|buy\s*\d+,?\s*get\s*\d+)", re.I)
CERT_RE = re.compile(r"^(U/A\s?\d+\+|UA\s?\d+\+|UA|U|A|S)\s*\|\s*(.+)$")
DURATION_RE = re.compile(r"\b(\d+h\s?\d*m?|\d+\s?hrs?\s?\d*\s?mins?)\b", re.I)

LANGUAGES = {
    "hindi", "english", "tamil", "telugu", "malayalam", "kannada", "marathi", "bengali",
    "punjabi", "gujarati", "odia", "korean", "japanese", "haryanvi", "garhwali", "bhojpuri",
    "assamese", "urdu", "french", "spanish", "chinese", "tulu", "konkani", "rajasthani",
}
NOISE = {"book tickets", "book now", "offer", "onwards", "view more", "more"}


# ---------------------------------------------------------------- helpers
def _soup(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "lxml")


def _abs(href: str) -> str:
    return urljoin(BASE_URL, href)


def _path(href: str) -> str:
    p = urlparse(href)
    if p.hostname and p.hostname not in ("www.district.in", "district.in"):
        return ""
    return p.path


def _meta(soup: BeautifulSoup, *names: str) -> Optional[str]:
    for n in names:
        tag = soup.find("meta", attrs={"property": n}) or soup.find("meta", attrs={"name": n})
        if tag and tag.get("content"):
            return tag["content"].strip()
    return None


def _price_min(text: Optional[str]) -> Optional[int]:
    m = PRICE_RE.search(text or "")
    return int(m.group(1).replace(",", "")) if m else None


def _title_from_slug(slug: str) -> str:
    s = re.sub(r"-(movie-tickets.*|buy-tickets)$", "", slug)
    s = re.sub(r"-[a-z]{3}\d{1,2}-\d{4}$", "", s)  # drop "-sep27-2026"
    return s.replace("-", " ").title()


def img_src(tag) -> Optional[str]:
    """Best image URL from an <img>, handling lazy-load attributes and srcset."""
    if tag is None:
        return None
    for attr in ("src", "data-src", "data-lazy-src"):
        v = tag.get(attr)
        if v and not v.startswith("data:"):
            return _abs(v)
    ss = tag.get("srcset") or tag.get("data-srcset")
    if ss:
        return _abs(ss.split(",")[-1].strip().split(" ")[0])
    return None


def _json_ld(soup: BeautifulSoup) -> List[dict]:
    out: List[dict] = []
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "")
        except (ValueError, TypeError):
            continue
        items = data if isinstance(data, list) else data.get("@graph", [data])
        out.extend(i for i in items if isinstance(i, dict))
    return out


def _lines(soup: BeautifulSoup) -> List[str]:
    for t in soup(["script", "style", "noscript", "svg"]):
        t.decompose()
    return [l.strip() for l in soup.get_text("\n").split("\n") if l.strip()]


def _section(lines: List[str], start: str, stops: List[str]) -> List[str]:
    """Lines after a heading that starts with `start`, until a stop heading."""
    for i, l in enumerate(lines):
        if l.lower().startswith(start.lower()):
            out, rest = [], l[len(start):].strip()
            if rest:
                out.append(rest)
            for nxt in lines[i + 1:]:
                if any(nxt.lower().startswith(s.lower()) for s in stops):
                    break
                out.append(nxt)
            return out
    return []


# ---------------------------------------------------------------- listings
def parse_event_cards(html: str) -> List[EventCard]:
    soup = _soup(html)
    seen: Dict[str, EventCard] = {}
    for a in soup.find_all("a", href=True):
        m = EVENT_HREF.match(_path(a["href"]))
        if not m:
            continue
        slug = m.group(1)
        card = _event_card(a, slug)
        prev = seen.get(slug)
        # the same event appears in several carousels; keep the richest one
        if not prev or _score(card) > _score(prev):
            seen[slug] = card
    return list(seen.values())


def _score(c: EventCard) -> int:
    return sum(v is not None for v in (c.date_text, c.venue, c.price_text, c.offer))


def _event_card(a, slug: str) -> EventCard:
    strings = [s for s in a.stripped_strings]
    offer = date = price = None
    rest: List[str] = []

    i = 0
    while i < len(strings):
        s = strings[i]
        low = s.lower()
        if low == "offer" and i + 1 < len(strings):
            offer = strings[i + 1]
            i += 2
            continue
        if price is None and "₹" in s:
            price = s
            if i + 1 < len(strings) and strings[i + 1].lower() == "onwards":
                price += " onwards"
                i += 1
        elif date is None and DATE_RE.search(s) and "₹" not in s:
            date = s
        elif offer is None and OFFER_RE.search(s):
            offer = s
        elif low not in NOISE and not s.startswith("http") and not re.match(r"^[\d.]+\s?km", s):
            if s not in rest:
                rest.append(s)
        i += 1

    img = a.find("img", alt=True)
    alt = img["alt"].strip() if img and img["alt"].strip() not in ("", "event", "banner") else None

    venue = next((s for s in rest if "," in s and len(s.rsplit(",", 1)[1].split()) <= 3 and s != alt), None)
    title = alt or next((s for s in rest if s != venue), None) or _title_from_slug(slug)
    city = venue.rsplit(",", 1)[1].strip() if venue else None

    return EventCard(
        title=title, url=_abs(f"/events/{slug}"), slug=slug, date_text=date,
        venue=venue, city=city, price_text=price, price_min=_price_min(price), offer=offer,
    )


def parse_movie_cards(html: str) -> List[MovieCard]:
    soup = _soup(html)
    seen: Dict[str, MovieCard] = {}
    for a in soup.find_all("a", href=True):
        m = MOVIE_HREF.match(_path(a["href"]))
        if not m:
            continue
        slug, mid = m.group(1), m.group(2)
        strings = [s for s in a.stripped_strings if s.lower() not in NOISE]
        if not strings:
            continue
        img = a.find("img", alt=True)
        title = (img["alt"].strip() if img and img["alt"].strip() else None) or strings[0]

        cert = langs = genres = None
        # text after the title looks like "UA16+ | Hindi" or "A | Action, Crime +1 more"
        tail = " ".join(s for s in strings if s != title)
        tail = re.sub(r"\s*\|\s*", " | ", tail).strip()
        cm = CERT_RE.match(tail)
        if cm:
            cert = cm.group(1).replace(" ", "")
            after = re.split(r"(?<=more)|(?<=[a-z])(?=[A-Z][a-z]+ )", cm.group(2))[0].strip()
            first = re.split(r"[ ,]", after)[0].lower()
            if first in LANGUAGES:
                langs = after
            else:
                genres = after

        card = MovieCard(title=title, url=_abs(f"/movies/{slug}"), slug=slug, movie_id=mid,
                         certificate=cert, languages=langs, genres=genres, image=img_src(a.find("img")))
        prev = seen.get(mid)
        if prev:  # merge carousel + grid versions of the same film
            card = prev.model_copy(update={k: v for k, v in card.model_dump().items()
                                           if v and not getattr(prev, k)})
            # prefer the city-less canonical URL
            canonical = slug if "-movie-tickets-in-" not in slug else prev.slug
            card.slug, card.url = canonical, _abs(f"/movies/{canonical}")
        seen[mid] = card
    return list(seen.values())


# ---------------------------------------------------------------- details
def parse_event_detail(html: str, slug: str) -> EventDetail:
    soup = _soup(html)
    ld = next((d for d in _json_ld(soup) if "Event" in str(d.get("@type", ""))), {})
    title = (ld.get("name") or _meta(soup, "og:title") or _title_from_slug(slug)).strip()
    keywords = [k.strip() for k in (_meta(soup, "keywords") or "").split(",") if k.strip()]
    categories = [k for k in keywords if k.lower() != title.lower()]
    image = _meta(soup, "og:image")
    event_id = _meta(soup, "event_id")

    lines = _lines(soup)
    try:
        start = lines.index(title)
    except ValueError:
        start = 0
    head = lines[start + 1:start + 6]

    date = next((l for l in head if DATE_RE.search(l)), None)
    venue = next((l.split("·")[0].strip() for l in head if "," in l and "₹" not in l and l != date), None)
    city = venue.rsplit(",", 1)[1].strip() if venue and "," in venue else None

    price = None
    for i, l in enumerate(lines):
        if "₹" in l:
            price = l + (" onwards" if i + 1 < len(lines) and lines[i + 1].lower() == "onwards" else "")
            break

    about = _section(lines, "About", ["Who's taking the stage", "Things to know", "Organized by", "Terms"])
    about = [l for l in about if l.lower() not in ("read more", "about artist")]
    artists = [l for l in _section(lines, "Who's taking the stage", ["Things to know", "Organized by"])
               if l.lower() not in ("about artist", "view all")]
    ttk_raw = _section(lines, "Things to know", ["View more", "Organized by", "Terms"])
    things = [re.sub(r"^\d+\.\s*", "", l) for l in ttk_raw if not re.fullmatch(r"\d+\.?", l)]
    org = _section(lines, "Organized by", ["More", "Terms"])
    gates = next((l for l in lines if l.lower().startswith("gates open")), None)

    if ld:
        date = date or ld.get("startDate")
        loc = ld.get("location") or {}
        if isinstance(loc, dict):
            venue = venue or loc.get("name")
        offers = ld.get("offers")
        if isinstance(offers, list) and offers:
            offers = offers[0]
        if isinstance(offers, dict) and not price and offers.get("price"):
            price = f"₹{offers['price']}"

    return EventDetail(
        title=title, url=_abs(f"/events/{slug}"), slug=slug, event_id=event_id,
        date_text=date, venue=venue, city=city, price_text=price, price_min=_price_min(price),
        categories=categories, image=image,
        description=("\n".join(about) or ld.get("description") or _meta(soup, "description")),
        artists=artists, things_to_know=things, organizer=org[0] if org else None, gates_open=gates,
    )


def parse_movie_detail(html: str, slug: str) -> MovieDetail:
    soup = _soup(html)
    ld = next((d for d in _json_ld(soup) if "Movie" in str(d.get("@type", ""))), {})
    mid = re.search(r"MV\d+", slug)
    raw_title = ld.get("name") or _meta(soup, "og:title") or _title_from_slug(slug)
    title = re.sub(r"\s*[|(-]\s*(Movie Tickets|Book|District).*$", "", raw_title, flags=re.I).strip()

    lines = _lines(soup)
    text = " \n".join(lines)
    cert = next((CERT_RE.match(l).group(1) for l in lines if CERT_RE.match(l)), None)
    if not cert:
        cert = ld.get("contentRating")
    dur = DURATION_RE.search(text)

    genres = ld.get("genre") or []
    if isinstance(genres, str):
        genres = [g.strip() for g in genres.split(",")]
    langs = ld.get("inLanguage") or []
    if isinstance(langs, str):
        langs = [l.strip() for l in langs.split(",")]
    if not langs:
        found = {w.capitalize() for w in re.findall(r"[A-Za-z]+", " ".join(lines[:80]))
                 if w.lower() in LANGUAGES}
        langs = sorted(found)

    return MovieDetail(
        title=title, url=_abs(f"/movies/{slug}"), slug=slug, movie_id=mid.group(0) if mid else None,
        image=(ld.get("image") if isinstance(ld.get("image"), str) else None) or _meta(soup, "og:image"),
        description=ld.get("description") or _meta(soup, "og:description", "description"),
        certificate=cert, languages=langs, genres=genres,
        duration=ld.get("duration") or (dur.group(1) if dur else None),
        release_date=ld.get("datePublished") or ld.get("dateCreated"),
    )
