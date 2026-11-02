# Homepage and shared magazine design

## Scope

This note covers the `LANE=design` work for the static Next.js site. It is pre-production until the coordinator completes integration and acceptance. Production code stays within the owned paths:

- `src/app/page.tsx`
- `src/app/globals.css`
- `tailwind.config.ts`
- `src/components/site/**`
- `public/fonts/**`
- `docs/design-*.md`

## Homepage composition

The home page opens with one provenance-gated editorial fact, then keeps the existing map explorer as the main interactive element. The sequence is:

1. Site header with Explore maps, Discoveries, Play today and Rewards & codes.
2. Featured press freedom fact with source, vintage, coverage, limitations link and canonical map link.
3. A compact top-five list from the same eligible measure.
4. Play today panel linking to Truthle, True or False and Rewards.
5. The existing country map, filters, country detail panel, visual share and data source dialog.
6. Site footer mounted once by the root layout.

There are no merchant offer or replacement promotion teasers. Game coin rewards and the separate friend Extra Attempt gift are not changed by this lane.

## Visual system

The shared palette is:

- Paper: `#fff9e8`
- Ink: `#192947`
- Blue: `#294cc4`
- Yellow: `#ffda62`
- Coral: `#dc654e`
- Green: `#246e55`

Tailwind exposes the palette under `twt-*` and aliases yellow as both `twt-butter` and `twt-yellow`. The shared contract classes live in `src/app/globals.css`:

- `twt-shell`
- `twt-container`
- `twt-display`
- `twt-panel`
- `twt-button`
- `twt-button-secondary`
- `twt-kicker`
- `twt-prose`

Blue is used for primary actions. Borders, offset shadows, asymmetric editorial spacing and the map surface keep the page playful without falling back to a grid of identical promotion cards. Secondary copy uses at least 65 percent ink on paper or 75 percent white on blue. The main body copy uses higher contrast.

Focus styles use a yellow outer outline and ink ring. Interactive controls keep minimum touch heights near 44 pixels. The mobile filter drawer uses only motion-safe transitions, and reduced motion removes the shared button movement and smooth page scrolling.

## Typography and licences

Local font files are stored at:

- `public/fonts/bricolage-grotesque/BricolageGrotesque-Variable.ttf`
- `public/fonts/source-sans-3/SourceSans3-Variable.ttf`

Their licence files are beside the fonts as `OFL.txt`. Both fonts use `font-display: swap`. The exact source hashes are:

- Bricolage Grotesque: `413e7357809ddd12fd80a96a8a396de0e401638d4acd3cb3e37532f0472ac682`
- Source Sans 3: `042fe2cc0b933e328410d7acbd0aa6a1873dca5aef81875f4bc214b08825c7b9`

WOFF2 conversion was not performed. The installed environment had no `fontTools`, Brotli module, `woff2_compress` or `ttf2woff2` command. The CSS therefore uses the exact local TTF assets with system fallbacks and has no external runtime font request.

Root integration must remove the Google `Inter` import from `src/app/layout.tsx`. The current root body class would override the local body stack until that happens.

## Provenance gating

The featured section calls `getMetricProvenance(id)` from `src/lib/seo/provenance.ts`. It prefers `freedom.pressFreedom`, then considers other numeric catalogue entries. A metric is shown only when `featuredEligible` is true and at least one ranked country has a value. The page does not mark a metric as verified by itself and does not infer eligibility from a source URL.

The source name, source link, vintage and stated coverage appear next to the claim. If no metric is eligible, the page keeps the map and dataset available but states that featured facts appear after review. It does not invent a fact, percentile, deal or verification state.

The provenance module is owned by the SEO lane and is not present in this design worktree. Its absence is the only TypeScript error in the owned files.

## URL and share contract

The homepage still reads `?var=` on load and resolves either a catalogue id or slug. It also reads supported map filter parameters through `src/components/site/mapLinks.ts`:

- `democracy_min`, `democracy_max`
- `poverty_min`, `poverty_max`
- `gdp_min`, `gdp_max`
- `gender_min`, `gender_max`
- `happiness_min`, `happiness_max`
- `iq_min`, `iq_max`
- repeated `religion`
- repeated `region`
- `conflict=true` or `conflict=false`

Religion and region values are checked against the shared catalogues. Numeric values outside the supported bounds are discarded. Neutral endpoints are omitted from generated sharing URLs. An invalid map slug falls back to `press-freedom`, and the path shape remains `/map/<slug>/`. The builder uses the current browser origin in the client and `https://theworldtruth.com` outside the browser.

The map share action receives the selected metric slug plus active filters. The copy action uses the same URL. Clipboard success and failure states are intentionally local and do not claim that a handoff completed.

The map page must consume `parseMapFilters`, apply the parsed selection and update the address when appropriate. That page is owned by the map lane and was not edited here.

## Explorer behavior

The homepage keeps the existing country data, `filterCountries` behavior, map component, ad slots, visual share component and country detail links. It adds filter summaries and a share URL without changing the game economy, credits, saved progress or country routes. The data sources dialog closes with Escape or its close button and moves initial focus to that button.

Known adjacent gaps for integration:

- `src/lib/data/index.ts` does not apply `happinessMin`, `happinessMax`, `iqMin` or `iqMax` even though the filter type and URL helper support them.
- The current map page does not consume the shared filter query parameters.
- The root layout does not yet mount `SiteHeader` or `SiteFooter`, and existing map pages need duplicate chrome removal when it does.

## Validation

Focused checks for this lane:

- `npx tsc --noEmit --pretty false --incremental false` reports only the missing SEO provenance module.
- `.scratch/maplinks-check.ts` passes 21 parse, validation, neutral-endpoint, canonical-path and fallback assertions when bundled and run with local `esbuild`.
- Font hashes match the coordinator source assets.
- Owned production files contain no removed merchant reference, discount claim, unavailable partner promotion or em/en dash.

Not verified by this lane: production build, static export, browser rendering, responsive screenshots, font loading, clipboard permissions, map query consumption, provenance runtime data, root chrome duplication, hydration and final acceptance.
