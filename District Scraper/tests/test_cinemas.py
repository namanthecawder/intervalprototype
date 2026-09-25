from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import cinemas as cin
from app.fetcher import fetcher
from app.main import app

FIX = Path(__file__).parent / "fixtures"
html = lambda n: (FIX / n).read_text(encoding="utf-8")
SELECT_CITYWALK_RESTAURANT = {"lat": 28.5283, "lng": 77.2190}


def test_cinema_list():
    items = cin.parse_cinema_list(html("cinemas_list.html"))
    assert [c.cinema_id for c in items] == ["1022254", "1011111", "2000001"]
    assert items[0].name == "PVR Select City Walk, Saket, New Delhi"
    assert "110017" in items[0].address


def test_cinema_page_films_and_sessions():
    base = cin.Cinema(cinema_id="1022254", name="x", url="u")
    c = cin.parse_cinema_page(html("cinema_page.html"), base)
    assert c.name == "PVR Select City Walk, Saket, New Delhi, New Delhi"
    films = {f.title: f for f in c.films}
    assert set(films) == {"Mirzapur: The Movie", "Fall 2: Deadpoint"}  # no-showtime film dropped
    m = films["Mirzapur: The Movie"]
    assert m.movie_id == "MV181196" and m.certificate == "A"
    assert m.poster == "https://cdn.district.in/posters/mirzapur.jpg"
    assert [(s.time, s.format) for s in m.sessions] == [("04:35 PM", "IMAX"), ("07:00 PM", "GOLD"), ("07:45 PM", "RECLINERS")]
    f = films["Fall 2: Deadpoint"]
    assert f.certificate == "UA16+" and f.languages == "English" and f.runtime_mins == 110
    assert [s.time for s in f.sessions] == ["05:30 PM", "11:10 PM"]


def test_coords_from_page_and_known_match():
    c = cin.parse_cinema_page(html("cinema_page_unknown.html"), cin.Cinema(cinema_id="2", name="x", url="u"))
    assert (c.lat, c.lng, c.coord_source) == (28.5301, 77.217, "page")
    assert cin.known_match("PVR Select City Walk, Saket, New Delhi")["lat"] == pytest.approx(28.5, abs=0.1)
    assert cin.known_match("INOX Select City Walk") is None  # brand must agree
    assert cin._runtime_mins("PT2H38M") == 158 and cin._runtime_mins("2h 5m") == 125


@pytest.fixture
def client(monkeypatch, tmp_path):
    monkeypatch.setattr(cin, "COORD_CACHE", tmp_path / "coords.json")
    monkeypatch.setattr(cin, "_coord_cache", {})
    monkeypatch.setattr(cin, "GEOCODE", False)
    calls = []

    async def fake_get(path, use_cache=True):
        url = fetcher.normalize(path)
        calls.append(url)
        if "cinemas-in-" in url:
            return html("cinemas_list.html"), False
        if url.endswith("/new-delhi-movie-tickets"):
            return html("movies.html"), False
        if "CD2000001" in url:
            return html("cinema_page_unknown.html"), False
        if "CD1022254" in url:
            return html("cinema_page.html"), False
        if "MV" in url:
            return html("movie_page_runtime.html"), False
        raise AssertionError(f"unexpected fetch {url}")

    monkeypatch.setattr(fetcher, "get", fake_get)
    c = TestClient(app)
    c.calls = calls
    return c


def test_nearby_filters_by_distance_and_adds_runtimes(client):
    r = client.post("/cinemas/nearby", json={"city": "new-delhi", "points": [SELECT_CITYWALK_RESTAURANT]})
    assert r.status_code == 200, r.text
    body = r.json()
    ids = [c["cinema_id"] for c in body["cinemas"]]
    assert ids == ["1022254", "2000001"]  # Gurugram Ambience is ~15 km away
    assert not any("CD1011111" in u for u in client.calls)  # known-far cinema never fetched
    scw = body["cinemas"][0]
    assert scw["coord_source"] == "known" and scw["distance_km"] < 0.5
    mirz = next(f for f in scw["films"] if f["title"].startswith("Mirzapur"))
    assert mirz["runtime_mins"] == 158 and mirz["runtime_source"] == "movie_page"
    assert body["cinemas"][1]["coord_source"] == "page"


def test_nearby_needs_points(client):
    assert client.post("/cinemas/nearby", json={"points": []}).status_code == 400


def test_nearby_passes_date_and_builds_film_list(client):
    r = client.post("/cinemas/nearby", json={"city": "new-delhi", "date": "2026-09-26",
                                             "points": [SELECT_CITYWALK_RESTAURANT]})
    body = r.json()
    assert body["date"] == "2026-09-26"
    assert any(u.endswith("CD1022254?fromdate=2026-09-26") for u in client.calls)
    films = {f["title"]: f for f in body["films"]}
    assert films["Mirzapur: The Movie"]["sessions"] == 3 and films["Mirzapur: The Movie"]["cinemas"] == 1
    assert films["Vibe"]["poster"] is None or films["Vibe"]["poster"].startswith("http")
    assert body["films"][0]["title"] == "Mirzapur: The Movie"  # most sessions first


def test_nearby_rejects_bad_date(client):
    r = client.post("/cinemas/nearby", json={"date": "26-09-2026", "points": [SELECT_CITYWALK_RESTAURANT]})
    assert r.status_code == 422
