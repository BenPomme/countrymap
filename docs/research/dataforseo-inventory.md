# DataForSEO public inventory evidence

Date: 2026-11-02

Status: implementation and fixture tests complete in the owned worktree. Collection, semantic SERP review and acceptance remain with the parent.

## Scope and sources

The helpers read local public source only. No paid call, HTTP client, account API, credential, private analytics extract, browser, server or production build was used.

Sources inspected:

- `src/lib/constants/variables.ts` and `src/lib/constants/extraVariables.ts`: 94 base metrics plus 12 additions, merged to 106 unique topics and 106 unique slugs.
- `src/lib/seo/slugs.ts` and `src/app/map/[slug]/`: the existing map route builder and URL shape.
- `public/sitemap.xml`: all 106 generated map URLs plus the existing editorial routes were checked.
- `data/countries.json` through the existing country catalogue: 164 countries. Country pages remain existing destinations; no new page is proposed here.
- The existing home, Truthle, True or False, comparison, quiz, charts and discoveries pages.

## Deterministic inventory

`build_inventory(repo_root)` derives every map slug with the same logic as `variableSlug`. It does not accept a manually guessed slug or URL.

Totals:

- 248 distinct candidate queries.
- 113 distinct existing URLs.
- 212 map queries covering 106 map topics, with two natural variants per topic.
- 36 editorial queries across the existing game and exploration URLs.
- Intent totals: informational 212, gameplay 17, exploration 10, comparison 9.
- Market combinations: 496 when each candidate is paired with the US and UK, below the 500 cap.

Map candidates are `<metric label> by country` and `map of <metric label> by country`. Game candidates cover daily play, comparison and discovery intent on their canonical existing routes. Existing distinct URLs satisfy these needs, so the output contains no new-page recommendation.

Query normalization removes accents and case, removes apostrophes, converts `&` to `and`, replaces other punctuation with spaces and collapses whitespace. The first source-derived display form is retained when variants merge. Volume lookup uses the same key.

A small phrase alias map turns unclear source labels into natural queries without changing their slugs or URLs. Examples include `importance of religion`, `cannabis legality`, `gambling legality`, `average age of marriage` and `average age of first sex`.

## SERP selection

`choose_serps(inventory, volume_rows, limit=20)` returns 20 rows by default across up to 10 diverse existing URLs and both markets:

- United States: location code 2840, language `en`.
- United Kingdom: location code 2826, language `en`.

Selection prefers supplied Google Ads monthly volume as an estimate. A supplied zero remains `0`; an absent or invalid estimate remains `None`. Competition and cost per click are not read as SEO difficulty. Ties use stable source order.

The returned volume field is evidence supplied by the parent, not a new measurement. No volume, difficulty, ranking, traffic, freshness or competitor value is fabricated.

## Evidence reporting

`read_ads_volume` and `read_organic_results` accept a mapping, list, JSON string or local JSON path. Nested DataForSEO task data can provide location, language, keyword, items and collection datetime. These helpers make no request.

`build_evidence_report` produces up to 10 existing URL priorities. Each priority includes its target query, page intent, US and UK volume estimates, supplied SERP evidence, pending review fields and interactive recommendations. A priority is marked `pending review` when no usable evidence was supplied.

Target URLs require both the canonical path and the `theworldtruth.com` or `www.theworldtruth.com` host. A competitor with the same path on another domain is not treated as the existing target.

Organic ranks 1 through 10 are observed. A supplied rank beyond 10 becomes `position: None` with `position_status: censored_beyond_depth`; it is unknown, not zero. A target absent from the supplied depth is `not_observed_in_depth`, which is not proof of absence. Competitor titles, snippets and dates appear only when present in the public payload.

SERP intent, source quality and freshness remain `pending review`; the parent owns semantic assessment. Provided dates are listed without claiming that they are current. Recommendations describe possible interactive improvements to existing pages and do not claim measured impact.

## Collection metadata and limits

The report records a collection date only when the parent supplies it or the exports contain one consistent date. It always records both market location codes and language `en`. This worker did not collect data, so it has no collection date to claim.

- Google Ads monthly search volume is a provider estimate that updates monthly; keyword variants may be grouped.
- Advertiser competition and cost per click differ from SEO difficulty.
- Provider SERP data does not prove indexing or ranking.
- Organic positions beyond depth 10 are unknown and censored, not zero.
- Source quality, freshness and search intent require parent review.
- Weekly tracking checks the same selected keyword SERPs. It does not repeat monthly volume collection.

## Checks

- `python3 -m unittest discover -s tests -p 'seo_inventory_test.py' -v`: 13 tests passed.
- `python3 -m py_compile scripts/seo/inventory.py scripts/seo/reporting.py tests/seo_inventory_test.py`: passed.
- `git diff --check` for owned implementation and test files: passed.

Fixtures cover deterministic totals and slugs, canonical sitemap URLs, query merging, 20 rows across 10 URLs, both market codes, zero versus missing volume, rank 10 observed, rank 11 censored, same-path competitor attribution and pending-review evidence output.

## Parent integration

The parent must supply the reviewed public Ads and organic exports, provide or accept the collection date, and perform SERP intent, source-quality and freshness review. No production change or acceptance is claimed by this leaf.
