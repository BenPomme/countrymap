"""Deterministic public keyword inventory for The World Truth.

This module reads local source files only. It does not make network calls,
read account data, or treat advertiser competition as SEO difficulty.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path
import math
import re
import unicodedata
from typing import Iterable, Mapping, Sequence


MAP_TOPIC_COUNT = 106
MAX_CANDIDATE_QUERIES = 250
MAX_MARKET_COMBINATIONS = 500
DEFAULT_SERP_LIMIT = 20
ORGANIC_DEPTH = 10


@dataclass(frozen=True)
class Market:
    name: str
    location_code: int
    language_code: str = "en"


MARKETS = (
    Market("United States", 2840),
    Market("United Kingdom", 2826),
)


class InventorySourceError(ValueError):
    """Raised when local route or catalogue sources do not match the contract."""


def normalize_query(value: str) -> str:
    """Return the canonical merge and volume lookup key for a query."""
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = text.casefold().replace("&", " and ")
    text = re.sub(r"['\u2019\u2018`]", "", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return " ".join(text.split())


def _clean_keyword(value: str) -> str:
    text = unicodedata.normalize("NFC", str(value or ""))
    text = text.replace("\u2013", " ").replace("\u2014", " ")
    return " ".join(text.casefold().split())


def slugify(value: str) -> str:
    """Match src/lib/seo/slugs.ts so map URLs come from the route builder."""
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = text.casefold().replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def variable_slug(name: str) -> str:
    slug = slugify(f"{name} by country")
    return slug.removesuffix("-by-country") or slugify(name)


def _as_int(value: object) -> int | None:
    if isinstance(value, bool) or value is None:
        return None
    try:
        number = Decimal(str(value).strip())
    except (InvalidOperation, ValueError):
        return None
    if not number.is_finite() or number < 0 or number != number.to_integral_value():
        return None
    return int(number)


@dataclass(frozen=True)
class MetricEntry:
    metric_id: str
    name: str
    slug: str


_ENTRY_RE = re.compile(r"^  '([^']+)': \{", re.MULTILINE)
_NAME_RE = re.compile(r"^    name: (['\"])(.*?)\1,\s*$", re.MULTILINE)


def _read_metric_file(path: Path) -> list[MetricEntry]:
    if not path.is_file():
        raise InventorySourceError(f"metric catalogue not found: {path}")
    source = path.read_text(encoding="utf-8")
    matches = list(_ENTRY_RE.finditer(source))
    entries: list[MetricEntry] = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(source)
        name_match = _NAME_RE.search(source, match.end(), end)
        if name_match is None:
            raise InventorySourceError(f"metric {match.group(1)} has no source name")
        name = name_match.group(2)
        entries.append(MetricEntry(match.group(1), name, variable_slug(name)))
    return entries


def read_metric_catalogue(repo_root: Path) -> list[MetricEntry]:
    """Merge the base catalogue and Object.assign additions in source order."""
    constants = repo_root / "src" / "lib" / "constants"
    base = _read_metric_file(constants / "variables.ts")
    extras = _read_metric_file(constants / "extraVariables.ts")
    merged: dict[str, MetricEntry] = {}
    for entry in [*base, *extras]:
        merged[entry.metric_id] = entry
    entries = list(merged.values())
    if len(entries) != MAP_TOPIC_COUNT:
        raise InventorySourceError(
            f"expected {MAP_TOPIC_COUNT} map topics, found {len(entries)}"
        )
    slugs = [entry.slug for entry in entries]
    if len(set(slugs)) != len(slugs):
        raise InventorySourceError("metric catalogue produces duplicate map slugs")
    return entries


def _existing_route_url(repo_root: Path, page_file: str) -> str:
    page = repo_root / page_file
    if not page.is_file():
        raise InventorySourceError(f"existing route page not found: {page_file}")
    app_root = repo_root / "src" / "app"
    try:
        parts = page.relative_to(app_root).parent.parts
    except ValueError as error:
        raise InventorySourceError(f"route is outside src/app: {page_file}") from error
    if any(part.startswith("[") for part in parts):
        raise InventorySourceError(f"dynamic route cannot be a fixed inventory URL: {page_file}")
    return "/" if not parts else f"/{'/'.join(parts)}/"


def _metric_search_label(name: str) -> str:
    label = name.casefold().replace("avg ", "average ")
    label = label.replace("work hours/week", "work hours per week")
    label = label.replace("vat/sales tax rate", "vat and sales tax rate")
    label = re.sub(r"\s*\((?:% gdp|inequality|usd)\)", "", label)
    label = label.replace("(ppp)", " ppp").replace("lgbt+", "lgbt")
    label = re.sub(r"[^a-z0-9' ]+", " ", label)
    label = " ".join(label.split())
    aliases = {
        "age of first sex": "average age of first sex",
        "cannabis legal": "cannabis legality",
        "gambling legal": "gambling legality",
        "marriage age": "average age of marriage",
        "prostitution legal": "prostitution legality",
        "religion very important": "importance of religion",
    }
    return aliases.get(label, label)


_GAME_QUERY_GROUPS = (
    (
        "src/app/truthle/page.tsx",
        "truthle",
        "gameplay",
        (
            "truthle",
            "truthle game",
            "play truthle",
            "truthle daily game",
            "daily geography game",
            "world statistics game",
            "geography game with country statistics",
            "country data guessing game",
        ),
    ),
    (
        "src/app/true-false/page.tsx",
        "true-false",
        "gameplay",
        (
            "true or false world",
            "true or false geography game",
            "country statistics true or false",
            "daily true or false game",
            "geography true or false quiz",
        ),
    ),
    (
        "src/app/truthle-vs-worldle/page.tsx",
        "game-comparison",
        "comparison",
        (
            "truthle vs worldle",
            "truthle vs globle",
            "truthle vs travle",
            "games like worldle",
            "daily geography games",
            "worldle alternative",
            "alternative to worldle",
            "geography games like globle",
            "daily country guessing game",
        ),
    ),
    (
        "src/app/quiz/page.tsx",
        "country-quiz",
        "gameplay",
        ("country quiz", "geography quiz", "country trivia quiz", "world geography quiz"),
    ),
    (
        "src/app/charts/page.tsx",
        "country-charts",
        "exploration",
        ("country comparison charts", "world statistics charts", "compare countries by statistics"),
    ),
    (
        "src/app/discoveries/page.tsx",
        "country-correlations",
        "exploration",
        ("country statistics correlations", "world data discoveries"),
    ),
    (
        "src/app/page.tsx",
        "world-map-home",
        "exploration",
        (
            "world truth map",
            "world statistics map",
            "country statistics map",
            "interactive world map statistics",
            "country statistics world map",
        ),
    ),
)


def _merge_candidates(candidates: Iterable[tuple[str, str, str, str]]) -> list[dict]:
    merged: dict[str, dict] = {}
    for keyword, url, intent, topic in candidates:
        display = _clean_keyword(keyword)
        key = normalize_query(display)
        if not key or key in merged:
            continue
        merged[key] = {"keyword": display, "url": url, "intent": intent, "topic": topic}
    return list(merged.values())


def build_inventory(repo_root: Path) -> list[dict]:
    """Build a source-derived inventory whose candidates use existing routes."""
    repo_root = Path(repo_root).resolve()
    metrics = read_metric_catalogue(repo_root)
    candidates: list[tuple[str, str, str, str]] = []
    for metric in metrics:
        label = _metric_search_label(metric.name)
        url = f"/map/{metric.slug}/"
        candidates.append((f"{label} by country", url, "informational", metric.metric_id))
        candidates.append((f"map of {label} by country", url, "informational", metric.metric_id))
    for page_file, topic, intent, queries in _GAME_QUERY_GROUPS:
        url = _existing_route_url(repo_root, page_file)
        candidates.extend((query, url, intent, topic) for query in queries)
    inventory = _merge_candidates(candidates)
    if len(inventory) > MAX_CANDIDATE_QUERIES:
        raise InventorySourceError(
            f"inventory has {len(inventory)} queries; cap is {MAX_CANDIDATE_QUERIES}"
        )
    return inventory


def inventory_totals(inventory: Sequence[Mapping[str, object]]) -> dict:
    urls = {str(row["url"]) for row in inventory}
    map_rows = [row for row in inventory if str(row["url"]).startswith("/map/")]
    intents: dict[str, int] = {}
    for row in inventory:
        intent = str(row["intent"])
        intents[intent] = intents.get(intent, 0) + 1
    return {
        "candidate_queries": len(inventory),
        "unique_urls": len(urls),
        "map_queries": len(map_rows),
        "map_topics": len({str(row["topic"]) for row in map_rows}),
        "editorial_game_queries": len(inventory) - len(map_rows),
        "by_intent": dict(sorted(intents.items())),
    }


def _first_present(row: Mapping[str, object], keys: Sequence[str]) -> object:
    for key in keys:
        if key in row:
            return row[key]
    return None


def _market_code(value: object) -> int | None:
    names = {
        "united states": 2840,
        "united states of america": 2840,
        "us": 2840,
        "usa": 2840,
        "united kingdom": 2826,
        "uk": 2826,
        "great britain": 2826,
    }
    if isinstance(value, str) and value.strip().casefold() in names:
        return names[value.strip().casefold()]
    return _as_int(value)


def _language_code(value: object) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    language = value.strip().casefold().replace("_", "-").split("-", 1)[0]
    return language or None


def normalize_volume_row(row: Mapping[str, object]) -> dict | None:
    """Normalize one public Google Ads row without inventing a volume."""
    keyword_value = _first_present(row, ("keyword", "search_term", "query"))
    if not isinstance(keyword_value, str) or not normalize_query(keyword_value):
        return None
    has_volume_field = any(
        key in row for key in ("search_volume", "monthly_search_volume", "volume")
    )
    if not has_volume_field:
        return None
    volume_value = _first_present(row, ("search_volume", "monthly_search_volume", "volume"))
    return {
        "keyword": _clean_keyword(keyword_value),
        "location_code": _market_code(
            _first_present(row, ("location_code", "location_name", "market"))
        ),
        "language_code": _language_code(_first_present(row, ("language_code", "language"))),
        "search_volume": _as_int(volume_value),
        "collected_at": _first_present(row, ("collected_at", "datetime", "date")),
    }


def _volume_index(volume_rows: Iterable[Mapping[str, object]]) -> dict[tuple[str, int, str], int | None]:
    index: dict[tuple[str, int, str], int | None] = {}
    for raw_row in volume_rows:
        row = normalize_volume_row(raw_row)
        if row is None or row["location_code"] is None or row["language_code"] is None:
            continue
        key = (normalize_query(str(row["keyword"])), int(row["location_code"]), str(row["language_code"]))
        previous = index.get(key)
        if key not in index or (previous is None and row["search_volume"] is not None):
            index[key] = row["search_volume"]
    return index


def volume_estimate_for(
    volume_rows: Iterable[Mapping[str, object]],
    keyword: str,
    location_code: int,
    language_code: str = "en",
) -> int | None:
    return _volume_index(volume_rows).get(
        (normalize_query(keyword), int(location_code), _language_code(language_code) or "en")
    )


def _score(values: Sequence[int | None], order: int) -> tuple:
    known = [value for value in values if value is not None]
    total = sum(known) if known else None
    return (total is None, -(total or 0), -len(known), order)


def _select_url_profiles(inventory: Sequence[Mapping[str, object]], index: dict, url_count: int) -> list[dict]:
    grouped: dict[str, dict] = {}
    for order, row in enumerate(inventory):
        url = str(row["url"])
        profile = grouped.setdefault(url, {"url": url, "order": order, "candidates": []})
        profile["candidates"].append(row)
    profiles: list[dict] = []
    for profile in grouped.values():
        best: tuple[tuple, int, Mapping[str, object], list[int | None]] | None = None
        for candidate_order, row in enumerate(profile["candidates"]):
            estimates = [
                index.get((normalize_query(str(row["keyword"])), market.location_code, market.language_code))
                for market in MARKETS
            ]
            rank = _score(estimates, int(profile["order"]) * 1000 + candidate_order)
            if best is None or rank < best[0]:
                best = (rank, candidate_order, row, estimates)
        assert best is not None
        profiles.append(
            {
                "url": profile["url"],
                "order": profile["order"],
                "is_map": profile["url"].startswith("/map/"),
                "target": best[2],
                "estimates": best[3],
                "rank": _score(best[3], int(profile["order"])),
                "candidate_order": best[1],
            }
        )
    ranked = sorted(profiles, key=lambda item: item["rank"])
    maps = [item for item in ranked if item["is_map"]]
    others = [item for item in ranked if not item["is_map"]]
    map_quota = min(6, len(maps), max(1, (3 * url_count + 2) // 5)) if maps else 0
    other_quota = min(len(others), max(0, url_count - map_quota))
    selected = [*maps[:map_quota], *others[:other_quota]]
    chosen = {item["url"] for item in selected}
    for item in ranked:
        if len(selected) >= url_count:
            break
        if item["url"] not in chosen:
            selected.append(item)
            chosen.add(item["url"])
    return sorted(selected, key=lambda item: item["rank"])


def choose_serps(
    inventory: Sequence[Mapping[str, object]],
    volume_rows: Iterable[Mapping[str, object]],
    limit: int = DEFAULT_SERP_LIMIT,
) -> list[dict]:
    """Choose diverse URL and market SERP targets using supplied estimates only."""
    if isinstance(limit, bool) or not isinstance(limit, int) or limit < 0:
        raise ValueError("limit must be a non-negative integer")
    if limit == 0:
        return []
    index = _volume_index(volume_rows)
    url_count = min(10, math.ceil(limit / 2), len({str(row["url"]) for row in inventory}))
    selected: list[dict] = []
    for profile in _select_url_profiles(inventory, index, url_count):
        target = profile["target"]
        for market, estimate in zip(MARKETS, profile["estimates"]):
            if len(selected) >= limit:
                return selected
            selected.append(
                {
                    "keyword": str(target["keyword"]),
                    "url": str(target["url"]),
                    "location_code": market.location_code,
                    "language_code": market.language_code,
                    "volume_estimate": estimate,
                }
            )
    return selected
