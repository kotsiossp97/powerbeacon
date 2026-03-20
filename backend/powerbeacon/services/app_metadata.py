"""Application metadata helpers."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from threading import Lock
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from powerbeacon.core import settings

GITHUB_REPO = "kotsiossp97/powerbeacon"
GITHUB_API_BASE = "https://api.github.com"
REPO_URL = f"https://github.com/{GITHUB_REPO}"
CACHE_TTL = timedelta(minutes=15)


@dataclass(slots=True)
class AppMetadata:
    current_version: str
    latest_version: str | None
    update_available: bool
    release_url: str
    repo_url: str
    checked_at: datetime
    contributors: list[dict[str, str | int | None]]


@dataclass(slots=True)
class _CacheState:
    value: AppMetadata | None = None
    expires_at: datetime | None = None


_cache = _CacheState()
_cache_lock = Lock()


def _parse_version(version: str | None) -> tuple[int, ...]:
    if not version:
        return ()

    normalized = version.strip().lower().removeprefix("v")
    numeric_parts: list[int] = []
    for part in normalized.split("."):
        digits = ""
        for char in part:
            if char.isdigit():
                digits += char
            else:
                break
        numeric_parts.append(int(digits) if digits else 0)
    return tuple(numeric_parts)


def _is_newer_version(current: str, latest: str | None) -> bool:
    if not latest:
        return False

    current_parts = _parse_version(current)
    latest_parts = _parse_version(latest)
    max_len = max(len(current_parts), len(latest_parts))
    current_padded = current_parts + (0,) * (max_len - len(current_parts))
    latest_padded = latest_parts + (0,) * (max_len - len(latest_parts))
    return latest_padded > current_padded


def _fetch_json(url: str) -> dict | list:
    request = Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "PowerBeacon/1.0",
        },
    )
    with urlopen(request, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))


def _fetch_latest_release() -> tuple[str | None, str]:
    url = f"{GITHUB_API_BASE}/repos/{GITHUB_REPO}/releases/latest"
    try:
        payload = _fetch_json(url)
    except HTTPError as exc:
        if exc.code == 404:
            return None, REPO_URL
        raise

    if not isinstance(payload, dict):
        return None, REPO_URL

    latest_version = payload.get("tag_name")
    release_url = payload.get("html_url") or REPO_URL
    return latest_version, release_url


def _fetch_contributors() -> list[dict[str, str | int | None]]:
    url = f"{GITHUB_API_BASE}/repos/{GITHUB_REPO}/contributors?per_page=6"
    payload = _fetch_json(url)
    if not isinstance(payload, list):
        return []

    contributors: list[dict[str, str | int | None]] = []
    for item in payload:
        if not isinstance(item, dict):
            continue
        contributors.append(
            {
                "login": item.get("login"),
                "avatar_url": item.get("avatar_url"),
                "html_url": item.get("html_url"),
                "contributions": item.get("contributions") or 0,
            }
        )
    return contributors


def get_app_metadata() -> AppMetadata:
    now = datetime.now(UTC)

    with _cache_lock:
        if _cache.value and _cache.expires_at and now < _cache.expires_at:
            return _cache.value

    latest_version: str | None = None
    release_url = REPO_URL
    contributors: list[dict[str, str | int | None]] = []

    try:
        latest_version, release_url = _fetch_latest_release()
        contributors = _fetch_contributors()
    except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError):
        pass

    metadata = AppMetadata(
        current_version=settings.app_version,
        latest_version=latest_version,
        update_available=_is_newer_version(settings.app_version, latest_version),
        release_url=release_url,
        repo_url=REPO_URL,
        checked_at=now,
        contributors=contributors,
    )

    with _cache_lock:
        _cache.value = metadata
        _cache.expires_at = now + CACHE_TTL

    return metadata
