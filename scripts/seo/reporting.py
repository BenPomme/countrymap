"""Read public DataForSEO exports and produce conservative evidence reports.

No HTTP client, account lookup, analytics input, or paid call is implemented.
The parent collects public payloads and remains responsible for semantic SERP,
source-quality, and freshness review.
"""

from __future__ import annotations

from collections import defaultdict
import json
from pathlib import Path
from typing import Iterable, Mapping, Sequence
from urllib.parse import urlsplit

try:
    from .inventory import (
        DEFAULT_SERP_LIMIT,
        MARKETS,
        ORGANIC_DEPTH,
        _as_int,
        _clean_keyword,
        _first_present,
        _language_code,
        _market_code,
        choose_serps,
        normalize_query,
        normalize_volume_row,
        volume_estimate_for,
    )
except ImportError:
    from inventory import (  # type: ignore
        DEFAULT_SERP_LIMIT,
        MARKETS,
        ORGANIC_DEPTH,
        _as_int,
        _clean_keyword,
        _first_present,
        _language_code,
        _market_code,
        choose_serps,
        normalize_query,
        normalize_volume_row,
        volume_estimate_for,
    )


SITE_HOSTS = frozenset({"theworldtruth.com", "www.theworldtruth.com"})

LIMITATIONS = (
    "Google Ads monthly search volume is a provider estimate that updates monthly; variants may be grouped.",
    "Advertiser competition and cost per click are not SEO difficulty.",
    "Provider SERP data does not prove indexing or ranking.",
    "Organic positions beyond depth 10 are unknown and censored, not position zero.",
    "Source quality, freshness, and search intent interpretation require parent review.",
    "Weekly tracking checks the same selected keyword SERPs; it does not repeat monthly volume collection.",
)


def read_json_source(source: object) -> object:
    if isinstance(source, (Mapping, list)):
        return source
    if isinstance(source, Path):
        return json.loads(source.read_text(encoding="utf-8"))
    if isinstance(source, str):
        candidate = Path(source)
        if candidate.is_file():
            return json.loads(candidate.read_text(encoding="utf-8"))
        return json.loads(source)
    raise TypeError("source must be a JSON path, JSON string, mapping, or list")


def _context(node: Mapping[str, object], inherited: Mapping[str, object]) -> dict:
    context = dict(inherited)
    sources = [node]
    if isinstance(node.get("data"), Mapping):
        sources.append(node["data"])
    for source in sources:
        for key in ("location_code", "location_name", "language_code", "language"):
            if key in source and source[key] is not None:
                context[key] = source[key]
        if "datetime" in source and source["datetime"] is not None:
            context["collected_at"] = source["datetime"]
    return context


def _has_volume_field(row: Mapping[str, object]) -> bool:
    return any(key in row for key in ("search_volume", "monthly_search_volume", "volume"))


def _walk_ads(node: object, inherited: Mapping[str, object]) -> Iterable[dict]:
    if isinstance(node, list):
        for item in node:
            yield from _walk_ads(item, inherited)
        return
    if not isinstance(node, Mapping):
        return
    context = _context(node, inherited)
    keyword = node.get("keyword") or node.get("search_term")
    if isinstance(keyword, str) and _has_volume_field(node):
        merged = {**context, **node, "keyword": keyword}
        yield merged
    for key in ("tasks", "result", "keywords"):
        if key in node:
            yield from _walk_ads(node[key], context)


def extract_ads_volume_rows(payload: object) -> list[dict]:
    rows: list[dict] = []
    for raw_row in _walk_ads(payload, {}):
        row = normalize_volume_row(raw_row)
        if row is not None:
            rows.append(row)
    return rows


def read_ads_volume(source: object) -> list[dict]:
    return extract_ads_volume_rows(read_json_source(source))


def _provided_date(value: object) -> str | None:
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, str):
        return value.strip() or None
    if isinstance(value, (int, float)):
        return str(value)
    return None


def _organic_item(item: Mapping[str, object], depth: int) -> dict | None:
    item_type = item.get("type")
    if str(item_type or "").casefold() != "organic":
        return None
    raw_rank = _as_int(_first_present(item, ("rank_group", "rank_absolute")))
    if raw_rank is not None and raw_rank > depth:
        position, status = None, "censored_beyond_depth"
    elif raw_rank is not None and raw_rank > 0:
        position, status = raw_rank, "observed"
    else:
        position, status = None, "unavailable"
    url = item.get("url") if isinstance(item.get("url"), str) else None
    domain = item.get("domain") if isinstance(item.get("domain"), str) else None
    if domain is None and url:
        domain = urlsplit(url).hostname
    return {
        "position": position,
        "position_status": status,
        "domain": domain,
        "url": url,
        "title": item.get("title") if isinstance(item.get("title"), str) else None,
        "snippet": _first_present(item, ("description", "snippet")),
        "date": _provided_date(
            _first_present(item, ("date", "published_date", "last_updated", "datetime", "timestamp"))
        ),
    }


def _walk_organic(node: object, inherited: Mapping[str, object], depth: int) -> Iterable[dict]:
    if isinstance(node, list):
        for item in node:
            yield from _walk_organic(item, inherited, depth)
        return
    if not isinstance(node, Mapping):
        return
    context = _context(node, inherited)
    for key in ("collected_at", "date", "timestamp"):
        if node.get(key) is not None and context.get("collected_at") is None:
            context["collected_at"] = node[key]
    keyword = node.get("keyword")
    raw_items = node.get("items")
    if isinstance(keyword, str) and isinstance(raw_items, list):
        parsed_items = [
            parsed for item in raw_items if isinstance(item, Mapping)
            if (parsed := _organic_item(item, depth)) is not None
        ]
        yield {
            "keyword": _clean_keyword(keyword),
            "location_code": _market_code(_first_present(context, ("location_code", "location_name"))),
            "language_code": _language_code(_first_present(context, ("language_code", "language"))),
            "collection_date": _provided_date(context.get("collected_at")),
            "se_domain": node.get("se_domain") if isinstance(node.get("se_domain"), str) else None,
            "result_url": node.get("check_url") if isinstance(node.get("check_url"), str) else None,
            "items": parsed_items,
        }
    for key in ("tasks", "result"):
        if key in node:
            yield from _walk_organic(node[key], context, depth)


def extract_organic_results(payload: object, depth: int = ORGANIC_DEPTH) -> list[dict]:
    if isinstance(depth, bool) or not isinstance(depth, int) or depth < 1:
        raise ValueError("depth must be a positive integer")
    return list(_walk_organic(payload, {}, depth))


def read_organic_results(source: object, depth: int = ORGANIC_DEPTH) -> list[dict]:
    return extract_organic_results(read_json_source(source), depth=depth)


def _url_path_key(value: object) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    path = urlsplit(value.strip()).path or "/"
    path = path.rstrip("/") or "/"
    return path


def _host_key(value: object) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    text = value.strip().casefold()
    if "://" in text:
        text = urlsplit(text).hostname or ""
    else:
        text = text.split("/", 1)[0]
    if "@" in text:
        text = text.rsplit("@", 1)[-1]
    text = text.split(":", 1)[0].strip(".")
    return text or None


def _item_host(item: Mapping[str, object]) -> str | None:
    url = item.get("url")
    if isinstance(url, str):
        hostname = urlsplit(url).hostname
        if hostname:
            return _host_key(hostname)
    return _host_key(item.get("domain"))


def _is_target_item(item: Mapping[str, object], target_path: str | None) -> bool:
    return (
        target_path is not None
        and _url_path_key(item.get("url")) == target_path
        and _item_host(item) in SITE_HOSTS
    )


def _serp_index(rows: Sequence[Mapping[str, object]]) -> dict[tuple[str, int, str], Mapping[str, object]]:
    index: dict[tuple[str, int, str], Mapping[str, object]] = {}
    for row in rows:
        location = _as_int(row.get("location_code"))
        language = _language_code(row.get("language_code"))
        keyword = row.get("keyword")
        if location is None or language is None or not isinstance(keyword, str):
            continue
        index.setdefault((normalize_query(keyword), location, language), row)
    return index


def _target_serp(block: Mapping[str, object] | None, target_url: str, market: object) -> dict:
    if block is None:
        return {
            "market": market.name,
            "location_code": market.location_code,
            "language_code": market.language_code,
            "target_position": None,
            "target_position_status": "not_collected",
            "competitors": [],
            "censored_organic_count": 0,
            "collection_date": None,
        }
    target_key = _url_path_key(target_url)
    items = [item for item in block.get("items", []) if isinstance(item, Mapping)]
    matching = [item for item in items if _is_target_item(item, target_key)]
    if matching:
        observed = [item for item in matching if item.get("position") is not None]
        target_item = min(observed, key=lambda item: int(item["position"])) if observed else matching[0]
        target_position = target_item.get("position")
        target_status = str(target_item.get("position_status") or "unavailable")
    else:
        target_position = None
        target_status = "not_observed_in_depth"
    competitors = [
        {
            "position": item.get("position"),
            "domain": item.get("domain"),
            "url": item.get("url"),
            "title": item.get("title"),
            "snippet": item.get("snippet"),
            "date": item.get("date"),
        }
        for item in items
        if item.get("position") is not None and item not in matching
    ]
    competitors.sort(key=lambda item: int(item["position"]))
    return {
        "market": market.name,
        "location_code": market.location_code,
        "language_code": market.language_code,
        "target_position": target_position,
        "target_position_status": target_status,
        "competitors": competitors[:5],
        "censored_organic_count": sum(
            1 for item in items if item.get("position_status") == "censored_beyond_depth"
        ),
        "collection_date": block.get("collection_date"),
    }


def _provided_dates(blocks: Sequence[Mapping[str, object]]) -> list[str]:
    dates = {
        str(item["date"])
        for block in blocks
        for item in block.get("items", [])
        if isinstance(item, Mapping) and item.get("date")
    }
    return sorted(dates)


def _review_fields(blocks: Sequence[Mapping[str, object]]) -> dict:
    dates = _provided_dates(blocks)
    return {
        "serp_intent_review": "pending review",
        "source_quality": "pending review",
        "freshness": (
            "dates provided; freshness assessment pending review"
            if dates else "pending review"
        ),
        "provided_dates": dates,
    }


def _recommendations(url: str, keyword: str) -> list[str]:
    if url.startswith("/map/"):
        return [
            f"Add country search and an extremes control to the existing map so visitors can explore {keyword} in place.",
            "Keep the data source, vintage, and comparability note beside the first result, with links that preserve the selected metric.",
        ]
    if url in ("/truthle/", "/true-false/"):
        return [
            f"After each daily result, show the supporting country statistic and link the exact map for {keyword}.",
            "Show the puzzle date and next-puzzle countdown; do not imply archive play unless it exists.",
        ]
    if url == "/truthle-vs-worldle/":
        return [
            "Add a format picker that jumps between playable daily games and preserves the selected comparison.",
            "Date every format summary and mark third-party details as provisional.",
        ]
    if url == "/quiz/":
        return [
            "Let players filter by region or topic before starting the quiz.",
            "Link each answer explanation to the matching existing map.",
        ]
    if url == "/charts/":
        return [
            "Link chart controls to the matching map and preserve the selected metric and country filters.",
            "Add keyboard-accessible country highlighting and a source note beside the chart.",
        ]
    if url == "/discoveries/":
        return [
            "Preserve the selected metric pair in the URL and link both sides to their existing map pages.",
            "Add a reset-pair control and an accessible note about correlation limits.",
        ]
    return [
        "Add persistent metric search and a direct current daily game entry point without losing the map selection.",
        "Use map hover or click to reveal a compact sourced fact with links to the full map and country pages.",
    ]


def _coerce_volume_rows(volume_rows: object) -> list[dict]:
    if isinstance(volume_rows, Mapping):
        return extract_ads_volume_rows(volume_rows)
    return [dict(row) for row in volume_rows]  # type: ignore[arg-type]


def _coerce_organic_rows(organic_rows: object) -> list[dict]:
    if organic_rows is None:
        return []
    if isinstance(organic_rows, Mapping):
        return extract_organic_results(organic_rows)
    rows = [dict(row) for row in organic_rows]  # type: ignore[arg-type]
    raw_items = any(
        isinstance(row.get("items"), list)
        and any(isinstance(item, Mapping) and "position_status" not in item for item in row["items"])
        for row in rows
    )
    return extract_organic_results(rows) if raw_items else rows


def _report_dates(
    explicit_date: str | None,
    volume_rows: Sequence[Mapping[str, object]],
    organic_rows: Sequence[Mapping[str, object]],
) -> tuple[str | None, list[str]]:
    dates = {
        str(row["collected_at"])
        for row in volume_rows
        if row.get("collected_at")
    }
    dates.update(
        str(row["collection_date"])
        for row in organic_rows
        if row.get("collection_date")
    )
    ordered = sorted(dates)
    if explicit_date:
        return str(explicit_date), ordered
    return (ordered[0] if len(ordered) == 1 else None), ordered


def build_evidence_report(
    inventory: Sequence[Mapping[str, object]],
    volume_rows: object,
    organic_rows: object = None,
    *,
    limit: int = DEFAULT_SERP_LIMIT,
    depth: int = ORGANIC_DEPTH,
    collection_date: str | None = None,
) -> dict:
    """Build up to ten URL priorities with market metrics and provided SERP evidence."""
    volumes = _coerce_volume_rows(volume_rows)
    organics = _coerce_organic_rows(organic_rows)
    selected = choose_serps(inventory, volumes, limit=limit)
    serp_index = _serp_index(organics)
    inventory_lookup = {
        (normalize_query(str(row["keyword"])), str(row["url"])): row for row in inventory
    }
    grouped: dict[str, list[dict]] = defaultdict(list)
    for row in selected:
        grouped[str(row["url"])].append(row)
    resolved_date, collection_dates = _report_dates(collection_date, volumes, organics)
    priorities: list[dict] = []
    for url, selected_rows in grouped.items():
        target_keyword = str(selected_rows[0]["keyword"])
        source_row = inventory_lookup.get((normalize_query(target_keyword), url), {})
        market_metrics: list[dict] = []
        market_serps: list[dict] = []
        blocks: list[dict] = []
        for market in MARKETS:
            selected_market = next(
                (row for row in selected_rows if row.get("location_code") == market.location_code),
                None,
            )
            estimate = (
                selected_market.get("volume_estimate")
                if selected_market is not None
                else volume_estimate_for(volumes, target_keyword, market.location_code)
            )
            market_metrics.append(
                {
                    "market": market.name,
                    "location_code": market.location_code,
                    "language_code": market.language_code,
                    "volume_estimate": estimate,
                    "volume_basis": "Google Ads monthly estimate" if estimate is not None else None,
                }
            )
            block = serp_index.get(
                (normalize_query(target_keyword), market.location_code, market.language_code)
            )
            if block is not None:
                blocks.append(block)
            market_serps.append(_target_serp(block, url, market))
        review = _review_fields(blocks)
        has_volume = any(item["volume_estimate"] is not None for item in market_metrics)
        has_serp = any(item["target_position_status"] != "not_collected" for item in market_serps)
        priorities.append(
            {
                "priority": len(priorities) + 1,
                "url": url,
                "url_status": "existing",
                "topic": source_row.get("topic"),
                "intent": source_row.get("intent"),
                "target_keyword": target_keyword,
                "market_metrics": market_metrics,
                "serp_evidence": market_serps,
                "serp_intent_review": review["serp_intent_review"],
                "source_quality": review["source_quality"],
                "freshness": review["freshness"],
                "provided_dates": review["provided_dates"],
                "interactive_recommendations": _recommendations(url, target_keyword),
                "evidence_status": (
                    "partial evidence; interpretation pending review"
                    if has_volume or has_serp
                    else "pending review"
                ),
            }
        )
    return {
        "schema_version": 1,
        "collection": {
            "date": resolved_date,
            "collection_dates": collection_dates,
            "locations": [
                {
                    "market": market.name,
                    "location_code": market.location_code,
                    "language_code": market.language_code,
                }
                for market in MARKETS
            ],
            "language_code": "en",
            "method": "Parent-supplied public DataForSEO exports; these helpers make no collection call.",
        },
        "selected_serps": selected,
        "priorities": priorities,
        "weekly_tracking": {
            "instruction": "Repeat organic SERP checks weekly for the same selected keyword and market pairs; keep monthly Ads estimates fixed unless a deliberate monthly refresh is approved.",
            "tracked_pairs": len(selected),
        },
        "limitations": list(LIMITATIONS),
    }


def _format_volume(value: object) -> str:
    return "Not provided" if value is None else str(value)


def _format_position(status: str, position: object) -> str:
    if status == "observed" and position is not None:
        return f"Observed at position {position}"
    return {
        "not_collected": "Pending review: no organic rows supplied",
        "not_observed_in_depth": "Not observed in top 10; rank unknown",
        "censored_beyond_depth": "Unknown and censored beyond depth 10",
        "unavailable": "Pending review: position not supplied",
    }.get(status, "Pending review")


def _md_cell(value: object) -> str:
    if value is None:
        return "Not provided"
    return " ".join(str(value).replace("|", "\\|").split())


def render_evidence_markdown(report: Mapping[str, object]) -> str:
    """Render a human-readable evidence report without upgrading unknowns."""
    collection = report.get("collection", {})
    priorities = report.get("priorities", [])
    lines = [
        "# DataForSEO inventory evidence",
        "",
        "All URLs below already exist. Missing estimates remain unknown, not zero.",
        "",
        "## Collection",
        "",
        f"- Date: {_md_cell(collection.get('date') if isinstance(collection, Mapping) else None)}",
    ]
    if isinstance(collection, Mapping):
        for market in collection.get("locations", []):
            if isinstance(market, Mapping):
                lines.append(
                    f"- {market.get('market')}: location {market.get('location_code')}, language {market.get('language_code')}"
                )
        lines.extend(
            [
                f"- Method: {collection.get('method')}",
                f"- Collection dates supplied: {', '.join(collection.get('collection_dates', [])) or 'Not provided'}",
            ]
        )
    lines.extend(["", "## Priorities", "", "| # | Existing URL | Target query | US volume | UK volume | Evidence |", "|---|---|---|---|---|---|"])
    for priority in priorities:
        if not isinstance(priority, Mapping):
            continue
        metrics = {
            item.get("location_code"): item.get("volume_estimate")
            for item in priority.get("market_metrics", [])
            if isinstance(item, Mapping)
        }
        lines.append(
            f"| {priority.get('priority')} | `{priority.get('url')}` | {_md_cell(priority.get('target_keyword'))} | {_format_volume(metrics.get(2840))} | {_format_volume(metrics.get(2826))} | {_md_cell(priority.get('evidence_status'))} |"
        )
    for priority in priorities:
        if not isinstance(priority, Mapping):
            continue
        lines.extend(
            [
                "",
                f"## {priority.get('priority')}. `{priority.get('url')}`",
                "",
                f"- Target query: {_md_cell(priority.get('target_keyword'))}",
                f"- Intent: {_md_cell(priority.get('intent'))}",
                f"- URL status: existing",
            ]
        )
        for metric in priority.get("market_metrics", []):
            if isinstance(metric, Mapping):
                lines.append(
                    f"- {metric.get('market')} metric: volume estimate {_format_volume(metric.get('volume_estimate'))}; location {metric.get('location_code')}; language {metric.get('language_code')}"
                )
        for serp in priority.get("serp_evidence", []):
            if not isinstance(serp, Mapping):
                continue
            lines.append(
                f"- {serp.get('market')} SERP: {_format_position(str(serp.get('target_position_status')), serp.get('target_position'))}"
            )
            competitors = serp.get("competitors", [])
            if competitors:
                lines.append("")
                lines.append("| Position | Domain | Title | Snippet | Date |")
                lines.append("|---|---|---|---|---|")
                for item in competitors:
                    if isinstance(item, Mapping):
                        lines.append(
                            f"| {_md_cell(item.get('position'))} | {_md_cell(item.get('domain'))} | {_md_cell(item.get('title'))} | {_md_cell(item.get('snippet'))} | {_md_cell(item.get('date'))} |"
                        )
        lines.extend(
            [
                f"- SERP intent review: {_md_cell(priority.get('serp_intent_review'))}",
                f"- Source quality: {_md_cell(priority.get('source_quality'))}",
                f"- Freshness: {_md_cell(priority.get('freshness'))}",
                "",
                "Interactive recommendations:",
            ]
        )
        lines.extend(f"- {item}" for item in priority.get("interactive_recommendations", []))
    lines.extend(["", "## Weekly tracking", ""])
    weekly = report.get("weekly_tracking", {})
    if isinstance(weekly, Mapping):
        lines.append(str(weekly.get("instruction")))
    lines.extend(["", "## Limitations", ""])
    lines.extend(f"- {item}" for item in report.get("limitations", []))
    return "\n".join(lines) + "\n"


def save_evidence_report(report: Mapping[str, object], json_path: Path, markdown_path: Path | None = None) -> None:
    Path(json_path).write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if markdown_path is not None:
        Path(markdown_path).write_text(render_evidence_markdown(report), encoding="utf-8")
