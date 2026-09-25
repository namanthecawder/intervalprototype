from typing import Any, List, Optional

from pydantic import BaseModel


class EventCard(BaseModel):
    title: str
    url: str
    slug: str
    date_text: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    price_text: Optional[str] = None
    price_min: Optional[int] = None
    offer: Optional[str] = None


class EventDetail(BaseModel):
    title: str
    url: str
    slug: str
    event_id: Optional[str] = None
    date_text: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    price_text: Optional[str] = None
    price_min: Optional[int] = None
    categories: List[str] = []
    image: Optional[str] = None
    description: Optional[str] = None
    artists: List[str] = []
    things_to_know: List[str] = []
    organizer: Optional[str] = None
    gates_open: Optional[str] = None


class MovieCard(BaseModel):
    title: str
    url: str
    slug: str
    movie_id: Optional[str] = None
    certificate: Optional[str] = None
    languages: Optional[str] = None
    genres: Optional[str] = None
    image: Optional[str] = None


class MovieDetail(BaseModel):
    title: str
    url: str
    slug: str
    movie_id: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    certificate: Optional[str] = None
    languages: List[str] = []
    genres: List[str] = []
    duration: Optional[str] = None
    release_date: Optional[str] = None


class ListResponse(BaseModel):
    source_url: str
    count: int
    cached: bool
    items: List[Any]
