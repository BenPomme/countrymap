# Provenance checkpoint

- Lane: provenance
- Date: 2026-11-02
- Status: implementation complete in the owned worktree; coordinator integration and acceptance pending
- Scope: `src/lib/seo/sourceNotes.ts`, new `src/lib/seo/provenance.ts`, `tests/provenance*.test.ts`, `docs/research/provenance*.md`
- Bundled dataset: 164 countries after the actual `mergeOverlay` path; no dataset values will be changed
- RSF 2026 audit: 164 of 164 bundled values matched the official CSV exactly; no missing or contradictory values
- WHR 2026 audit: 140 of 140 bundled non-null values matched the Figure 2.1 XLSX 2025 rows exactly; 24 bundled countries have no WHR value
- McDonald's 2026 audit: sample source counts are only partly reconcilable with rounded bundled populations; territory consolidation and denominator vintage remain unresolved
- Forbes 2026 audit: five sample counts reconcile to rounded bundled values; full 70-country parity and denominator vintage remain unverified
- IMF audits: landing URLs exist, but the October 2026 edition and raw nominal/PPP values were not available; value parity remains unknown
- Promotion plan: RSF and WHR eligible; McDonald's, Forbes, IMF nominal and IMF PPP browse-only pending complete appropriate evidence
- Checks: `node --import tsx --test tests/provenance.test.ts` passed 8 of 8; `npx tsc --noEmit --pretty false` passed; `git diff --check` passed
- Verification boundary: no production build, browser run, live source call or acceptance run was performed
- Report path note: the shared `.scratch/CHECKPOINT.md` and coordination report targets are outside this leaf's writable sandbox; durable checkpoint kept here and final report will be generated under this owned path for coordinator collection
