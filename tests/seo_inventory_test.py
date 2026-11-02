"""Focused standard-library tests for the public SEO inventory helpers."""

from pathlib import Path
import re
import sys
import unittest


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "seo"))

import inventory  # noqa: E402
import reporting  # noqa: E402


def _rows(specs):
    return [
        {"keyword": keyword, "url": url, "intent": intent, "topic": topic}
        for keyword, url, intent, topic in specs
    ]


def _volume(keyword, location_code, volume, language="en"):
    return {
        "keyword": keyword,
        "location_code": location_code,
        "language_code": language,
        "search_volume": volume,
    }


def _ten_url_inventory():
    specs = [
        (f"metric {index} by country", f"/map/metric-{index}/", "informational", f"metric.{index}")
        for index in range(8)
    ]
    specs.extend(
        [
            ("truthle game", "/truthle/", "gameplay", "truthle"),
            ("true or false world", "/true-false/", "gameplay", "true-false"),
            ("country quiz", "/quiz/", "gameplay", "country-quiz"),
            ("country comparison charts", "/charts/", "exploration", "country-charts"),
        ]
    )
    return _rows(specs)


def _organic_item(rank, url, domain, **extra):
    item = {
        "type": "organic",
        "rank_group": rank,
        "url": url,
        "domain": domain,
    }
    item.update(extra)
    return item


def _organic_payload(items, keyword="metric 0 by country", location=2840):
    return {
        "tasks": [
            {
                "data": {
                    "location_code": location,
                    "language_code": "en",
                    "datetime": "2026-11-01",
                },
                "result": [{"keyword": keyword, "items": items}],
            }
        ]
    }


class RealInventoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.inventory = inventory.build_inventory(ROOT)

    def test_deterministic_source_derived_totals(self):
        self.assertEqual(self.inventory, inventory.build_inventory(ROOT))
        self.assertEqual(
            inventory.inventory_totals(self.inventory),
            {
                "candidate_queries": 248,
                "unique_urls": 113,
                "map_queries": 212,
                "map_topics": 106,
                "editorial_game_queries": 36,
                "by_intent": {
                    "comparison": 9,
                    "exploration": 10,
                    "gameplay": 17,
                    "informational": 212,
                },
            },
        )
        self.assertLessEqual(len(self.inventory), inventory.MAX_CANDIDATE_QUERIES)
        self.assertLessEqual(len(self.inventory) * 2, inventory.MAX_MARKET_COMBINATIONS)
        self.assertEqual(set(self.inventory[0]), {"keyword", "url", "intent", "topic"})

    def test_queries_are_distinct_and_urls_are_canonical(self):
        keys = [inventory.normalize_query(row["keyword"]) for row in self.inventory]
        self.assertEqual(len(keys), len(set(keys)))
        self.assertTrue(all(row["url"].endswith("/") for row in self.inventory))
        sitemap_urls = set(re.findall(r"<loc>https://theworldtruth\.com([^<]+)</loc>", (ROOT / "public" / "sitemap.xml").read_text()))
        self.assertTrue({row["url"] for row in self.inventory} <= sitemap_urls)

    def test_map_slugs_come_from_existing_builder(self):
        map_urls = {row["url"] for row in self.inventory if row["url"].startswith("/map/")}
        sitemap_map_urls = {
            url for url in re.findall(r"<loc>https://theworldtruth\.com(/map/[^<]+/)</loc>", (ROOT / "public" / "sitemap.xml").read_text())
        }
        self.assertEqual(map_urls, sitemap_map_urls)
        self.assertEqual(len(map_urls), 106)
        for expected in (
            "/map/women-s-legal-rights/",
            "/map/mcdonald-s-per-capita/",
            "/map/fdi-inflows-gdp/",
            "/map/co2-per-capita/",
        ):
            self.assertIn(expected, map_urls)

    def test_game_and_tool_urls_are_existing_routes(self):
        urls = {row["url"] for row in self.inventory if not row["url"].startswith("/map/")}
        self.assertEqual(
            urls,
            {"/", "/truthle/", "/true-false/", "/truthle-vs-worldle/", "/quiz/", "/charts/", "/discoveries/"},
        )

    def test_query_normalization_merges_punctuation_variants(self):
        self.assertEqual(
            inventory.normalize_query("McDonald's per CAPITA"),
            inventory.normalize_query("mcdonalds per capita"),
        )
        self.assertIn("mcdonald's per capita by country", {row["keyword"] for row in self.inventory})

    def test_awkward_source_labels_become_natural_queries(self):
        queries = {row["keyword"] for row in self.inventory}
        self.assertIn("importance of religion by country", queries)
        self.assertIn("cannabis legality by country", queries)
        self.assertIn("average age of marriage by country", queries)
        self.assertNotIn("religion very important by country", queries)


class SerpSelectionTests(unittest.TestCase):
    def test_default_selection_uses_ten_urls_and_both_markets(self):
        selected = inventory.choose_serps(_ten_url_inventory(), [])
        self.assertEqual(len(selected), 20)
        self.assertEqual(len({row["url"] for row in selected}), 10)
        self.assertEqual({row["location_code"] for row in selected}, {2840, 2826})
        self.assertEqual({row["language_code"] for row in selected}, {"en"})
        self.assertTrue(all(row["keyword"] for row in selected))

    def test_missing_volume_is_none_and_real_zero_stays_zero(self):
        fixture = _rows(
            [
                ("metric 0 by country", "/map/metric-0/", "informational", "metric.0"),
                ("metric 1 by country", "/map/metric-1/", "informational", "metric.1"),
            ]
        )
        volumes = [
            _volume("metric 0 by country", 2840, None),
            _volume("metric 0 by country", 2840, 0),
            _volume("metric 0 by country", 2840, None),
        ]
        selected = inventory.choose_serps(fixture, volumes, limit=4)
        metric_zero_us = next(
            row
            for row in selected
            if row["url"] == "/map/metric-0/" and row["location_code"] == 2840
        )
        metric_zero_uk = next(
            row
            for row in selected
            if row["url"] == "/map/metric-0/" and row["location_code"] == 2826
        )
        self.assertEqual(metric_zero_us["volume_estimate"], 0)
        self.assertIsNone(metric_zero_uk["volume_estimate"])
        self.assertTrue(
            all(
                row["volume_estimate"] is None
                for row in selected
                if row["url"] == "/map/metric-1/"
            )
        )


class ReportingTests(unittest.TestCase):
    def test_organic_depth_ten_is_observed_and_eleven_is_censored(self):
        observed_payload = _organic_payload(
            [_organic_item(10, "https://theworldtruth.com/map/metric-0/", "theworldtruth.com")]
        )
        censored_payload = _organic_payload(
            [_organic_item(11, "https://theworldtruth.com/map/metric-0/", "theworldtruth.com")]
        )
        observed = reporting.read_organic_results(observed_payload)[0]["items"][0]
        censored = reporting.read_organic_results(censored_payload)[0]["items"][0]
        self.assertEqual((observed["position"], observed["position_status"]), (10, "observed"))
        self.assertEqual((censored["position"], censored["position_status"]), (None, "censored_beyond_depth"))
        self.assertIsNotNone(censored["position_status"])

    def test_same_path_on_competitor_domain_is_not_the_target(self):
        fixture = _rows(
            [("metric 0 by country", "/map/metric-0/", "informational", "metric.0")]
        )
        payload = _organic_payload(
            [
                _organic_item(
                    2,
                    "https://competitor.example/map/metric-0/",
                    "competitor.example",
                    title="Competitor page",
                    description="Provided competitor snippet",
                    date="2026-10-30",
                )
            ]
        )
        report = reporting.build_evidence_report(fixture, [], payload, limit=2)
        us_serp = next(
            item
            for item in report["priorities"][0]["serp_evidence"]
            if item["location_code"] == 2840
        )
        self.assertEqual(us_serp["target_position_status"], "not_observed_in_depth")
        self.assertIsNone(us_serp["target_position"])
        self.assertEqual(us_serp["competitors"][0]["domain"], "competitor.example")
        self.assertEqual(us_serp["competitors"][0]["snippet"], "Provided competitor snippet")
        self.assertEqual(us_serp["competitors"][0]["date"], "2026-10-30")

    def test_target_host_accepts_www_and_uses_rank_status(self):
        fixture = _rows(
            [("metric 0 by country", "/map/metric-0/", "informational", "metric.0")]
        )
        payload = _organic_payload(
            [
                _organic_item(
                    3,
                    "https://www.theworldtruth.com/map/metric-0/",
                    None,
                    title="Existing map",
                )
            ]
        )
        report = reporting.build_evidence_report(fixture, [], payload, limit=2)
        us_serp = next(
            item
            for item in report["priorities"][0]["serp_evidence"]
            if item["location_code"] == 2840
        )
        self.assertEqual((us_serp["target_position"], us_serp["target_position_status"]), (3, "observed"))

    def test_report_builds_ten_existing_url_priorities_with_pending_evidence(self):
        report = reporting.build_evidence_report(_ten_url_inventory(), [], None)
        self.assertEqual(len(report["priorities"]), 10)
        self.assertTrue(all(item["url_status"] == "existing" for item in report["priorities"]))
        self.assertTrue(
            all(len(item["market_metrics"]) == 2 for item in report["priorities"])
        )
        self.assertEqual(
            {item["location_code"] for item in report["collection"]["locations"]},
            {2840, 2826},
        )
        self.assertEqual(report["collection"]["language_code"], "en")
        self.assertIsNone(report["collection"]["date"])
        self.assertTrue(
            all(item["evidence_status"] == "pending review" for item in report["priorities"])
        )
        self.assertEqual(report["weekly_tracking"]["tracked_pairs"], 20)

    def test_report_keeps_zero_separate_from_missing_and_marks_review_pending(self):
        fixture = _rows(
            [("metric 0 by country", "/map/metric-0/", "informational", "metric.0")]
        )
        us_volume = {
            **_volume("metric 0 by country", 2840, 0),
            "collected_at": "2026-11-01",
        }
        uk_volume = {
            **_volume("metric 0 by country", 2826, None),
            "collected_at": "2026-11-01",
        }
        payload = _organic_payload(
            [
                _organic_item(
                    3,
                    "https://theworldtruth.com/map/metric-0/",
                    "theworldtruth.com",
                    date="2026-10-31",
                ),
                _organic_item(
                    2,
                    "https://competitor.example/metric-zero",
                    "competitor.example",
                    title="Provided title",
                    description="Provided snippet",
                    date="2026-10-30",
                ),
            ]
        )
        report = reporting.build_evidence_report(
            fixture,
            [us_volume, uk_volume],
            payload,
            limit=2,
            collection_date="2026-11-01",
        )
        priority = report["priorities"][0]
        metrics = {item["location_code"]: item for item in priority["market_metrics"]}
        us_serp = next(
            item for item in priority["serp_evidence"] if item["location_code"] == 2840
        )
        self.assertEqual(report["collection"]["date"], "2026-11-01")
        self.assertEqual(report["collection"]["collection_dates"], ["2026-11-01"])
        self.assertEqual(metrics[2840]["volume_estimate"], 0)
        self.assertIsNone(metrics[2826]["volume_estimate"])
        self.assertEqual(priority["intent"], "informational")
        self.assertEqual(priority["serp_intent_review"], "pending review")
        self.assertEqual(priority["source_quality"], "pending review")
        self.assertIn("freshness assessment pending review", priority["freshness"])
        self.assertEqual(us_serp["target_position"], 3)
        self.assertEqual(us_serp["competitors"][0]["snippet"], "Provided snippet")
        self.assertEqual(us_serp["competitors"][0]["date"], "2026-10-30")
        markdown = reporting.render_evidence_markdown(report)
        self.assertIn("2026-11-01", markdown)
        self.assertIn("Observed at position 3", markdown)
        self.assertIn("Provided snippet", markdown)
        self.assertIn("pending review", markdown)
        self.assertIn("unknown and censored, not position zero", markdown)
