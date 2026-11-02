# Provenance audit report

LANE=provenance

Date: 2026-11-02

Status: implementation and focused checks complete in the owned worktree. Coordinator integration, production build, browser QA and acceptance remain pending.

## Changed paths

- `src/lib/seo/sourceNotes.ts` - corrected and qualified the six existing source notes while preserving every existing source URL.
- `src/lib/seo/provenance.ts` - added the `getMetricProvenance(id)` contract, separate audit evidence, coverage values, and fail-closed feature/quiz gates.
- `tests/provenance.test.ts` - added dataset, primary-source, metadata, rounding and promotion regression tests.
- `docs/research/provenance-checkpoint.md` - compact implementation checkpoint.
- `docs/research/provenance-report.md` - this evidence report.

No dataset, page, dependency, URL, saved progress, credit or virtual-item file was changed.

## Implementation

`getMetricProvenance(id)` returns `sourceUrl`, `sourceName`, optional `year`, finite numeric `coverage`, `limitations`, `featuredEligible` and `quizEligible`. The separate `getMetricProvenanceAudit(id)` exposes `auditStatus`, `matchStatus`, `verifiedDate`, evidence, primary year, definition, denominator vintage, bundled and verified counts, coverage and limitations.

Promotion fails closed unless the audit is `verified-complete`, the match is `complete`, and the verified count equals the actual bundled value count. URL presence alone never promotes a metric. Undocumented metrics retain any existing source note URL and remain browse-only.

## Checks run

- `node --import tsx --test tests/provenance.test.ts` - 8 tests passed, 0 failed, 0 skipped.
- `npx tsc --noEmit --pretty false` - passed with no diagnostics.
- `git diff --check` - passed.
- The tests apply the actual `mergeOverlay` path and confirm the bundle has 164 countries, all six documented metric counts and coverage values, and the expected promotion gates.
- The RSF test parsed the coordinator CSV and compared every bundled value. Result: 180 source rows, 164 exact matches, 0 mismatches, 0 missing bundled countries, 16 source-only rows.
- The WHR test parsed the coordinator XLSX Figure 2.1 workbook and compared every bundled value. Result: 147 rows for evaluation year 2025, 140 exact matches, 0 mismatches, 0 bundled non-null values without a source row, 24 bundled nulls, 7 source-only rows.

The primary-source tests require the coordinator downloads under `coordination/public-sources`; they skip with an explicit message if those files are absent. The checked-in tests passed with both files present.

## Per-metric verdicts

### RSF press freedom

- Verdict: `verified-complete`, `complete`.
- Source: `https://rsf.org/en/index?year=2026`, official 2026 CSV collected 2 November 2026.
- Primary year: 2026.
- Bundled and verified values: 164 of 164. Coverage: 100 percent.
- Mismatches: none. Missing bundled countries: none.
- Source-only rows: Liechtenstein, Cabo Verde, Fiji, North Macedonia, Samoa, Seychelles, Tonga, Belize, OECS, Malta, Comoros, Northern Cyprus, Kosovo, Maldives, Hong Kong and Palestine.
- Definition: composite 0 to 100 press-freedom index score, higher is more freedom. It is not a rate, so no denominator vintage applies.
- Promotion: featured and quiz eligible.

### WHR happiness

- Verdict: `verified-complete`, `complete`.
- Source: `https://worldhappiness.report/ed/2026/`, official Figure 2.1 XLSX collected 2 November 2026.
- Primary year: 2023-2025 three-year average, reported in the 2025 evaluation rows.
- Bundled and verified values: 140 of 140 non-null values. Coverage: 85.4 percent.
- Mismatches: none. The 24 bundled countries without a WHR value remain null.
- Source-only rows: Kosovo, Belize, Malta, North Macedonia, Hong Kong SAR of China, State of Palestine and Comoros.
- Definition: Gallup World Poll life evaluation on a 0 to 10 scale. It is an average score, not a rate.
- Promotion: featured and quiz eligible.

### IMF nominal GDP per capita

- Verdict: `unknown`, `unknown`.
- Source landing page: `https://www.imf.org/external/datamapper/NGDPDPC@WEO`.
- The landing URL exists, but a checkable October 2026 edition and raw series were not available. Raw API requests were blocked with HTTP 403 during the coordinator audit.
- Bundled values: 157. Verified primary values: 0. Coverage: 95.7 percent.
- Year is omitted because the estimate year is not verified. No bundled value is called false or correct.
- Promotion: browse-only.

### IMF PPP GDP per capita

- Verdict: `unknown`, `unknown`.
- Source landing page: `https://www.imf.org/external/datamapper/PPPPC@WEO`.
- The landing URL exists, but a checkable October 2026 edition and raw series were not available. Raw API requests were blocked with HTTP 403 during the coordinator audit.
- Bundled values: 157. Verified primary values: 0. Coverage: 95.7 percent.
- Year is omitted because the estimate year is not verified. No parity claim is made, and PPP is not treated as interchangeable with nominal GDP per capita.
- Promotion: browse-only.

### McDonald's restaurants per capita

- Verdict: `verified-sample`, `sample`.
- Source: `https://corporate.mcdonalds.com/content/dam/sites/corp/nfl/pdf/Restaurants%20by%20Market%202025.pdf`, counts as of 31 December 2025.
- Coordinator-verified counts: US 13,706; France 1,630; UK 1,507; Australia 1,092.
- US, France and UK reconcile at one-decimal published precision using rounded bundled populations. Australia implies 42.0 per million from 1,092 restaurants and 26,000,000 people, while the bundle stores 41.4. This mismatch is disclosed rather than repaired.
- Bundled values: 85. Verified sample values: 3. Coverage: 51.8 percent.
- Limitations: the population denominator vintage is unknown; market counts consolidate territories unevenly; the US count includes Cuba, Guam and Saipan; full 85-value source parity was not available.
- Promotion: browse-only.

### Forbes billionaires per capita

- Verdict: `verified-sample`, `sample`.
- Source: `https://www.forbes.com/sites/samellefson/2026/03/11/the-countries-with-the-most-billionaires/`, article dated 11 March 2026.
- Coordinator-verified citizenship counts: US 989; China 539; India 229; Germany 212; Russia 147. The article reports 3,428 billionaires across 80 countries and territories.
- All five sample counts reconcile to the stored one-decimal rates using rounded bundled populations.
- Bundled values: 70. Verified sample values: 5. Coverage: 42.7 percent.
- Limitations: full 70-country source parity was not available; the population denominator vintage is unknown; Forbes uses citizenship, not residence, and reports Hong Kong separately from China.
- Promotion: browse-only.

## Remaining unverified states

- IMF nominal and PPP editions, raw values, estimate year and denominator basis remain unknown, not contradicted.
- McDonald's full market parity, territory allocation and population vintage remain unverified. The Australia rounding mismatch remains deliberately unresolved in data.
- Forbes full source parity and population vintage remain unverified.
- No production build, browser run, integration test, live source call or acceptance run was performed by this leaf.
- The required shared checkpoint and coordination report paths are outside this leaf's writable sandbox. This report is preserved under the owned `docs/research` path for coordinator collection.

This report is implementation evidence, not final acceptance.
