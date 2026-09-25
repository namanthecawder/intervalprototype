from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import parsers
from app.fetcher import fetcher
from app.main import app

FIX = Path(__file__).parent / "fixtures"
html = lambda name: (FIX / name).read_text(encoding="utf-8")


# ---------------- parser unit tests
def test_event_cards_dedupe_and_fields():
    cards = {c.slug: c for c in parsers.parse_event_cards(html("events.html"))}
    assert len(cards) == 5  # venue-guide, artist and movie links are ignored

    wow = cards["worlds-of-wonder-wow-water-park-buy-tickets"]
    assert wow.title == "Worlds of Wonder (WOW) - Water Park"
    assert wow.venue == "Worlds of Wonder, Noida" and wow.city == "Noida"
    assert wow.price_min == 799 and wow.price_text == "₹799 onwards"
    assert wow.offer == "Flat 50% OFF"  # richer duplicate wins

    kart = cards["f9-gokarting-sector-59-buy-tickets"]
    assert kart.title == "F9 Go Karting | Sector 59"
    assert kart.date_text == "Daily, Multiple slots"
    assert kart.offer.startswith("Buy 2")

    garba = cards["garba-ni-raat-20-dandiya-night-2026-oct17-2026-buy-tickets"]
    assert garba.title.startswith("Garba Ni Raat")  # venue-first layout
    assert garba.city == "Gurugram" and garba.price_min is None

    assert cards["lal-bagh-ka-raja-ganpati-mahotsav-delhi-sep14-2026-buy-tickets"].price_min == 1299


def test_event_detail():
    d = parsers.parse_event_detail(html("event_detail.html"), "daniel-x-buy-tickets")
    assert d.title == "Daniel Fernandes - Do You Know Who I Am?"
    assert d.event_id == "6a9fa2247c7542916cd6b5d6"
    assert d.date_text == "Sun, 27 Sept, 6:00 PM"
    assert d.venue == "The Comedy Theatre, Gurugram" and d.city == "Gurugram"
    assert d.price_min == 799 and d.price_text == "₹799 onwards"
    assert d.categories == ["Comedy", "Standups"]
    assert d.artists == ["Daniel Fernandes"]
    assert d.things_to_know == ["Entry allowed for ages 18 and above", "Pets are not allowed"]
    assert d.organizer == "Gigs Live Entertainment Private Limited"
    assert d.gates_open == "Gates open at 5:50 PM"
    assert "stand up show" in d.description


def test_movie_cards():
    movies = {m.movie_id: m for m in parsers.parse_movie_cards(html("movies.html"))}
    assert len(movies) == 4
    h = movies["MV225612"]
    assert h.certificate == "U" and h.languages == "Hindi"
    assert h.genres.startswith("Biography")
    assert h.slug == "hanuman-ansh-movie-tickets-MV225612"  # canonical URL preferred
    assert movies["MV183084"].certificate == "UA16+"
    assert movies["MV185027"].languages == "Telugu and 1 more"


def test_movie_detail_jsonld():
    m = parsers.parse_movie_detail(html("movie_detail.html"), "the-paradise-movie-tickets-MV185027")
    assert m.title == "The Paradise" and m.movie_id == "MV185027"
    assert m.genres == ["Action", "Drama"] and m.languages == ["Telugu", "Hindi"]
    assert m.certificate == "A" and m.duration == "PT2H38M"


# ---------------- API tests (network mocked)
@pytest.fixture
def client(monkeypatch):
    calls = []

    async def fake_get(path, use_cache=True):
        calls.append(fetcher.normalize(path))
        if "/movies/" in path and "MV" in path:
            return html("movie_detail.html"), False
        if "/movies" in path:
            return html("movies.html"), False
        if path.rstrip("/").endswith("/events") or "-in-" in path:
            return html("events.html"), False
        return html("event_detail.html"), False

    monkeypatch.setattr(fetcher, "get", fake_get)
    c = TestClient(app)
    c.calls = calls
    return c


def test_api_events(client):
    r = client.get("/events", params={"max_price": 700})
    assert r.status_code == 200
    assert {e["price_min"] for e in r.json()["items"]} == {675, 299}


def test_api_events_category_url(client):
    r = client.get("/events", params={"city": "Bengaluru", "category": "comedy", "city_filter": "gurugram"})
    assert r.status_code == 200
    assert client.calls[-1] == "https://www.district.in/events/comedy-shows-in-bangalore-book-tickets"
    assert all("Gurugram" in e["city"] for e in r.json()["items"])


def test_api_bad_category(client):
    assert client.get("/events", params={"city": "mumbai", "category": "opera"}).status_code == 400


def test_api_movies_and_detail(client):
    r = client.get("/movies", params={"city": "bangalore", "language": "hindi"})
    assert client.calls[-1].endswith("/movies/bengaluru-movie-tickets")
    assert r.json()["count"] == 2
    d = client.get("/movies/the-paradise-movie-tickets-MV185027").json()
    assert d["title"] == "The Paradise"


def test_api_event_detail(client):
    d = client.get("/events/daniel-fernandes-do-you-know-who-i-am-sep27-2026-buy-tickets").json()
    assert d["organizer"].startswith("Gigs Live")


def test_scrape_rejects_other_hosts(client):
    assert client.get("/scrape", params={"url": "https://example.com"}).status_code == 400
