"""HTTP layer: browser-like requests, TTL cache, concurrency limit, retries.

Playwright is used as an optional fallback when plain HTTP is blocked
(set USE_PLAYWRIGHT=1 and `pip install playwright`).
"""
import asyncio
import os
import time
from typing import Dict, Optional, Tuple
from urllib.parse import urlparse

import httpx

BASE_URL = "https://www.district.in"
ALLOWED_HOSTS = {"www.district.in", "district.in"}

CACHE_TTL = int(os.getenv("CACHE_TTL", "600"))          # seconds
MAX_CONCURRENCY = int(os.getenv("MAX_CONCURRENCY", "3"))
MIN_DELAY = float(os.getenv("MIN_DELAY", "0.5"))        # polite gap between requests
USE_PLAYWRIGHT = os.getenv("USE_PLAYWRIGHT", "0") == "1"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9",
}


class FetchError(Exception):
    def __init__(self, url: str, status: Optional[int], msg: str = ""):
        self.url, self.status = url, status
        super().__init__(f"{status or 'ERR'} fetching {url} {msg}".strip())


class Fetcher:
    def __init__(self) -> None:
        self._cache: Dict[str, Tuple[float, str]] = {}
        self._sem = asyncio.Semaphore(MAX_CONCURRENCY)
        self._last = 0.0
        self._client: Optional[httpx.AsyncClient] = None

    async def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                headers=HEADERS, follow_redirects=True, timeout=20, http2=False
            )
        return self._client

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()

    @staticmethod
    def normalize(path_or_url: str) -> str:
        url = path_or_url if path_or_url.startswith("http") else BASE_URL + "/" + path_or_url.lstrip("/")
        if urlparse(url).hostname not in ALLOWED_HOSTS:
            raise ValueError("Only district.in URLs are allowed")
        return url

    async def get(self, path_or_url: str, use_cache: bool = True) -> Tuple[str, bool]:
        """Return (html, from_cache)."""
        url = self.normalize(path_or_url)
        hit = self._cache.get(url)
        if use_cache and hit and time.time() - hit[0] < CACHE_TTL:
            return hit[1], True

        async with self._sem:
            gap = MIN_DELAY - (time.time() - self._last)
            if gap > 0:
                await asyncio.sleep(gap)
            html = await self._get_http(url)
            self._last = time.time()

        self._cache[url] = (time.time(), html)
        return html, False

    async def _get_http(self, url: str) -> str:
        client = await self.client()
        last_err: Optional[Exception] = None
        for attempt in range(3):
            try:
                r = await client.get(url)
                if r.status_code == 404:
                    raise FetchError(url, 404, "not found")
                if r.status_code in (403, 429) and USE_PLAYWRIGHT:
                    return await self._get_browser(url)
                if r.status_code >= 500 or r.status_code == 429:
                    raise FetchError(url, r.status_code)
                r.raise_for_status()
                return r.text
            except FetchError as e:
                if e.status == 404:
                    raise
                last_err = e
            except httpx.HTTPError as e:
                last_err = e
            await asyncio.sleep(1.5 * (attempt + 1))
        raise FetchError(url, getattr(last_err, "status", None), str(last_err))

    async def _get_browser(self, url: str) -> str:
        from playwright.async_api import async_playwright  # optional dependency

        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page(user_agent=HEADERS["User-Agent"])
            await page.goto(url, wait_until="networkidle", timeout=30000)
            html = await page.content()
            await browser.close()
            return html

    def clear(self) -> int:
        n = len(self._cache)
        self._cache.clear()
        return n


fetcher = Fetcher()
