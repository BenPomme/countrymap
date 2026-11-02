"""Small guarded CLI for the one-state DataForSEO evidence pilot.

The CLI is dry by default.  Paid collection requires both ``--execute`` and a
persistent ``--state-dir``.  All requests share that state directory's single
USD5 ledger and cache.  Inventory and report shaping are delegated to the
root-integrated ``inventory.py`` and ``reporting.py`` modules.
"""

from __future__ import annotations

import argparse
import copy
import datetime as dt
import hashlib
import importlib
import json
import os
import sys
import tempfile
from decimal import Decimal
from pathlib import Path
from typing import Any, Mapping, Sequence
from zoneinfo import ZoneInfo

try:
    from . import client as seo_client
except ImportError:  # Script execution from scripts/seo.
    import client as seo_client  # type: ignore


MADRID = ZoneInfo("Europe/Madrid")
ADS_ENDPOINT = seo_client.GOOGLE_ADS_ENDPOINT
SERP_ENDPOINT = seo_client.SERP_ENDPOINT
MARKETS = (
    {"market": "United States", "location_code": 2840, "language_code": "en"},
    {"market": "United Kingdom", "location_code": 2826, "language_code": "en"},
)
MAX_MARKET_COMBINATIONS = 500
INITIAL_SERP_LIMIT = 20
WEEKLY_SERP_LIMIT = 20
SERP_DEPTH = 10
WEEKLY_DATES = (
    dt.date(2026, 11, 9),
    dt.date(2026, 11, 16),
    dt.date(2026, 11, 23),
    dt.date(2026, 11, 30),
)
PILOT_END_DATE = dt.date(2026, 11, 30)
QUOTE_INITIAL_ADS = Decimal("0.18")
QUOTE_INITIAL_SERP = Decimal("0.04")
QUOTE_WEEKLY_SERP = Decimal("0.16")


class PilotError(ValueError):
    """A safe, actionable CLI contract failure."""


def _today_madrid() -> dt.date:
    return dt.datetime.now(MADRID).date()


def _as_float(value: Decimal) -> float:
    return float(value.quantize(Decimal("0.001")))


def budget_quote() -> dict[str, Any]:
    """Return the fixed-price planning estimate, never a price guarantee."""
    initial_total = QUOTE_INITIAL_ADS + QUOTE_INITIAL_SERP
    pilot_total = initial_total + QUOTE_WEEKLY_SERP
    headroom = seo_client.PILOT_BUDGET_USD - pilot_total
    return {
        "schema_version": 1,
        "kind": "pilot_budget_quote",
        "currency": "USD",
        "line_items": [
            {
                "item": "initial Google Ads volume",
                "requests": 2,
                "unit_price_usd": _as_float(seo_client.ADS_PRICE_USD),
                "estimated_cost_usd": _as_float(QUOTE_INITIAL_ADS),
            },
            {
                "item": "initial organic SERP depth 10",
                "requests": 20,
                "unit_price_usd": _as_float(seo_client.SERP_PRICE_USD),
                "estimated_cost_usd": _as_float(QUOTE_INITIAL_SERP),
            },
        ],
        "initial_estimated_total_usd": _as_float(initial_total),
        "weekly": {
            "dates": [value.isoformat() for value in WEEKLY_DATES],
            "requests": 80,
            "unit_price_usd": _as_float(seo_client.SERP_PRICE_USD),
            "estimated_cost_usd": _as_float(QUOTE_WEEKLY_SERP),
        },
        "pilot_estimated_total_usd": _as_float(pilot_total),
        "budget_usd": _as_float(seo_client.PILOT_BUDGET_USD),
        "headroom_estimate_usd": _as_float(headroom),
        "estimate_only": True,
        "difficulty": {
            "status": "unknown",
            "note": "No SEO difficulty is purchased or inferred from advertiser competition.",
        },
        "notes": [
            "Prices are the reviewed fixed manifest values and may change before weekly collection.",
            "A parent or weekly supervisor must reverify prices; this CLI never renews a stale manifest.",
            "Actual provider costs are stamped on collection artifacts and in the shared ledger.",
        ],
    }


def _parse_date(value: str) -> dt.date:
    try:
        return dt.date.fromisoformat(value)
    except (TypeError, ValueError) as exc:
        raise PilotError("date must use YYYY-MM-DD") from exc


def _validate_paid_date(value: dt.date, today: dt.date, *, weekly: bool) -> None:
    if today > PILOT_END_DATE or value > PILOT_END_DATE:
        raise PilotError("paid work is closed after 2026-11-30")
    if value > today:
        raise PilotError("future runs are not allowed")
    if weekly and value not in WEEKLY_DATES:
        raise PilotError("weekly runs are limited to 2026-11-09, 16, 23 and 30")


def _state_paths(state_dir: str | os.PathLike[str]) -> dict[str, Path]:
    root = Path(state_dir)
    return {
        "root": root,
        "cache": root / "cache",
        "ledger": root / "ledger.json",
        "volumes": root / "ads_volumes.json",
        "initial_serps": root / "initial_serps.json",
        "selected": root / "selected_serps.json",
        "weekly": root / "weekly",
        "report_json": root / "evidence_report.json",
        "report_md": root / "evidence_report.md",
    }


def _atomic_write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            handle.write(text)
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(temporary, 0o600)
        os.replace(temporary, path)
        directory = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    except BaseException:
        if os.path.exists(temporary):
            os.unlink(temporary)
        raise


def _atomic_write_json(path: Path, value: object) -> None:
    text = json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    _atomic_write_text(path, text)


def _read_json(path: Path, label: str) -> object | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise PilotError(f"{label} is not readable JSON") from exc


def _finite_decimal(value: object) -> Decimal | None:
    if isinstance(value, bool) or not isinstance(value, (int, float, str)):
        return None
    try:
        number = Decimal(str(value))
    except Exception:
        return None
    return number if number.is_finite() else None


def _ledger_summary(path: Path) -> dict[str, Any]:
    value = _read_json(path, "pilot ledger")
    if value is None:
        return {
            "currency": "USD",
            "limit_usd": _as_float(seo_client.PILOT_BUDGET_USD),
            "charged_usd": 0.0,
            "unresolved_reserved_usd": 0.0,
            "available_usd": _as_float(seo_client.PILOT_BUDGET_USD),
            "entries": 0,
        }
    if not isinstance(value, dict) or not isinstance(value.get("entries"), dict):
        raise PilotError("pilot ledger shape is invalid")
    charged = Decimal("0")
    unresolved = Decimal("0")
    for entry in value["entries"].values():
        if not isinstance(entry, dict):
            raise PilotError("pilot ledger has an invalid entry")
        status = entry.get("status")
        field = "charged_usd" if status == "settled" else "reserved_usd"
        amount = _finite_decimal(entry.get(field))
        if status not in {"pending", "unknown", "settled"} or amount is None or amount < 0:
            raise PilotError("pilot ledger has an invalid entry")
        if status == "settled":
            charged += amount
        else:
            unresolved += amount
    available = seo_client.PILOT_BUDGET_USD - charged - unresolved
    return {
        "currency": "USD",
        "limit_usd": _as_float(seo_client.PILOT_BUDGET_USD),
        "charged_usd": _as_float(charged),
        "unresolved_reserved_usd": _as_float(unresolved),
        "available_usd": _as_float(max(Decimal("0"), available)),
        "entries": len(value["entries"]),
    }


def _load_sibling(name: str, injected: object | None) -> Any:
    if injected is not None:
        return injected
    try:
        return importlib.import_module(f".{name}", __package__)
    except (ImportError, TypeError):
        return importlib.import_module(name)


def _canonical_sha256(value: object) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _build_inventory(repo_root: Path, inventory_module: Any) -> list[dict]:
    inventory = inventory_module.build_inventory(repo_root)
    if not isinstance(inventory, list) or not inventory:
        raise PilotError("inventory must be a nonempty list")
    combinations = len(inventory) * len(MARKETS)
    if combinations > MAX_MARKET_COMBINATIONS:
        raise PilotError("inventory exceeds 500 query-market combinations")
    seen: set[tuple[str, str]] = set()
    for row in inventory:
        if not isinstance(row, dict):
            raise PilotError("inventory rows must be objects")
        keyword = row.get("keyword")
        url = row.get("url")
        if not isinstance(keyword, str) or not keyword.strip():
            raise PilotError("every inventory row needs a keyword")
        if not isinstance(url, str) or not url.startswith("/"):
            raise PilotError("every inventory row needs an existing local URL")
        identity = (" ".join(keyword.casefold().split()), url)
        if identity in seen:
            raise PilotError("inventory contains duplicate keyword and URL pairs")
        seen.add(identity)
    return copy.deepcopy(inventory)


def _ads_task(keywords: Sequence[str], market: Mapping[str, object]) -> dict:
    return {
        "keywords": list(keywords),
        "location_code": market["location_code"],
        "language_code": market["language_code"],
    }


def _serp_task(selection: Mapping[str, object]) -> dict:
    return {
        "keyword": selection["keyword"],
        "location_code": selection["location_code"],
        "language_code": selection["language_code"],
        "device": seo_client.SERP_DEVICE,
        "os": seo_client.SERP_OS,
        "depth": SERP_DEPTH,
    }


def _clean_selection_rows(selected: object) -> list[dict]:
    if not isinstance(selected, list) or not 1 <= len(selected) <= INITIAL_SERP_LIMIT:
        raise PilotError("frozen SERP selection must contain 1 to 20 entries")
    seen: set[tuple[str, int, str]] = set()
    clean: list[dict] = []
    for row in selected:
        if not isinstance(row, dict):
            raise PilotError("frozen SERP selection contains a non-object")
        keyword = row.get("keyword")
        location = row.get("location_code")
        language = row.get("language_code")
        if not isinstance(keyword, str) or not keyword.strip():
            raise PilotError("frozen SERP selection has an invalid keyword")
        if location not in {2840, 2826} or language != "en":
            raise PilotError("frozen SERP selection has an unapproved market")
        identity = (" ".join(keyword.casefold().split()), location, language)
        if identity in seen:
            raise PilotError("frozen SERP selection contains duplicates")
        seen.add(identity)
        clean.append(copy.deepcopy(row))
    return clean


def _load_selection(path: Path) -> list[dict]:
    value = _read_json(path, "frozen SERP selection")
    if value is None:
        raise PilotError("frozen SERP selection is absent; run plan-serps first")
    if not isinstance(value, dict) or value.get("schema_version") != 1:
        raise PilotError("frozen SERP selection is malformed")
    selected = _clean_selection_rows(value.get("selected_serps"))
    if value.get("selection_sha256") != _selection_digest(selected):
        raise PilotError("frozen SERP selection failed its integrity check")
    return selected


def _selection_digest(selected: Sequence[Mapping[str, object]]) -> str:
    return _canonical_sha256({"selected_serps": list(selected)})[:16]


def _provider_status(error: BaseException) -> dict[str, object] | None:
    details = getattr(error, "status_details", None)
    return copy.deepcopy(details) if isinstance(details, dict) else None


def _error_record(endpoint: str, error: BaseException, market: str | None = None) -> dict:
    record: dict[str, Any] = {
        "endpoint": endpoint,
        "category": type(error).__name__,
        "message": " ".join(str(error).split())[:200],
    }
    if market is not None:
        record["market"] = market
    details = _provider_status(error)
    if details is not None:
        record["provider_status"] = details
    return record


def _collection_status(errors: Sequence[Mapping[str, object]], rows: Sequence[object]) -> str:
    if errors and rows:
        return "partial"
    if errors:
        return "unavailable"
    if not rows:
        return "no_results"
    return "complete"


def _requested_date(args: argparse.Namespace, today: dt.date, *, weekly: bool = False) -> dt.date:
    value = _parse_date(args.date) if getattr(args, "date", None) else today
    _validate_paid_date(value, today, weekly=weekly)
    return value


def _require_state_dir(args: argparse.Namespace) -> dict[str, Path]:
    if not getattr(args, "state_dir", None):
        raise PilotError("--state-dir is required for this mode")
    return _state_paths(args.state_dir)


def _charge_delta(before: Mapping[str, object], after: Mapping[str, object]) -> Decimal:
    start = _finite_decimal(before.get("charged_usd")) or Decimal("0")
    end = _finite_decimal(after.get("charged_usd")) or Decimal("0")
    return max(Decimal("0"), end - start)


def _collect_volumes(
    args: argparse.Namespace,
    inventory: Sequence[Mapping[str, object]],
    inventory_module: Any,
    reporting_module: Any,
    transport: object | None,
    today: dt.date,
) -> dict[str, Any]:
    collection_date = _requested_date(args, today)
    combinations = len(inventory) * len(MARKETS)
    if not getattr(args, "execute", False):
        return {
            "mode": "collect-volumes",
            "status": "dry_run",
            "execute": False,
            "collection_date": collection_date.isoformat(),
            "query_count": len(inventory),
            "query_market_combinations": combinations,
            "requests": len(MARKETS),
            "markets": copy.deepcopy(MARKETS),
            "estimated_cost_usd": _as_float(seo_client.ADS_PRICE_USD * len(MARKETS)),
            "network_requests": 0,
            "note": "Pass --execute with --state-dir to collect volumes.",
        }
    paths = _require_state_dir(args)
    existing = _read_json(paths["volumes"], "volume artifact")
    if existing is not None:
        if not isinstance(existing, dict):
            raise PilotError("volume artifact is malformed")
        return {**copy.deepcopy(existing), "mode": "collect-volumes", "run_status": "reused"}

    before = _ledger_summary(paths["ledger"])
    client = seo_client.DataForSeoClient(
        paths["cache"], paths["ledger"], transport=transport
    )
    requests: list[dict] = []
    errors: list[dict] = []
    responses: list[dict] = []
    keywords = [str(row["keyword"]) for row in inventory]
    for market in MARKETS:
        task = _ads_task(keywords, market)
        cache_key = f"ads-v1:{collection_date.isoformat()}:{market['location_code']}:en"
        try:
            result = client.request(ADS_ENDPOINT, task, cache_key)
        except seo_client.SeoClientError as error:
            errors.append(_error_record(ADS_ENDPOINT, error, str(market["market"])))
            requests.append(
                {
                    "endpoint": ADS_ENDPOINT,
                    "market": market["market"],
                    "location_code": market["location_code"],
                    "language_code": "en",
                    "cost_usd": None,
                    "cached": False,
                }
            )
            continue
        responses.append(result["response"])
        requests.append(
            {
                "endpoint": ADS_ENDPOINT,
                "market": market["market"],
                "location_code": market["location_code"],
                "language_code": "en",
                "cost_usd": result["cost"],
                "cached": result["cached"],
            }
        )

    rows = reporting_module.read_ads_volume(responses) if responses else []
    after = _ledger_summary(paths["ledger"])
    artifact = {
        "schema_version": 1,
        "kind": "initial_ads_volume",
        "mode": "collect-volumes",
        "status": _collection_status(errors, rows),
        "collection_date": collection_date.isoformat(),
        "query_count": len(inventory),
        "query_market_combinations": combinations,
        "markets": copy.deepcopy(MARKETS),
        "language_code": "en",
        "requests": requests,
        "rows": rows,
        "errors": errors,
        "actual_charge_usd": _as_float(_charge_delta(before, after)),
        "ledger": after,
        "notes": [
            "Missing search volume is unknown, not zero.",
            "Google Ads estimates update monthly and do not measure SEO difficulty.",
        ],
    }
    _atomic_write_json(paths["volumes"], artifact)
    return {**artifact, "artifact_path": str(paths["volumes"]), "run_status": "executed"}


def _plan_serps(
    args: argparse.Namespace,
    inventory: Sequence[Mapping[str, object]],
    inventory_module: Any,
    today: dt.date,
) -> dict[str, Any]:
    paths = _require_state_dir(args)
    if paths["selected"].exists():
        selected = _load_selection(paths["selected"])
        return {
            "mode": "plan-serps",
            "status": "reused_immutable",
            "selected_count": len(selected),
            "selected_serps": selected,
            "selection_sha256": _selection_digest(selected),
            "selected_path": str(paths["selected"]),
            "network_requests": 0,
        }

    volume_artifact = _read_json(paths["volumes"], "volume artifact")
    volume_rows: object = []
    if volume_artifact is not None:
        if not isinstance(volume_artifact, dict):
            raise PilotError("volume artifact is malformed")
        volume_rows = volume_artifact.get("rows", [])
    if not isinstance(volume_rows, (list, dict)):
        raise PilotError("volume rows are malformed")
    selected = inventory_module.choose_serps(
        inventory, volume_rows, limit=INITIAL_SERP_LIMIT
    )
    clean = _clean_selection_rows(selected)
    artifact = {
        "schema_version": 1,
        "kind": "frozen_serp_selection",
        "frozen": True,
        "planned_on": today.isoformat(),
        "limit": INITIAL_SERP_LIMIT,
        "selected_serps": clean,
        "selection_sha256": _selection_digest(clean),
        "markets": copy.deepcopy(MARKETS),
        "volume_estimates_present": volume_artifact is not None,
        "notes": [
            "This selection is immutable for all weekly checks.",
            "Unknown volume estimates remain unknown and do not imply zero demand.",
            "No SEO difficulty score is assigned.",
        ],
    }
    _atomic_write_json(paths["selected"], artifact)
    return {
        **artifact,
        "mode": "plan-serps",
        "status": "planned",
        "selected_count": len(clean),
        "selected_path": str(paths["selected"]),
        "network_requests": 0,
    }


def _collect_serps(
    args: argparse.Namespace,
    selected: Sequence[Mapping[str, object]],
    reporting_module: Any,
    transport: object | None,
    today: dt.date,
    *,
    weekly: bool,
) -> dict[str, Any]:
    collection_date = _requested_date(args, today, weekly=weekly)
    mode = "weekly" if weekly else "collect-serps"
    paths = _require_state_dir(args)
    output_path = (
        paths["weekly"] / f"{collection_date.isoformat()}.json"
        if weekly
        else paths["initial_serps"]
    )
    if not getattr(args, "execute", False):
        return {
            "mode": mode,
            "status": "dry_run",
            "execute": False,
            "collection_date": collection_date.isoformat(),
            "selected_count": len(selected),
            "requests": len(selected),
            "depth": SERP_DEPTH,
            "markets": copy.deepcopy(MARKETS),
            "estimated_cost_usd": _as_float(
                seo_client.SERP_PRICE_USD * len(selected)
            ),
            "monthly_volume_requests": 0,
            "network_requests": 0,
            "note": "Pass --execute with --state-dir to collect these SERPs.",
        }
    existing = _read_json(output_path, "SERP artifact")
    if existing is not None:
        if not isinstance(existing, dict):
            raise PilotError("SERP artifact is malformed")
        return {**copy.deepcopy(existing), "mode": mode, "run_status": "reused"}

    digest = _selection_digest(selected)
    before = _ledger_summary(paths["ledger"])
    client = seo_client.DataForSeoClient(
        paths["cache"], paths["ledger"], transport=transport
    )
    requests: list[dict] = []
    errors: list[dict] = []
    responses: list[dict] = []
    for selection in selected:
        task = _serp_task(selection)
        keyword_key = "_".join(str(selection["keyword"]).casefold().split())[:80]
        if weekly:
            cache_key = (
                f"serp-weekly-v1:{collection_date.isoformat()}:{digest}:"
                f"{keyword_key}:{selection['location_code']}:en"
            )
        else:
            cache_key = (
                f"serp-initial-v1:{digest}:{keyword_key}:"
                f"{selection['location_code']}:en"
            )
        record = {
            "endpoint": SERP_ENDPOINT,
            "keyword": selection["keyword"],
            "location_code": selection["location_code"],
            "language_code": selection["language_code"],
            "depth": SERP_DEPTH,
        }
        try:
            result = client.request(SERP_ENDPOINT, task, cache_key)
        except seo_client.SeoClientError as error:
            errors.append(_error_record(SERP_ENDPOINT, error, str(selection["keyword"])))
            requests.append({**record, "cost_usd": None, "cached": False})
            continue
        responses.append(result["response"])
        requests.append(
            {**record, "cost_usd": result["cost"], "cached": result["cached"]}
        )

    rows = (
        reporting_module.read_organic_results(responses, depth=SERP_DEPTH)
        if responses
        else []
    )
    after = _ledger_summary(paths["ledger"])
    artifact = {
        "schema_version": 1,
        "kind": "weekly_organic_serps" if weekly else "initial_organic_serps",
        "mode": mode,
        "status": _collection_status(errors, rows),
        "collection_date": collection_date.isoformat(),
        "selected_count": len(selected),
        "selection_sha256": digest,
        "depth": SERP_DEPTH,
        "device": seo_client.SERP_DEVICE,
        "os": seo_client.SERP_OS,
        "markets": copy.deepcopy(MARKETS),
        "requests": requests,
        "rows": rows,
        "errors": errors,
        "monthly_volume_requests": 0,
        "actual_charge_usd": _as_float(_charge_delta(before, after)),
        "ledger": after,
        "notes": [
            "Positions outside depth 10 are unknown, not position zero.",
            "Weekly mode reuses the frozen selection and does not repeat monthly volume collection.",
        ],
    }
    _atomic_write_json(output_path, artifact)
    return {**artifact, "artifact_path": str(output_path), "run_status": "executed"}


def _weekly_summaries(paths: Mapping[str, Path]) -> list[dict]:
    directory = paths["weekly"]
    if not directory.exists():
        return []
    summaries: list[dict] = []
    for path in sorted(directory.glob("*.json")):
        value = _read_json(path, "weekly artifact")
        if not isinstance(value, dict):
            raise PilotError("weekly artifact is malformed")
        summaries.append(
            {
                "collection_date": value.get("collection_date"),
                "status": value.get("status"),
                "requests": len(value.get("requests", [])),
                "rows": len(value.get("rows", [])),
                "errors": len(value.get("errors", [])),
                "actual_charge_usd": value.get("actual_charge_usd"),
                "artifact": str(path),
            }
        )
    return summaries


def _frozen_inventory(
    inventory: Sequence[Mapping[str, object]], selected: Sequence[Mapping[str, object]]
) -> list[dict]:
    lookup = {
        (" ".join(str(row["keyword"]).casefold().split()), str(row["url"])): dict(row)
        for row in inventory
    }
    frozen: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for row in selected:
        key = (" ".join(str(row["keyword"]).casefold().split()), str(row.get("url", "")))
        if key in seen:
            continue
        source = lookup.get(key)
        if source is None:
            raise PilotError("frozen SERP selection is absent from the current inventory")
        seen.add(key)
        frozen.append(copy.deepcopy(source))
    return frozen


def _build_report(
    args: argparse.Namespace,
    inventory: Sequence[Mapping[str, object]],
    reporting_module: Any,
    today: dt.date,
) -> dict[str, Any]:
    paths = _require_state_dir(args)
    selected_value = _read_json(paths["selected"], "frozen SERP selection")
    selected = (
        _load_selection(paths["selected"]) if selected_value is not None else None
    )
    volume_artifact = _read_json(paths["volumes"], "volume artifact")
    serp_artifact = _read_json(paths["initial_serps"], "SERP artifact")
    for label, value in (
        ("volume artifact", volume_artifact),
        ("SERP artifact", serp_artifact),
    ):
        if value is not None and not isinstance(value, dict):
            raise PilotError(f"{label} is malformed")

    volume_rows_raw = volume_artifact.get("rows", []) if volume_artifact else []
    serp_rows_raw = serp_artifact.get("rows", []) if serp_artifact else []
    if not isinstance(volume_rows_raw, list) or not isinstance(serp_rows_raw, list):
        raise PilotError("collection artifacts contain malformed rows")
    volumes = reporting_module.read_ads_volume(volume_rows_raw)
    dates = {
        str(value)
        for value in (
            volume_artifact.get("collection_date") if volume_artifact else None,
            serp_artifact.get("collection_date") if serp_artifact else None,
        )
        if value
    }
    collection_date = next(iter(dates)) if len(dates) == 1 else None
    report_inventory = (
        _frozen_inventory(inventory, selected) if selected is not None else list(inventory)
    )
    report = reporting_module.build_evidence_report(
        report_inventory,
        volumes,
        serp_rows_raw,
        limit=INITIAL_SERP_LIMIT,
        depth=SERP_DEPTH,
        collection_date=collection_date,
    )
    if not isinstance(report, dict):
        raise PilotError("reporting module returned an invalid report")

    availability = {
        "ads_volume": {
            "status": volume_artifact.get("status") if volume_artifact else "not_collected",
            "errors": copy.deepcopy(volume_artifact.get("errors", []))
            if volume_artifact
            else [],
        },
        "organic_serps": {
            "status": serp_artifact.get("status") if serp_artifact else "not_collected",
            "errors": copy.deepcopy(serp_artifact.get("errors", []))
            if serp_artifact
            else [],
        },
    }
    report["pilot"] = {
        "state_dir": str(paths["root"]),
        "generated_on": today.isoformat(),
        "frozen_selection": selected is not None,
        "selected_count": len(selected) if selected is not None else None,
        "collection_dates": sorted(dates),
        "availability": availability,
        "ledger": _ledger_summary(paths["ledger"]),
        "weekly_runs": _weekly_summaries(paths),
        "quote": budget_quote(),
        "difficulty": {"status": "unknown", "value": None},
    }
    if not volume_artifact:
        report["pilot"]["note_volume"] = "Volume data was not collected; missing values are unknown, not zero."
    if not serp_artifact:
        report["pilot"]["note_serp"] = "Organic SERP data was not collected; positions are unknown, not zero."
    if availability["ads_volume"]["errors"] or availability["organic_serps"]["errors"]:
        report["pilot"]["note_errors"] = "Some endpoints or results were unavailable; see availability and collection errors."
    notes = [
        "Price manifests require parent or weekly-supervisor reverification before renewal.",
        "Unavailable endpoints and results are reported explicitly and are not filled with estimates.",
    ]
    report["limitations"] = list(report.get("limitations", [])) + notes
    return _save_report(report, paths, reporting_module)


def _save_report(
    report: Mapping[str, object], paths: Mapping[str, Path], reporting_module: Any
) -> dict[str, Any]:
    root = paths["root"]
    root.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".report.", dir=root) as temporary:
        temporary_json = Path(temporary) / "report.json"
        temporary_markdown = Path(temporary) / "report.md"
        reporting_module.save_evidence_report(
            report, temporary_json, temporary_markdown
        )
        _atomic_write_text(paths["report_json"], temporary_json.read_text(encoding="utf-8"))
        _atomic_write_text(paths["report_md"], temporary_markdown.read_text(encoding="utf-8"))
    output = copy.deepcopy(dict(report))
    output["report_json"] = str(paths["report_json"])
    output["report_markdown"] = str(paths["report_md"])
    output["run_status"] = "saved"
    return output


def _default_repo_root() -> str:
    return str(Path(__file__).resolve().parents[2])


def _add_state_options(parser: argparse.ArgumentParser, *, collection: bool) -> None:
    parser.add_argument("--state-dir", required=True)
    if collection:
        parser.add_argument("--execute", action="store_true")
        parser.add_argument("--date")
        parser.add_argument("--repo-root", default=_default_repo_root())


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Guarded DataForSEO evidence pilot")
    modes = parser.add_subparsers(dest="mode", required=True)

    inventory = modes.add_parser("inventory", help="Build the local keyword inventory")
    inventory.add_argument("--repo-root", default=_default_repo_root())
    modes.add_parser("quote", help="Show the fixed-price planning quote")

    volumes = modes.add_parser("collect-volumes", help="Collect initial Google Ads volumes")
    _add_state_options(volumes, collection=True)

    plan = modes.add_parser("plan-serps", help="Freeze up to 20 initial SERP targets")
    plan.add_argument("--state-dir", required=True)
    plan.add_argument("--repo-root", default=_default_repo_root())

    initial = modes.add_parser("collect-serps", help="Collect the frozen initial SERPs")
    _add_state_options(initial, collection=True)

    report = modes.add_parser("report", help="Build the evidence report")
    report.add_argument("--state-dir", required=True)
    report.add_argument("--repo-root", default=_default_repo_root())

    weekly = modes.add_parser("weekly", help="Collect one allowed weekly SERP run")
    _add_state_options(weekly, collection=True)
    return parser


def run(
    argv: Sequence[str] | None = None,
    *,
    transport: object | None = None,
    today: dt.date | str | None = None,
    inventory_module: object | None = None,
    reporting_module: object | None = None,
) -> dict[str, Any]:
    args = _build_parser().parse_args(argv)
    run_date = _parse_date(today) if isinstance(today, str) else (today or _today_madrid())
    if not isinstance(run_date, dt.date):
        raise PilotError("today must be a date")
    repo_root = Path(getattr(args, "repo_root", _default_repo_root())).resolve()

    if args.mode == "quote":
        seo_client._load_pricing()
        return budget_quote()

    if args.mode == "inventory":
        inventory_module = _load_sibling("inventory", inventory_module)
        inventory = _build_inventory(repo_root, inventory_module)
        totals = getattr(inventory_module, "inventory_totals", None)
        return {
            "mode": "inventory",
            "status": "local_only",
            "network_requests": 0,
            "totals": totals(inventory) if callable(totals) else {"candidate_queries": len(inventory)},
            "inventory": inventory,
        }

    if args.mode == "collect-volumes":
        inventory_module = _load_sibling("inventory", inventory_module)
        reporting_module = _load_sibling("reporting", reporting_module)
        inventory = _build_inventory(repo_root, inventory_module)
        return _collect_volumes(
            args, inventory, inventory_module, reporting_module, transport, run_date
        )

    if args.mode == "plan-serps":
        inventory_module = _load_sibling("inventory", inventory_module)
        inventory = _build_inventory(repo_root, inventory_module)
        return _plan_serps(args, inventory, inventory_module, run_date)

    if args.mode in {"collect-serps", "weekly"}:
        reporting_module = _load_sibling("reporting", reporting_module)
        paths = _require_state_dir(args)
        selected = _load_selection(paths["selected"])
        return _collect_serps(
            args,
            selected,
            reporting_module,
            transport,
            run_date,
            weekly=args.mode == "weekly",
        )

    if args.mode == "report":
        inventory_module = _load_sibling("inventory", inventory_module)
        reporting_module = _load_sibling("reporting", reporting_module)
        inventory = _build_inventory(repo_root, inventory_module)
        return _build_report(args, inventory, reporting_module, run_date)

    raise PilotError("unsupported mode")


def main(
    argv: Sequence[str] | None = None,
    *,
    transport: object | None = None,
    today: dt.date | str | None = None,
    inventory_module: object | None = None,
    reporting_module: object | None = None,
) -> int:
    try:
        output = run(
            argv,
            transport=transport,
            today=today,
            inventory_module=inventory_module,
            reporting_module=reporting_module,
        )
    except (PilotError, seo_client.SeoClientError, ValueError, OSError, ImportError) as error:
        message = " ".join(str(error).split())[:240]
        print(
            json.dumps(
                {"ok": False, "error": {"type": type(error).__name__, "message": message}},
                sort_keys=True,
            ),
            file=sys.stderr,
        )
        return 2
    print(json.dumps(output, ensure_ascii=False, indent=2, sort_keys=True))
    return 1 if output.get("status") in {"partial", "unavailable", "no_results"} else 0


if __name__ == "__main__":
    raise SystemExit(main())
