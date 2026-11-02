import copy
import datetime as dt
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "seo"))
import client as seo  # noqa: E402
import pilot  # noqa: E402


TODAY = dt.date(2026, 11, 2)
MARKETS = ((2840, "en"), (2826, "en"))


def inventory_rows(count=12):
    return [
        {
            "keyword": f"fixture topic {index} by country",
            "url": f"/map/fixture-{index}/",
            "intent": "informational",
            "topic": f"fixture-{index}",
        }
        for index in range(count)
    ]


def fake_inventory_module(rows=None):
    rows = inventory_rows() if rows is None else rows

    def build_inventory(repo_root):
        return copy.deepcopy(rows)

    def choose_serps(inventory, volume_rows, limit=20):
        volume_lookup = {}
        for row in volume_rows:
            key = (row.get("keyword"), row.get("location_code"), row.get("language_code"))
            volume_lookup[key] = row.get("search_volume")
        selected = []
        for row in inventory:
            for location, language in MARKETS:
                if len(selected) >= limit:
                    return selected
                selected.append(
                    {
                        "keyword": row["keyword"],
                        "url": row["url"],
                        "location_code": location,
                        "language_code": language,
                        "volume_estimate": volume_lookup.get(
                            (row["keyword"], location, language)
                        ),
                    }
                )
        return selected

    def inventory_totals(inventory):
        return {
            "candidate_queries": len(inventory),
            "unique_urls": len({row["url"] for row in inventory}),
        }

    return SimpleNamespace(
        build_inventory=build_inventory,
        choose_serps=choose_serps,
        inventory_totals=inventory_totals,
    )


def fake_reporting_module():
    def read_ads_volume(source):
        rows = []
        for response in source:
            if "tasks" not in response and "keyword" in response:
                rows.append(copy.deepcopy(response))
                continue
            task = response["tasks"][0]
            data = task["data"]
            for item in task["result"]:
                rows.append(
                    {
                        "keyword": item["keyword"],
                        "location_code": data["location_code"],
                        "language_code": data["language_code"],
                        "search_volume": item.get("search_volume"),
                        "collected_at": response.get("collection_date"),
                    }
                )
        return rows

    def read_organic_results(source, depth=10):
        rows = []
        for response in source:
            if "tasks" not in response and "keyword" in response:
                rows.append(copy.deepcopy(response))
                continue
            task = response["tasks"][0]
            data = task["data"]
            for result in task["result"]:
                items = []
                for item in result.get("items", []):
                    rank = item.get("rank_group")
                    items.append(
                        {
                            **item,
                            "position": rank if rank is not None and rank <= depth else None,
                            "position_status": "observed" if rank is not None else "unavailable",
                        }
                    )
                rows.append(
                    {
                        "keyword": data["keyword"],
                        "location_code": data["location_code"],
                        "language_code": data["language_code"],
                        "collection_date": response.get("collection_date"),
                        "items": items,
                    }
                )
        return rows

    def build_evidence_report(
        inventory, volume_rows, organic_rows=None, *, limit=20, depth=10, collection_date=None
    ):
        selected = fake_inventory_module().choose_serps(inventory, volume_rows, limit=limit)
        return {
            "schema_version": 1,
            "collection": {"date": collection_date, "collection_dates": []},
            "selected_serps": selected,
            "priorities": [],
            "weekly_tracking": {},
            "limitations": ["Fixture limitation."],
        }

    def render_evidence_markdown(report):
        return "# Fixture evidence report\n"

    def save_evidence_report(report, json_path, markdown_path=None):
        Path(json_path).write_text(json.dumps(report), encoding="utf-8")
        if markdown_path is not None:
            Path(markdown_path).write_text(render_evidence_markdown(report), encoding="utf-8")

    return SimpleNamespace(
        read_ads_volume=read_ads_volume,
        read_organic_results=read_organic_results,
        build_evidence_report=build_evidence_report,
        render_evidence_markdown=render_evidence_markdown,
        save_evidence_report=save_evidence_report,
    )


def fixture_transport(calls, *, fail_ads=False, collection_date=TODAY):
    def transport(url, tasks):
        if not isinstance(tasks, list) or len(tasks) != 1 or not isinstance(tasks[0], dict):
            raise AssertionError("transport payload must be a one-task JSON array")
        task = copy.deepcopy(tasks[0])
        calls.append({"url": url, "tasks": tasks})
        if url.endswith(seo.GOOGLE_ADS_ENDPOINT):
            if fail_ads:
                result = []
            else:
                result = [
                    {
                        "keyword": keyword,
                        "search_volume": None if index == 0 else 100 + index,
                    }
                    for index, keyword in enumerate(task["keywords"])
                ]
            response = {
                "status_code": 20000,
                "status_message": "Ok.",
                "tasks_count": 1,
                "tasks_error": 0,
                "tasks": [
                    {
                        "status_code": 20000,
                        "status_message": "Ok.",
                        "data": copy.deepcopy(task),
                        "result": result,
                    }
                ],
                "cost": 0.09,
                "collection_date": collection_date.isoformat(),
            }
            return response
        if not url.endswith(seo.SERP_ENDPOINT):
            raise AssertionError("unexpected endpoint")
        response = {
            "status_code": 20000,
            "status_message": "Ok.",
            "tasks_count": 1,
            "tasks_error": 0,
            "tasks": [
                {
                    "status_code": 20000,
                    "status_message": "Ok.",
                    "data": copy.deepcopy(task),
                    "result": [
                        {
                            "keyword": task["keyword"],
                            "items": [
                                {
                                    "type": "organic",
                                    "rank_group": 3,
                                    "domain": "example.com",
                                    "url": "https://example.com/result",
                                    "title": "Fixture result",
                                    "description": "Fixture snippet",
                                }
                            ],
                        }
                    ],
                }
            ],
            "cost": 0.002,
            "collection_date": collection_date.isoformat(),
        }
        return response

    return transport


class PilotCase(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.repo = self.root / "repo"
        self.repo.mkdir()
        self.state = self.root / "state"
        self.calls = []
        self.transport = fixture_transport(self.calls)
        self.inventory_module = fake_inventory_module()
        self.reporting_module = fake_reporting_module()
        self.pricing_clock = mock.patch.object(seo, "_today", return_value=TODAY)
        self.pricing_clock.start()

    def tearDown(self):
        self.pricing_clock.stop()
        self.temporary.cleanup()

    def invoke(self, *arguments, today=TODAY, transport=None):
        return pilot.run(
            list(arguments),
            transport=self.transport if transport is None else transport,
            today=today,
            inventory_module=self.inventory_module,
            reporting_module=self.reporting_module,
        )

    def collect_volumes(self, *, today=TODAY, execute=True):
        arguments = [
            "collect-volumes",
            "--state-dir",
            str(self.state),
            "--repo-root",
            str(self.repo),
            "--date",
            today.isoformat(),
        ]
        if execute:
            arguments.append("--execute")
        return self.invoke(*arguments, today=today)

    def plan(self, *, today=TODAY):
        return self.invoke(
            "plan-serps",
            "--state-dir",
            str(self.state),
            "--repo-root",
            str(self.repo),
            today=today,
        )

    def collect_initial(self, *, today=TODAY, execute=True):
        arguments = [
            "collect-serps",
            "--state-dir",
            str(self.state),
            "--date",
            today.isoformat(),
        ]
        if execute:
            arguments.append("--execute")
        return self.invoke(*arguments, today=today)

    def weekly(self, date_value, *, today, execute=True):
        arguments = [
            "weekly",
            "--state-dir",
            str(self.state),
            "--date",
            date_value.isoformat(),
        ]
        if execute:
            arguments.append("--execute")
        return self.invoke(*arguments, today=today)

    def ledger(self):
        return json.loads((self.state / "ledger.json").read_text(encoding="utf-8"))


class QuoteAndInventoryTests(PilotCase):
    def test_quote_is_the_approved_initial_and_weekly_estimate(self):
        with mock.patch.object(seo, "_today", return_value=TODAY):
            quote = self.invoke("quote")

        self.assertEqual(quote["initial_estimated_total_usd"], 0.22)
        self.assertEqual(quote["weekly"]["estimated_cost_usd"], 0.16)
        self.assertEqual(quote["pilot_estimated_total_usd"], 0.38)
        self.assertEqual(quote["headroom_estimate_usd"], 4.62)
        self.assertTrue(quote["estimate_only"])
        self.assertEqual(quote["difficulty"]["status"], "unknown")
        self.assertEqual(self.calls, [])

    def test_inventory_is_local_and_reports_contract_totals(self):
        output = self.invoke(
            "inventory", "--repo-root", str(self.repo), today=TODAY
        )

        self.assertEqual(output["status"], "local_only")
        self.assertEqual(output["network_requests"], 0)
        self.assertEqual(output["totals"]["candidate_queries"], 12)
        self.assertEqual(self.calls, [])

    def test_all_collection_modes_are_dry_without_execute(self):
        self.collect_volumes(execute=False)
        self.plan()
        self.collect_initial(execute=False)
        self.weekly(dt.date(2026, 11, 9), today=dt.date(2026, 11, 9), execute=False)

        self.assertEqual(self.calls, [])
        self.assertFalse((self.state / "ledger.json").exists())

    def test_volume_collection_uses_one_array_task_per_market(self):
        output = self.collect_volumes(execute=True)

        self.assertEqual(len(self.calls), 2)
        self.assertTrue(all(isinstance(call["tasks"], list) for call in self.calls))
        self.assertTrue(all(len(call["tasks"]) == 1 for call in self.calls))
        self.assertEqual(
            {call["tasks"][0]["location_code"] for call in self.calls}, {2840, 2826}
        )
        self.assertTrue(
            all(call["tasks"][0]["language_code"] == "en" for call in self.calls)
        )
        self.assertTrue(all(len(call["tasks"][0]["keywords"]) == 12 for call in self.calls))
        self.assertEqual(output["status"], "complete")
        self.assertEqual(output["actual_charge_usd"], 0.18)
        self.assertEqual(len(output["requests"]), 2)
        self.assertTrue(any(row["search_volume"] is None for row in output["rows"]))
        ledger = self.ledger()
        self.assertEqual(len(ledger["entries"]), 2)
        self.assertAlmostEqual(
            sum(entry["charged_usd"] for entry in ledger["entries"].values()), 0.18
        )

    def test_inventory_over_five_hundred_market_combinations_is_rejected(self):
        self.inventory_module = fake_inventory_module(inventory_rows(251))

        with self.assertRaises(pilot.PilotError):
            self.collect_volumes(execute=True)

        self.assertEqual(self.calls, [])
        self.assertFalse((self.state / "ledger.json").exists())

    def test_unavailable_volume_result_is_recorded_with_known_cost(self):
        self.transport = fixture_transport(self.calls, fail_ads=True)
        output = self.collect_volumes(execute=True)

        self.assertEqual(output["status"], "unavailable")
        self.assertEqual(len(output["errors"]), 2)
        self.assertEqual(output["rows"], [])
        self.assertEqual(output["actual_charge_usd"], 0.18)
        charges = [entry["charged_usd"] for entry in self.ledger()["entries"].values()]
        self.assertEqual(charges, [0.09, 0.09])


class SerpFlowTests(PilotCase):
    def test_plan_selects_twenty_and_is_immutable(self):
        self.collect_volumes()
        first = self.plan()
        selected_path = self.state / "selected_serps.json"
        original = selected_path.read_text(encoding="utf-8")
        calls_after_plan = len(self.calls)
        second = self.plan()

        self.assertEqual(first["selected_count"], 20)
        self.assertEqual(first["status"], "planned")
        self.assertEqual(second["status"], "reused_immutable")
        self.assertEqual(selected_path.read_text(encoding="utf-8"), original)
        self.assertEqual(len(self.calls), calls_after_plan)
        self.assertTrue(any(row["volume_estimate"] is None for row in first["selected_serps"]))

    def test_tampered_selection_is_rejected_before_collection(self):
        self.collect_volumes()
        self.plan()
        selected_path = self.state / "selected_serps.json"
        value = json.loads(selected_path.read_text(encoding="utf-8"))
        value["selected_serps"][0]["keyword"] = "tampered keyword"
        selected_path.write_text(json.dumps(value), encoding="utf-8")
        calls_before = len(self.calls)

        with self.assertRaises(pilot.PilotError):
            self.collect_initial()
        with self.assertRaises(pilot.PilotError):
            self.weekly(dt.date(2026, 11, 9), today=dt.date(2026, 11, 9))

        self.assertEqual(len(self.calls), calls_before)

    def test_initial_serps_use_depth_ten_and_the_same_ledger(self):
        self.collect_volumes()
        self.plan()
        output = self.collect_initial()

        self.assertEqual(len(self.calls), 22)
        serp_calls = self.calls[2:]
        self.assertEqual(len(serp_calls), 20)
        self.assertEqual(
            {call["tasks"][0]["depth"] for call in serp_calls}, {10}
        )
        self.assertEqual(
            {call["tasks"][0]["device"] for call in serp_calls}, {"desktop"}
        )
        self.assertEqual({call["tasks"][0]["os"] for call in serp_calls}, {"windows"})
        self.assertEqual(output["status"], "complete")
        self.assertEqual(output["actual_charge_usd"], 0.04)
        self.assertEqual(output["monthly_volume_requests"], 0)
        self.assertEqual(len(output["rows"]), 20)
        ledger = self.ledger()
        self.assertEqual(len(ledger["entries"]), 22)
        self.assertAlmostEqual(
            sum(entry["charged_usd"] for entry in ledger["entries"].values()), 0.22
        )

    def test_repeating_initial_run_reuses_the_saved_artifact_without_calls(self):
        self.collect_volumes()
        self.plan()
        first = self.collect_initial()
        calls = len(self.calls)
        second = self.collect_initial()

        self.assertEqual(second["run_status"], "reused")
        self.assertEqual(second["actual_charge_usd"], first["actual_charge_usd"])
        self.assertEqual(len(self.calls), calls)

    def test_collect_serps_requires_a_frozen_selection(self):
        with self.assertRaises(pilot.PilotError):
            self.collect_initial()
        self.assertEqual(self.calls, [])
        self.assertFalse((self.state / "ledger.json").exists())

    def test_weekly_rejects_wrong_future_and_closed_dates_before_network(self):
        self.collect_volumes()
        self.plan()
        calls = len(self.calls)

        with self.assertRaises(pilot.PilotError):
            self.weekly(dt.date(2026, 11, 10), today=dt.date(2026, 11, 10))
        with self.assertRaises(pilot.PilotError):
            self.weekly(dt.date(2026, 11, 9), today=TODAY)
        with self.assertRaises(pilot.PilotError):
            self.weekly(dt.date(2026, 12, 1), today=dt.date(2026, 12, 1))

        self.assertEqual(len(self.calls), calls)

    def test_weekly_uses_the_frozen_selection_and_no_volume_calls(self):
        self.collect_volumes()
        self.plan()
        report_date = dt.date(2026, 11, 9)
        with mock.patch.object(seo, "_today", return_value=report_date):
            output = self.weekly(report_date, today=report_date)

        self.assertEqual(output["status"], "complete")
        self.assertEqual(output["selected_count"], 20)
        self.assertEqual(output["monthly_volume_requests"], 0)
        self.assertEqual(output["actual_charge_usd"], 0.04)
        self.assertEqual(len(output["requests"]), 20)
        self.assertTrue(
            all(call["url"].endswith(seo.SERP_ENDPOINT) for call in self.calls[2:])
        )
        ledger = self.ledger()
        self.assertEqual(len(ledger["entries"]), 22)
        self.assertAlmostEqual(
            sum(entry["charged_usd"] for entry in ledger["entries"].values()), 0.22
        )

    def test_weekly_cache_key_prevents_a_second_transport_call(self):
        self.collect_volumes()
        self.plan()
        report_date = dt.date(2026, 11, 9)
        with mock.patch.object(seo, "_today", return_value=report_date):
            self.weekly(report_date, today=report_date)
            calls = len(self.calls)
            artifact = self.state / "weekly" / "2026-11-09.json"
            artifact.unlink()
            output = self.weekly(report_date, today=report_date)

        self.assertEqual(len(self.calls), calls)
        self.assertTrue(all(request["cached"] for request in output["requests"]))
        self.assertEqual(output["actual_charge_usd"], 0.0)


class WholePilotTests(PilotCase):
    def test_initial_and_four_weekly_runs_share_one_usd_five_ledger(self):
        pricing_date = dt.date(2026, 11, 9)
        with mock.patch.object(seo, "_today", return_value=pricing_date):
            self.collect_volumes()
            self.plan()
            selected_path = self.state / "selected_serps.json"
            selected_before = selected_path.read_text(encoding="utf-8")
            self.collect_initial()
            for week in pilot.WEEKLY_DATES:
                self.weekly(week, today=week)
            selected_after = selected_path.read_text(encoding="utf-8")

        self.assertEqual(selected_before, selected_after)
        self.assertEqual(len(self.calls), 102)
        ledger = self.ledger()
        self.assertEqual(len(ledger["entries"]), 102)
        self.assertAlmostEqual(
            sum(entry["charged_usd"] for entry in ledger["entries"].values()), 0.38
        )
        self.assertTrue(
            all(entry["status"] == "settled" for entry in ledger["entries"].values())
        )

    def test_report_is_atomic_honest_and_includes_all_weekly_runs(self):
        pricing_date = dt.date(2026, 11, 9)
        with mock.patch.object(seo, "_today", return_value=pricing_date):
            self.collect_volumes()
            self.plan()
            self.collect_initial()
            for week in pilot.WEEKLY_DATES:
                self.weekly(week, today=week)
        report = self.invoke(
            "report", "--state-dir", str(self.state), "--repo-root", str(self.repo),
            today=dt.date(2026, 11, 30)
        )

        report_json = self.state / "evidence_report.json"
        report_markdown = self.state / "evidence_report.md"
        self.assertTrue(report_json.exists())
        self.assertTrue(report_markdown.exists())
        self.assertEqual(report["run_status"], "saved")
        self.assertEqual(report["pilot"]["ledger"]["charged_usd"], 0.38)
        self.assertEqual(report["pilot"]["ledger"]["unresolved_reserved_usd"], 0.0)
        self.assertEqual(report["pilot"]["selected_count"], 20)
        self.assertEqual(len(report["pilot"]["weekly_runs"]), 4)
        self.assertEqual(report["pilot"]["availability"]["ads_volume"]["status"], "complete")
        self.assertEqual(report["pilot"]["availability"]["organic_serps"]["status"], "complete")
        self.assertEqual(report["pilot"]["difficulty"], {"status": "unknown", "value": None})
        self.assertEqual(report["collection"]["date"], "2026-11-02")
        self.assertEqual(list(self.state.glob(".report.*")), [])

    def test_report_surfaces_unavailable_volume_results(self):
        with mock.patch.object(seo, "_today", return_value=dt.date(2026, 11, 9)):
            self.transport = fixture_transport(self.calls, fail_ads=True)
            self.collect_volumes()
            self.plan()
            self.collect_initial()
        report = self.invoke(
            "report", "--state-dir", str(self.state), "--repo-root", str(self.repo),
            today=dt.date(2026, 11, 30)
        )

        volume_status = report["pilot"]["availability"]["ads_volume"]
        self.assertEqual(volume_status["status"], "unavailable")
        self.assertEqual(len(volume_status["errors"]), 2)
        self.assertIn("note_errors", report["pilot"])
        self.assertTrue(
            all(row["volume_estimate"] is None for row in report["selected_serps"])
        )
        self.assertEqual(report["pilot"]["difficulty"], {"status": "unknown", "value": None})

    def test_reset_and_free_form_paid_flags_are_not_supported(self):
        with mock.patch("sys.stderr"):
            with self.assertRaises(SystemExit):
                self.invoke(
                    "weekly",
                    "--state-dir",
                    str(self.state),
                    "--reset",
                    today=TODAY,
                )
        self.assertEqual(self.calls, [])


if __name__ == "__main__":
    unittest.main()
