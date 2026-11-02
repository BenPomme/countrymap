"""Guarded DataForSEO transport and USD5 budget primitives.

Injected transports are called as ``transport(url, tasks) -> dict`` where
``tasks`` is the top-level JSON array required by DataForSEO, containing one
task.  The default transport reads credentials only when called, immediately
before its single authorized HTTP request.  This module never logs headers.

Successful calls return ``{"response": raw, "cost": float, "cached": bool}``.
Cache rereads report ``cost`` 0.0 because no new charge is made.
"""

from __future__ import annotations

import base64
import contextlib
import copy
import datetime as dt
import fcntl
import hashlib
import json
import os
import re
import tempfile
import threading
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any, Callable, Iterator
from urllib import request as urllib_request
from zoneinfo import ZoneInfo


GOOGLE_ADS_ENDPOINT = "/v3/keywords_data/google_ads/search_volume/live"
SERP_ENDPOINT = "/v3/serp/google/organic/live/advanced"
DATAFORSEO_BASE_URL = "https://api.dataforseo.com"
PRICING_PATH = Path(__file__).with_name("pricing.json")
PRICING_SHA256 = "463c7807b309fe2900d05926951cb1f9213970b8efbd10b74eb8984463a18dc0"
OFFICIAL_SOURCES = (
    "https://dataforseo.com/pricing/keywords-data/google-ads",
    "https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/live/",
    "https://dataforseo.com/pricing/google-serp/google-organic-serp-api",
    "https://docs.dataforseo.com/v3/serp/google/organic/live/advanced/",
)
PILOT_BUDGET_USD = Decimal("5.0")
ADS_PRICE_USD = Decimal("0.09")
SERP_PRICE_USD = Decimal("0.002")
MAX_PRICE_AGE_DAYS = 7
LOCATION_CODES = frozenset((2840, 2826))
LANGUAGE_CODE = "en"
SERP_DEPTH = 10
SERP_DEVICE = "desktop"
SERP_OS = "windows"
SUCCESS_STATUS = 20000
HTTP_TIMEOUT_SECONDS = 90
MAX_RESPONSE_BYTES = 20_000_000
MADRID = ZoneInfo("Europe/Madrid")
_PROCESS_LEDGER_LOCK = threading.RLock()

Transport = Callable[[str, list[dict[str, Any]]], dict[str, Any]]
ADS_TASK_KEYS = frozenset(("keywords", "location_code", "language_code"))
SERP_TASK_KEYS = frozenset(
    ("keyword", "location_code", "language_code", "device", "os", "depth")
)


class _NoRedirect(urllib_request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class SeoClientError(Exception):
    """Base class for safe, typed client failures."""


class PricingError(SeoClientError):
    """The local price manifest is absent, stale, or not the reviewed copy."""


class BudgetError(SeoClientError):
    """The local USD5 ledger cannot safely admit the request."""


class BudgetExceededError(BudgetError):
    """The fixed maximum request cost would exceed the pilot budget."""


class BudgetStateError(BudgetError):
    """The ledger is malformed or inconsistent, so use must stop."""


class PendingRequestError(BudgetError):
    """The cache key has an unresolved reservation and must not replay."""


class CacheConflictError(SeoClientError):
    """A cache key was reused with incompatible state or request metadata."""


class TransportError(SeoClientError):
    """The transport outcome is unknown; the reservation remains held."""


class CostError(SeoClientError):
    """A finite nonnegative provider cost was unavailable."""


class ResponseValidationError(SeoClientError):
    """The provider response failed the fixed response contract."""


class ProviderError(ResponseValidationError):
    """The provider returned a non-success root or task status."""

    def __init__(
        self,
        message: str,
        *,
        root_status_code: int | None = None,
        root_status_message: str | None = None,
        task_status_code: int | None = None,
        task_status_message: str | None = None,
    ) -> None:
        super().__init__(message)
        self.status_details = {
            "root_status_code": root_status_code,
            "root_status_message": _safe_detail(root_status_message),
            "task_status_code": task_status_code,
            "task_status_message": _safe_detail(task_status_message),
        }


class UnavailableResultError(ResponseValidationError):
    """The provider reported success without an available result payload."""


def _safe_detail(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    return " ".join(value.replace("\x00", " ").split())[:240]


def _canonical_sha256(value: object) -> str:
    encoded = json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=True
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _today() -> dt.date:
    return dt.datetime.now(MADRID).date()


def _finite_decimal(value: object) -> Decimal | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    try:
        number = Decimal(str(value))
    except InvalidOperation:
        return None
    return number if number.is_finite() else None


def _read_json_object(path: Path, label: str) -> dict[str, Any]:
    try:
        raw = path.read_text(encoding="utf-8")
        value = json.loads(raw)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise PricingError(f"{label} is absent or unreadable") from exc
    if not isinstance(value, dict):
        raise PricingError(f"{label} must be a JSON object")
    return value


def _load_pricing(path: Path | None = None) -> dict[str, Any]:
    pricing_path = path or PRICING_PATH
    manifest = _read_json_object(pricing_path, "pricing manifest")
    if _canonical_sha256(manifest) != PRICING_SHA256:
        raise PricingError("pricing manifest is changed or unreviewed")
    if manifest.get("schema_version") != 1:
        raise PricingError("unsupported pricing manifest schema")
    if manifest.get("reviewed_by") != "coordinator":
        raise PricingError("pricing review owner is not approved")
    if manifest.get("currency") != "USD":
        raise PricingError("pricing currency must be USD")
    if manifest.get("source_urls") != list(OFFICIAL_SOURCES):
        raise PricingError("official source URLs changed or are absent")
    reviewed = manifest.get("reviewed_on")
    try:
        reviewed_on = dt.date.fromisoformat(reviewed)
    except (TypeError, ValueError) as exc:
        raise PricingError("pricing review date is absent or invalid") from exc
    age_days = (_today() - reviewed_on).days
    if age_days < 0 or age_days > MAX_PRICE_AGE_DAYS:
        raise PricingError("pricing manifest is stale or not yet valid")
    if _finite_decimal(manifest.get("pilot_budget_usd")) != PILOT_BUDGET_USD:
        raise PricingError("pilot budget is not the approved USD5 total")

    endpoints = manifest.get("endpoints")
    if not isinstance(endpoints, dict) or set(endpoints) != {
        GOOGLE_ADS_ENDPOINT,
        SERP_ENDPOINT,
    }:
        raise PricingError("pricing endpoint allowlist changed")
    ads = endpoints[GOOGLE_ADS_ENDPOINT]
    serp = endpoints[SERP_ENDPOINT]
    if not isinstance(ads, dict) or not isinstance(serp, dict):
        raise PricingError("pricing endpoint metadata is malformed")
    if set(ads) != {
        "method",
        "price_usd",
        "max_cost_usd",
        "max_keywords",
        "tasks_per_request",
    }:
        raise PricingError("Google Ads pricing shape changed")
    if set(serp) != {
        "method",
        "price_usd",
        "max_cost_usd",
        "depth",
        "device",
        "os",
        "tasks_per_request",
    }:
        raise PricingError("SERP pricing shape changed")
    if (
        ads["method"] != "POST"
        or ads["tasks_per_request"] != 1
        or ads["max_keywords"] != 1000
        or _finite_decimal(ads["price_usd"]) != ADS_PRICE_USD
        or _finite_decimal(ads["max_cost_usd"]) != ADS_PRICE_USD
    ):
        raise PricingError("Google Ads price or request cap is unapproved")
    if (
        serp["method"] != "POST"
        or serp["tasks_per_request"] != 1
        or serp["depth"] != SERP_DEPTH
        or serp["device"] != SERP_DEVICE
        or serp["os"] != SERP_OS
        or _finite_decimal(serp["price_usd"]) != SERP_PRICE_USD
        or _finite_decimal(serp["max_cost_usd"]) != SERP_PRICE_USD
    ):
        raise PricingError("SERP price or fixed task shape is unapproved")
    return manifest


_COLON_OPERATOR = re.compile(
    r"(?i)(?<![a-z0-9_])(?:site|filetype|intitle|allintitle|inurl|allinurl|"
    r"related|cache|link|define|info|source|inanchor|ext|location|search|"
    r"before|after|lr|num|start)\s*:"
)
_BOOLEAN_OPERATOR = re.compile(r"(?<!\S)(?:OR|AND|NOT)(?!\S)")
_NEGATIVE_OPERATOR = re.compile(r"(?:^|\s)[+-]\S")
_GROUPING_CHARS = frozenset("\"()[]{}*")


def _validate_keyword(value: object) -> str:
    if not isinstance(value, str) or not value or value.strip() != value:
        raise ValueError("keyword must be a nonempty unpadded string")
    if any(ord(char) < 32 for char in value):
        raise ValueError("keyword contains control characters")
    if (
        any(char in _GROUPING_CHARS for char in value)
        or ".." in value
        or _COLON_OPERATOR.search(value)
        or _BOOLEAN_OPERATOR.search(value)
        or _NEGATIVE_OPERATOR.search(value)
        or re.search(r"(?i)around\s*\(", value)
    ):
        raise ValueError("operator queries are not allowed")
    return value


def _validate_location_and_language(task: dict[str, Any]) -> None:
    if type(task.get("location_code")) is not int:
        raise ValueError("location_code must be an integer")
    if task["location_code"] not in LOCATION_CODES:
        raise ValueError("only US 2840 and UK 2826 are approved")
    if task.get("language_code") != LANGUAGE_CODE:
        raise ValueError("only language_code en is approved")


def _validate_task(endpoint: str, task: object) -> tuple[dict[str, Any], Decimal]:
    if not isinstance(task, dict):
        raise ValueError("task must be an object")
    if endpoint == GOOGLE_ADS_ENDPOINT:
        if set(task) != ADS_TASK_KEYS:
            raise ValueError("unexpected Google Ads task keys")
        keywords = task.get("keywords")
        if not isinstance(keywords, list) or not 1 <= len(keywords) <= 1000:
            raise ValueError("keywords must contain between 1 and 1000 items")
        for keyword in keywords:
            _validate_keyword(keyword)
        _validate_location_and_language(task)
        price = ADS_PRICE_USD
    elif endpoint == SERP_ENDPOINT:
        if set(task) != SERP_TASK_KEYS:
            raise ValueError("unexpected SERP task keys")
        _validate_keyword(task.get("keyword"))
        _validate_location_and_language(task)
        if task.get("device") != SERP_DEVICE or task.get("os") != SERP_OS:
            raise ValueError("only desktop Windows SERP tasks are approved")
        if type(task.get("depth")) is not int or task["depth"] != SERP_DEPTH:
            raise ValueError("only SERP depth 10 is approved")
        price = SERP_PRICE_USD
    else:
        raise ValueError("endpoint is not on the fixed allowlist")
    return copy.deepcopy(task), price


def _integer_status(value: object) -> int | None:
    return value if type(value) is int else None


def _provider_error_details(response: object) -> dict[str, object]:
    if not isinstance(response, dict):
        return {}
    tasks = response.get("tasks")
    task = tasks[0] if isinstance(tasks, list) and len(tasks) == 1 else {}
    if not isinstance(task, dict):
        task = {}
    return {
        "root_status_code": _integer_status(response.get("status_code")),
        "root_status_message": _safe_detail(response.get("status_message")),
        "task_status_code": _integer_status(task.get("status_code")),
        "task_status_message": _safe_detail(task.get("status_message")),
    }


def _provider_error(message: str, response: object) -> ProviderError:
    return ProviderError(message, **_provider_error_details(response))


def _response_cost(response: object) -> Decimal:
    if not isinstance(response, dict):
        raise CostError("provider response cost is absent")
    cost = _finite_decimal(response.get("cost"))
    if cost is None or cost < 0:
        raise CostError("provider response cost is absent or invalid")
    return cost


def _validate_response(
    endpoint: str, request_task: dict[str, Any], response: object
) -> None:
    if not isinstance(response, dict):
        raise ResponseValidationError("provider root response must be an object")
    if _integer_status(response.get("status_code")) != SUCCESS_STATUS:
        raise _provider_error("provider root status is not success", response)
    if _integer_status(response.get("tasks_error")) != 0:
        raise _provider_error("provider reported task errors", response)
    tasks = response.get("tasks")
    if (
        _integer_status(response.get("tasks_count")) != 1
        or not isinstance(tasks, list)
        or len(tasks) != 1
        or not isinstance(tasks[0], dict)
    ):
        raise ResponseValidationError("provider response must contain exactly one task")
    task = tasks[0]
    if _integer_status(task.get("status_code")) != SUCCESS_STATUS:
        raise _provider_error("provider task status is not success", response)
    result = task.get("result")
    if not isinstance(result, list) or not result:
        raise UnavailableResultError("provider result is unavailable")
    echo = task.get("data")
    if not isinstance(echo, dict):
        raise ResponseValidationError("provider request echo metadata is absent")
    if endpoint == GOOGLE_ADS_ENDPOINT:
        if (
            echo.get("keywords") != request_task["keywords"]
            or echo.get("location_code") != request_task["location_code"]
            or echo.get("language_code") != request_task["language_code"]
        ):
            raise ResponseValidationError("Google Ads request echo metadata mismatch")
    else:
        if (
            echo.get("keyword") != request_task["keyword"]
            or echo.get("location_code") != request_task["location_code"]
            or echo.get("language_code") != request_task["language_code"]
        ):
            raise ResponseValidationError("SERP request echo metadata mismatch")


def _utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def _atomic_json_write(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(value, handle, sort_keys=True, separators=(",", ":"))
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(temporary, 0o600)
        os.replace(temporary, path)
        directory_fd = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    except BaseException:
        with contextlib.suppress(FileNotFoundError):
            os.unlink(temporary)
        raise


@contextlib.contextmanager
def _ledger_lock(ledger_path: Path) -> Iterator[None]:
    with _PROCESS_LEDGER_LOCK:
        ledger_path.parent.mkdir(parents=True, exist_ok=True)
        lock_path = ledger_path.with_name(f"{ledger_path.name}.lock")
        descriptor = os.open(lock_path, os.O_RDWR | os.O_CREAT, 0o600)
        try:
            os.fchmod(descriptor, 0o600)
            fcntl.flock(descriptor, fcntl.LOCK_EX)
            yield
        finally:
            with contextlib.suppress(OSError):
                fcntl.flock(descriptor, fcntl.LOCK_UN)
            os.close(descriptor)


def _new_ledger() -> dict[str, Any]:
    return {
        "schema_version": 1,
        "currency": "USD",
        "limit_usd": float(PILOT_BUDGET_USD),
        "entries": {},
    }


def _read_ledger(ledger_path: Path) -> dict[str, Any]:
    if not ledger_path.exists():
        return _new_ledger()
    try:
        value = json.loads(ledger_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise BudgetStateError("budget ledger is unreadable") from exc
    if not isinstance(value, dict) or set(value) != {
        "schema_version",
        "currency",
        "limit_usd",
        "entries",
    }:
        raise BudgetStateError("budget ledger shape is invalid")
    if (
        value.get("schema_version") != 1
        or value.get("currency") != "USD"
        or _finite_decimal(value.get("limit_usd")) != PILOT_BUDGET_USD
        or not isinstance(value.get("entries"), dict)
    ):
        raise BudgetStateError("budget ledger is not the approved USD5 ledger")
    return value


def _ledger_used(ledger: dict[str, Any]) -> Decimal:
    used = Decimal("0")
    for entry in ledger["entries"].values():
        if not isinstance(entry, dict) or entry.get("status") not in {
            "pending",
            "unknown",
            "settled",
        }:
            raise BudgetStateError("budget ledger contains an invalid entry")
        field = "charged_usd" if entry["status"] == "settled" else "reserved_usd"
        amount = _finite_decimal(entry.get(field))
        if amount is None or amount < 0:
            raise BudgetStateError("budget ledger contains an invalid amount")
        if amount > PILOT_BUDGET_USD:
            raise BudgetStateError("budget ledger entry exceeds the pilot total")
        if entry["status"] == "settled":
            reserved = _finite_decimal(entry.get("reserved_usd"))
            if reserved is None or amount > reserved:
                raise BudgetStateError("settled cost exceeds its reservation")
        used += amount
    return used


def _error_receipt(error: BaseException) -> dict[str, object]:
    if isinstance(error, ProviderError):
        return {
            "category": "provider",
            "root_status_code": error.status_details["root_status_code"],
            "task_status_code": error.status_details["task_status_code"],
        }
    if isinstance(error, CostError):
        return {"category": "cost"}
    if isinstance(error, UnavailableResultError):
        return {"category": "unavailable_result"}
    if isinstance(error, ResponseValidationError):
        return {"category": "response_validation"}
    return {"category": "transport"}


class DataForSeoClient:
    """One-task DataForSEO requests backed by a persistent USD5 ledger."""

    def __init__(
        self,
        cache_dir: str | os.PathLike[str],
        ledger_path: str | os.PathLike[str],
        *,
        transport: Transport | None = None,
    ) -> None:
        if transport is not None and not callable(transport):
            raise TypeError("transport must be callable")
        self.cache_dir = Path(cache_dir)
        self.ledger_path = Path(ledger_path)
        self._transport = transport

    def request(
        self, endpoint: str, task: dict[str, Any], cache_key: str
    ) -> dict[str, Any]:
        _load_pricing()
        if endpoint not in (GOOGLE_ADS_ENDPOINT, SERP_ENDPOINT):
            raise ValueError("endpoint is not on the fixed allowlist")
        if not isinstance(cache_key, str) or not cache_key.strip():
            raise ValueError("cache_key must be a nonempty string")
        safe_task, reservation = _validate_task(endpoint, task)
        request_hash = _canonical_sha256(
            {"endpoint": endpoint, "task": safe_task}
        )
        identity = _canonical_sha256(
            {"endpoint": endpoint, "cache_key": cache_key}
        )
        cache_path = self.cache_dir / f"{identity}.json"
        cached = self._admit(identity, request_hash, endpoint, reservation, cache_path)
        if cached is not None:
            return cached

        url = f"{DATAFORSEO_BASE_URL}{endpoint}"
        payload = [copy.deepcopy(safe_task)]
        cost: Decimal | None = None
        try:
            transport = self._transport or _urllib_post
            response = transport(url, payload)
        except Exception:
            error = TransportError("transport outcome is unknown")
            with contextlib.suppress(Exception):
                self._finalize_unknown(identity, error)
            raise error from None

        try:
            cost = _response_cost(response)
            if cost > reservation:
                raise CostError("provider cost exceeds the approved fixed maximum")
            _validate_response(endpoint, safe_task, response)
        except (CostError, ResponseValidationError) as error:
            try:
                if cost is not None and cost <= reservation:
                    self._finalize_settled(identity, cost, error=error)
                else:
                    self._finalize_unknown(identity, error)
            except BudgetStateError:
                pass
            raise error from None

        receipt = {
            "schema_version": 1,
            "endpoint": endpoint,
            "request_sha256": request_hash,
            "cost_usd": float(cost),
            "cached_at": _utc_now(),
            "response": response,
        }
        try:
            _atomic_json_write(cache_path, receipt)
        except (OSError, TypeError, ValueError):
            error = CacheConflictError("cache receipt could not be written")
            with contextlib.suppress(Exception):
                self._finalize_settled(identity, cost, error=error)
            raise error from None
        self._finalize_settled(identity, cost)
        return {
            "response": copy.deepcopy(response),
            "cost": float(cost),
            "cached": False,
        }

    def _admit(
        self,
        identity: str,
        request_hash: str,
        endpoint: str,
        reservation: Decimal,
        cache_path: Path,
    ) -> dict[str, Any] | None:
        with _ledger_lock(self.ledger_path):
            ledger = _read_ledger(self.ledger_path)
            entry = ledger["entries"].get(identity)
            if entry is not None:
                self._check_entry(entry)
                if entry["request_sha256"] != request_hash:
                    raise CacheConflictError("cache key was reused with another task")
                if entry["status"] != "settled":
                    raise PendingRequestError(
                        "cache key has an unresolved reservation; replay is refused"
                    )
                reserved = _finite_decimal(entry.get("reserved_usd"))
                if reserved is None:
                    raise BudgetStateError("budget ledger entry is invalid")
                return self._read_cache(cache_path, endpoint, request_hash, reserved)
            if cache_path.exists():
                raise CacheConflictError("cache receipt has no matching ledger entry")
            used = _ledger_used(ledger)
            if used + reservation > PILOT_BUDGET_USD:
                raise BudgetExceededError("USD5 pilot budget would be exceeded")
            ledger["entries"][identity] = {
                "endpoint": endpoint,
                "request_sha256": request_hash,
                "status": "pending",
                "reserved_usd": float(reservation),
                "created_at": _utc_now(),
            }
            _atomic_json_write(self.ledger_path, ledger)
        return None

    @staticmethod
    def _check_entry(entry: object) -> None:
        if not isinstance(entry, dict):
            raise BudgetStateError("budget ledger entry is invalid")
        required = {"endpoint", "request_sha256", "status", "reserved_usd", "created_at"}
        if not required.issubset(entry):
            raise BudgetStateError("budget ledger entry is incomplete")
        reserved = _finite_decimal(entry.get("reserved_usd"))
        if (
            entry.get("status") not in {"pending", "unknown", "settled"}
            or not isinstance(entry.get("endpoint"), str)
            or not isinstance(entry.get("request_sha256"), str)
            or reserved is None
            or reserved < 0
            or reserved > PILOT_BUDGET_USD
        ):
            raise BudgetStateError("budget ledger entry is invalid")
        if entry["status"] == "settled":
            charged = _finite_decimal(entry.get("charged_usd"))
            if charged is None or charged < 0 or charged > reserved:
                raise BudgetStateError("settled cost is outside its reservation")

    @staticmethod
    def _read_cache(
        cache_path: Path,
        endpoint: str,
        request_hash: str,
        reservation: Decimal,
    ) -> dict[str, Any]:
        try:
            value = json.loads(cache_path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            raise CacheConflictError("settled cache receipt is unavailable") from exc
        if not isinstance(value, dict) or value.get("schema_version") != 1:
            raise CacheConflictError("cache receipt is malformed")
        if value.get("endpoint") != endpoint or value.get("request_sha256") != request_hash:
            raise CacheConflictError("cache receipt does not match this request")
        response = value.get("response")
        stored_cost = _finite_decimal(value.get("cost_usd"))
        if (
            not isinstance(response, dict)
            or stored_cost is None
            or stored_cost < 0
            or stored_cost > reservation
        ):
            raise CacheConflictError("cache receipt contains invalid response data")
        return {"response": copy.deepcopy(response), "cost": 0.0, "cached": True}

    def _finalize_settled(
        self, identity: str, cost: Decimal, *, error: BaseException | None = None
    ) -> None:
        with _ledger_lock(self.ledger_path):
            ledger = _read_ledger(self.ledger_path)
            entry = ledger["entries"].get(identity)
            self._check_entry(entry)
            if entry["status"] != "pending":
                raise BudgetStateError("reservation is not pending")
            reserved = _finite_decimal(entry.get("reserved_usd"))
            if (
                not cost.is_finite()
                or cost < 0
                or reserved is None
                or cost > reserved
            ):
                raise BudgetStateError("settled cost is outside its reservation")
            entry["status"] = "settled"
            entry["charged_usd"] = float(cost)
            entry["settled_at"] = _utc_now()
            if error is not None:
                entry["failure"] = _error_receipt(error)
            _atomic_json_write(self.ledger_path, ledger)

    def _finalize_unknown(self, identity: str, error: BaseException) -> None:
        with _ledger_lock(self.ledger_path):
            ledger = _read_ledger(self.ledger_path)
            entry = ledger["entries"].get(identity)
            self._check_entry(entry)
            if entry["status"] != "pending":
                raise BudgetStateError("reservation is not pending")
            entry["status"] = "unknown"
            entry["unknown_at"] = _utc_now()
            entry["failure"] = _error_receipt(error)
            _atomic_json_write(self.ledger_path, ledger)


def _urllib_post(url: str, payload: list[dict[str, Any]]) -> dict[str, Any]:
    login = os.environ.get("DATAFORSEO_LOGIN")
    password = os.environ.get("DATAFORSEO_PASSWORD")
    if not login or not password:
        raise TransportError("DataForSEO credentials are absent")
    token = base64.b64encode(f"{login}:{password}".encode("utf-8")).decode("ascii")
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    http_request = urllib_request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Basic {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    opener = urllib_request.build_opener(_NoRedirect())
    with opener.open(http_request, timeout=HTTP_TIMEOUT_SECONDS) as response:
        raw = response.read(MAX_RESPONSE_BYTES + 1)
    if len(raw) > MAX_RESPONSE_BYTES:
        raise TransportError("provider response exceeded the safe size limit")
    value = json.loads(raw.decode("utf-8"))
    return value
