# Embeds

Every stat map can be embedded via iframe (backlinks + referral traffic):

```html
<iframe src="https://theworldtruth.com/embed/<slug>/" width="100%" height="480" loading="lazy"></iframe>
```

- `<slug>` = any `/map/<slug>/` page (see `public/sitemap.xml`), e.g. `gdp-per-capita`, `democracy-score`, `press-freedom`.
- Embed pages are noindex and disallowed in robots.txt; canonical/indexable page is `/map/<slug>/`.
- Copy-paste snippet is shown on each map page ("Embed this map", `src/app/map/[slug]/EmbedSnippet.tsx`).
- Outreach targets: bloggers, teachers, newsletter writers, Reddit/forum answers citing country stats.
