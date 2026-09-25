from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import restaurants as rest
from app.fetcher import fetcher
from app.main import app

FIX = Path(__file__).parent / "fixtures"
CINEMA = {"lat": 28.5056, "lng": 77.0965}  # Ambience Mall

OVERPASS = [
    {"type": "node", "id": 1, "lat": 28.5024, "lon": 77.0975,
     "tags": {"amenity": "restaurant", "name": "Chili's Grill & Bar", "cuisine": "mexican;american",
              "opening_hours": "Mo-Su 11:00-23:30", "addr:street": "Ambience Mall"}},
    {"type": "way", "id": 2, "center": {"lat": 28.5060, "lon": 77.0960},
     "tags": {"amenity": "cafe", "name": "Blue Tokai"}},
    {"type": "node", "id": 3, "lat": 28.5061, "lon": 77.0961,
     "tags": {"amenity": "cafe", "name": "Blue Tokai"}},              # duplicate of way/2
    {"type": "node", "id": 4, "lat": 28.4000, "lon": 77.0000,
     "tags": {"amenity": "restaurant", "name": "Far Away"}},          # outside radius
    {"type": "node", "id": 5, "lat": 28.5057, "lon": 77.0966, "tags": {"amenity": "bar"}},  # no name
]


def test_parse_overpass():
    rs = rest.parse_overpass(OVERPASS)
    chilis = rs[0]
    assert chilis.cuisines == ["Mexican", "American"] and chilis.kind == "restaurant"
    assert chilis.opening_hours == "Mo-Su 11:00-23:30" and chilis.address == "Ambience Mall"
    assert rs[1].lat == 28.5060 and rs[1].kind == "cafe"
    assert all(r.name for r in rs) and len(rs) == 4


def test_zomato_to_district_url():
    assert rest.to_district_url("https://www.zomato.com/ncr/hira-sweets-sector-29-gurgaon") == \
        "https://www.district.in/dining/ncr/hira-sweets-sector-29-gurgaon"
    assert rest.to_district_url("https://www.district.in/dining/ncr/delhi-darbar-restaurant-sector-33/book") == \
        "https://www.district.in/dining/ncr/delhi-darbar-restaurant-sector-33"
    assert rest.to_district_url("https://example.com/x") is None


def test_parse_dining_page():
    d = rest.parse_dining_page((FIX / "dining_page.html").read_text(), "https://www.district.in/dining/ncr/spezia")
    assert d.name == "Spezia Bistro" and d.locality == "Sector 69, Gurgaon"
    assert d.cuisines == ["Italian", "Indo-Chinese", "Asian"]
    assert d.price_for_two == 2500 and d.rating == 4.5 and d.rating_count == 259
    assert (d.lat, d.lng) == (28.3921847, 77.0303651)
    assert d.hours == "12:00 PM – 11:00 PM" and d.bookable
    assert d.offers[0].startswith("Flat 10% off")
    assert d.address.startswith("Lower Ground Floor")


@pytest.fixture
def client(monkeypatch):
    calls = {"overpass": 0}

    async def fake_overpass(points, radius_m):
        calls["overpass"] += 1
        return rest.parse_overpass(OVERPASS)

    monkeypatch.setattr(rest, "_overpass", fake_overpass)
    monkeypatch.setattr(rest, "GOOGLE_KEY", "")
    monkeypatch.setattr(rest, "_maps_cache", {})

    async def fake_get(path, use_cache=True):
        return (FIX / "dining_page.html").read_text(), False

    monkeypatch.setattr(fetcher, "get", fake_get)
    c = TestClient(app)
    c.calls = calls
    return c


def test_nearby_filters_dedupes_sorts_and_caches(client):
    body = client.post("/restaurants/nearby", json={"points": [CINEMA], "radius_m": 800}).json()
    assert body["provider"] == "osm"
    names = [r["name"] for r in body["restaurants"]]
    assert names == ["Blue Tokai", "Chili's Grill & Bar"]      # sorted by distance, dup + far removed
    assert body["restaurants"][0]["distance_m"] < 100
    client.post("/restaurants/nearby", json={"points": [CINEMA], "radius_m": 800})
    assert client.calls["overpass"] == 1                       # second call served from cache


def test_google_requires_key(client):
    r = client.post("/restaurants/nearby", json={"points": [CINEMA], "provider": "google"})
    assert r.status_code == 400


def test_district_lookup_endpoint(client):
    r = client.post("/restaurants/district", json={"urls": [
        "https://www.zomato.com/ncr/spezia-bistro-sector-69-gurgaon", "https://example.com/nope"]})
    body = r.json()
    assert body["count"] == 1 and body["items"][0]["price_for_two"] == 2500
    assert "Not a District or Zomato" in body["warnings"][0]
