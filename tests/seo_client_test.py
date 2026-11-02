import copy
import concurrent.futures
import datetime as dt
import json
import multiprocessing
import os
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "seo"))
import client as seo  # noqa: E402


def ads_task(*, keywords=None, location=2840, language="en"):
    return {
        "keywords": list(keywords or ["world population"]),
        "location_code": location,
        "language_code": language,
    }


def serp_task(*, keyword="world population", location=2840, language="en"):
    return {
        "keyword": keyword,
        "location_code": location,
        "language_code": language,
        "device": "desktop",
        "os": "windows",
        "depth": 10,
    }


def ads_response(task, *, cost=0.09, result=None, echo=None, task_status=20000):
    data = {
        "keywords": task["keywords"],
        "location_code": task["location_code"],
        "language_code": task["language_code"],
    }
    data.update(echo or {})
    response = {
        "status_code": 20000,
        "status_message": "Ok.",
        "tasks_count": 1,
        "tasks_error": 0 if task_status == 20000 else 1,
        "tasks": [
            {
                "status_code": task_status,
                "status_message": "Ok." if task_status == 20000 else "Task failed.",
                "data": data,
                "result": [{"search_volume": None}] if result is None else result,
            }
        ],
    }
    if cost is not None:
        response["cost"] = cost
    return response


def serp_response(task, *, cost=0.002, result=None, echo=None, task_status=20000):
    data = {
        "keyword": task["keyword"],
        "location_code": task["location_code"],
        "language_code": task["language_code"],
    }
    data.update(echo or {})
    response = {
        "status_code": 20000,
        "status_message": "Ok.",
        "tasks_count": 1,
        "tasks_error": 0 if task_status == 20000 else 1,
        "tasks": [
            {
                "status_code": task_status,
                "status_message": "Ok." if task_status == 20000 else "Task failed.",
                "data": data,
                "result": [{"items": []}] if result is None else result,
            }
        ],
    }
    if cost is not None:
        response["cost"] = cost
    return response


class ClientCase(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.cache = self.root / "cache"
        self.ledger = self.root / "budget.json"

    def tearDown(self):
        self.temporary.cleanup()

    def client(self, transport):
        return seo.DataForSeoClient(self.cache, self.ledger, transport=transport)

    def ledger_value(self):
        return json.loads(self.ledger.read_text(encoding="utf-8"))

    def test_ads_success_sends_one_task_and_settles(self):
        task = ads_task()
        calls = []

        def transport(url, tasks):
            calls.append((url, copy.deepcopy(tasks)))
            return ads_response(task)

        result = self.client(transport).request(seo.GOOGLE_ADS_ENDPOINT, task, "ads-1")

        self.assertEqual(result["cost"], 0.09)
        self.assertFalse(result["cached"])
        self.assertEqual(result["response"]["tasks"][0]["result"][0]["search_volume"], None)
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0][0], seo.DATAFORSEO_BASE_URL + seo.GOOGLE_ADS_ENDPOINT)
        self.assertEqual(calls[0][1], [task])
        entry = next(iter(self.ledger_value()["entries"].values()))
        self.assertEqual(entry["status"], "settled")
        self.assertEqual(entry["charged_usd"], 0.09)

    def test_serp_success_checks_echo(self):
        task = serp_task()
        calls = []
        client = self.client(lambda url, tasks: (calls.append(tasks), serp_response(task))[1])

        result = client.request(seo.SERP_ENDPOINT, task, "serp-1")

        self.assertEqual(result["cost"], 0.002)
        self.assertEqual(len(calls[0]), 1)
        self.assertEqual(calls[0][0]["depth"], 10)

    def test_urllib_transport_posts_a_top_level_task_array(self):
        task = ads_task()
        captured = {}

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

            def read(self, size):
                captured["read_size"] = size
                return json.dumps(ads_response(task)).encode("utf-8")

        class FakeOpener:
            def open(self, http_request, timeout):
                captured["url"] = http_request.full_url
                captured["timeout"] = timeout
                captured["body"] = json.loads(http_request.data.decode("utf-8"))
                return FakeResponse()

        fake_environment = {
            "DATAFORSEO_LOGIN": "fixture-login",
            "DATAFORSEO_PASSWORD": "fixture-password",
        }
        with mock.patch.object(seo.os, "environ", fake_environment), mock.patch.object(
            seo.urllib_request, "build_opener", return_value=FakeOpener()
        ):
            response = seo._urllib_post(
                seo.DATAFORSEO_BASE_URL + seo.GOOGLE_ADS_ENDPOINT, [task]
            )

        self.assertEqual(captured["body"], [task])
        self.assertIsInstance(captured["body"], list)
        self.assertEqual(len(captured["body"]), 1)
        self.assertEqual(captured["url"], seo.DATAFORSEO_BASE_URL + seo.GOOGLE_ADS_ENDPOINT)
        self.assertEqual(captured["timeout"], seo.HTTP_TIMEOUT_SECONDS)
        self.assertEqual(captured["read_size"], seo.MAX_RESPONSE_BYTES + 1)
        self.assertEqual(response["tasks"][0]["data"]["keywords"], task["keywords"])

    def test_cached_reread_is_free(self):
        task = ads_task()
        calls = []

        def transport(url, payload):
            calls.append(payload)
            return ads_response(task)

        client = self.client(transport)
        first = client.request(seo.GOOGLE_ADS_ENDPOINT, task, "same")
        second = client.request(seo.GOOGLE_ADS_ENDPOINT, task, "same")

        self.assertEqual(first["cost"], 0.09)
        self.assertEqual(second["cost"], 0.0)
        self.assertTrue(second["cached"])
        self.assertEqual(second["response"], first["response"])
        self.assertEqual(len(calls), 1)
        self.assertEqual(self.ledger_value()["entries"].popitem()[1]["charged_usd"], 0.09)
        with self.assertRaises(seo.CacheConflictError):
            client.request(
                seo.GOOGLE_ADS_ENDPOINT,
                ads_task(keywords=["different task"]),
                "same",
            )
        self.assertEqual(len(calls), 1)

    def test_timeout_stays_reserved_and_refuses_replay(self):
        calls = []
        secret = "sentinel-password-value"

        def transport(url, payload):
            calls.append(payload)
            raise TimeoutError(secret)

        client = self.client(transport)
        with self.assertRaises(seo.TransportError) as raised:
            client.request(seo.GOOGLE_ADS_ENDPOINT, ads_task(), "timeout")

        self.assertNotIn(secret, str(raised.exception))
        self.assertNotIn(secret, self.ledger.read_text(encoding="utf-8"))
        entry = next(iter(self.ledger_value()["entries"].values()))
        self.assertEqual(entry["status"], "unknown")
        self.assertEqual(entry["reserved_usd"], 0.09)
        with self.assertRaises(seo.PendingRequestError):
            client.request(seo.GOOGLE_ADS_ENDPOINT, ads_task(), "timeout")
        self.assertEqual(len(calls), 1)

    def test_missing_cost_stays_reserved(self):
        task = ads_task()
        client = self.client(lambda url, payload: ads_response(task, cost=None))

        with self.assertRaises(seo.CostError):
            client.request(seo.GOOGLE_ADS_ENDPOINT, task, "no-cost")

        entry = next(iter(self.ledger_value()["entries"].values()))
        self.assertEqual(entry["status"], "unknown")
        self.assertEqual(entry["reserved_usd"], 0.09)

    def test_provider_failure_settles_known_cost_and_keeps_status(self):
        task = serp_task()
        calls = []

        def transport(url, payload):
            calls.append(payload)
            return serp_response(task, task_status=40501)

        client = self.client(transport)
        with self.assertRaises(seo.ProviderError) as raised:
            client.request(seo.SERP_ENDPOINT, task, "provider-error")

        self.assertEqual(raised.exception.status_details["task_status_code"], 40501)
        entry = next(iter(self.ledger_value()["entries"].values()))
        self.assertEqual(entry["status"], "settled")
        self.assertEqual(entry["charged_usd"], 0.002)
        self.assertEqual(entry["failure"]["task_status_code"], 40501)
        with self.assertRaises(seo.CacheConflictError):
            client.request(seo.SERP_ENDPOINT, task, "provider-error")
        self.assertEqual(len(calls), 1)

    def test_failed_echo_is_rejected_and_not_cached(self):
        task = serp_task()
        response = serp_response(task, echo={"keyword": "different query"})
        client = self.client(lambda url, payload: response)

        with self.assertRaises(seo.ResponseValidationError):
            client.request(seo.SERP_ENDPOINT, task, "bad-echo")

        self.assertEqual(len(list(self.cache.glob("*.json"))), 0)
        with self.assertRaises(seo.CacheConflictError):
            client.request(seo.SERP_ENDPOINT, task, "bad-echo")

    def test_unavailable_result_is_an_error_not_zero(self):
        task = ads_task()
        client = self.client(lambda url, payload: ads_response(task, result=[]))

        with self.assertRaises(seo.UnavailableResultError):
            client.request(seo.GOOGLE_ADS_ENDPOINT, task, "empty")

        self.assertEqual(len(list(self.cache.glob("*.json"))), 0)

    def test_provider_payload_with_two_tasks_is_rejected(self):
        task = serp_task()
        response = serp_response(task)
        response["tasks_count"] = 2
        response["tasks"].append(copy.deepcopy(response["tasks"][0]))
        client = self.client(lambda url, payload: response)

        with self.assertRaises(seo.ResponseValidationError):
            client.request(seo.SERP_ENDPOINT, task, "two-tasks")

        self.assertEqual(len(list(self.cache.glob("*.json"))), 0)

    def test_ads_keyword_limit_is_exact(self):
        accepted = ads_task(keywords=[f"keyword {index}" for index in range(1000)])
        calls = []
        client = self.client(
            lambda url, payload: (calls.append(payload), ads_response(accepted))[1]
        )

        client.request(seo.GOOGLE_ADS_ENDPOINT, accepted, "ads-1000")

        self.assertEqual(len(calls[0]), 1)
        self.assertEqual(len(calls[0][0]["keywords"]), 1000)
        with self.assertRaises(ValueError):
            client.request(
                seo.GOOGLE_ADS_ENDPOINT,
                ads_task(keywords=accepted["keywords"] + ["keyword 1001"]),
                "ads-1001",
            )
        self.assertEqual(len(calls), 1)

    def test_task_allowlist_rejects_addons_operators_and_markets(self):
        calls = []
        client = self.client(lambda url, payload: calls.append(payload))
        invalid = [
            (seo.GOOGLE_ADS_ENDPOINT, {**ads_task(), "tag": "x"}),
            (seo.GOOGLE_ADS_ENDPOINT, ads_task(keywords=["site:example.com"])),
            (seo.GOOGLE_ADS_ENDPOINT, ads_task(keywords=['"world population"'])),
            (seo.GOOGLE_ADS_ENDPOINT, ads_task(location=1)),
            (seo.GOOGLE_ADS_ENDPOINT, ads_task(language="fr")),
            (seo.SERP_ENDPOINT, {**serp_task(), "depth": 11}),
            (seo.SERP_ENDPOINT, {**serp_task(), "postback_url": "https://example.com"}),
            (seo.SERP_ENDPOINT, {**serp_task(), "device": "mobile"}),
            (seo.SERP_ENDPOINT, serp_task(keyword="world OR population")),
            (seo.SERP_ENDPOINT, serp_task(keyword="around(10) population")),
        ]
        for index, (endpoint, task) in enumerate(invalid):
            with self.subTest(index=index), self.assertRaises(ValueError):
                client.request(endpoint, task, f"invalid-{index}")
        self.assertEqual(calls, [])
        self.assertFalse(self.ledger.exists())

    def test_unknown_endpoint_is_rejected_before_transport(self):
        client = self.client(lambda url, payload: self.fail("transport called"))
        with self.assertRaises(ValueError):
            client.request("/v3/account/balance", ads_task(), "account")

    def test_pricing_manifest_rejects_stale_absent_and_changed_copies(self):
        original_path = seo.PRICING_PATH
        original = json.loads(original_path.read_text(encoding="utf-8"))
        stale = copy.deepcopy(original)
        stale["reviewed_on"] = (seo._today() - dt.timedelta(days=8)).isoformat()
        changed = copy.deepcopy(original)
        changed["endpoints"][seo.GOOGLE_ADS_ENDPOINT]["price_usd"] = 0.08
        changed_source = copy.deepcopy(original)
        changed_source["source_urls"][0] = "https://example.com/unreviewed"

        cases = {
            "stale": (stale, seo._canonical_sha256(stale)),
            "changed": (changed, seo.PRICING_SHA256),
            "source": (changed_source, seo._canonical_sha256(changed_source)),
        }
        for name, (manifest, digest) in cases.items():
            path = self.root / f"{name}.json"
            path.write_text(json.dumps(manifest), encoding="utf-8")
            with self.subTest(name=name), mock.patch.object(
                seo, "PRICING_PATH", path
            ), mock.patch.object(seo, "PRICING_SHA256", digest):
                with self.assertRaises(seo.PricingError):
                    self.client(lambda url, payload: self.fail("transport called")).request(
                        seo.GOOGLE_ADS_ENDPOINT, ads_task(), name
                    )

        with mock.patch.object(seo, "PRICING_PATH", self.root / "missing.json"):
            with self.assertRaises(seo.PricingError):
                self.client(lambda url, payload: self.fail("transport called")).request(
                    seo.GOOGLE_ADS_ENDPOINT, ads_task(), "missing"
                )


def _run_admission(arguments):
    cache, ledger, index = arguments
    task = ads_task(keywords=[f"concurrent keyword {index}"])

    def transport(url, payload):
        time.sleep(0.02)
        return ads_response(task)

    client = seo.DataForSeoClient(cache, ledger, transport=transport)
    try:
        client.request(seo.GOOGLE_ADS_ENDPOINT, task, f"concurrent-{index}")
        return "settled"
    except seo.BudgetExceededError:
        return "budget"


class BudgetRaceCase(unittest.TestCase):
    def test_concurrent_admissions_cannot_overspend(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            context = multiprocessing.get_context("spawn")
            arguments = [
                (str(root / "cache"), str(root / "budget.json"), index)
                for index in range(64)
            ]
            with context.Pool(16) as pool:
                outcomes = pool.map(_run_admission, arguments)

            ledger = json.loads((root / "budget.json").read_text(encoding="utf-8"))
            charged = sum(entry["charged_usd"] for entry in ledger["entries"].values())
            self.assertEqual(outcomes.count("settled"), 55)
            self.assertEqual(outcomes.count("budget"), 9)
            self.assertAlmostEqual(charged, 4.95)
            self.assertTrue(
                all(entry["status"] == "settled" for entry in ledger["entries"].values())
            )

    def test_thread_admissions_cannot_overspend(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)

            def transport(url, tasks):
                time.sleep(0.01)
                return ads_response(tasks[0])

            client = seo.DataForSeoClient(
                root / "cache", root / "budget.json", transport=transport
            )

            def admit(index):
                task = ads_task(keywords=[f"thread keyword {index}"])
                try:
                    client.request(seo.GOOGLE_ADS_ENDPOINT, task, f"thread-{index}")
                    return "settled"
                except seo.BudgetExceededError:
                    return "budget"

            with concurrent.futures.ThreadPoolExecutor(max_workers=16) as executor:
                outcomes = list(executor.map(admit, range(64)))

            ledger = json.loads((root / "budget.json").read_text(encoding="utf-8"))
            charged = sum(entry["charged_usd"] for entry in ledger["entries"].values())
            self.assertEqual(outcomes.count("settled"), 55)
            self.assertEqual(outcomes.count("budget"), 9)
            self.assertAlmostEqual(charged, 4.95)


if __name__ == "__main__":
    unittest.main()
