# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The World Truth Map is a Next.js 14 interactive world map visualization that displays country-level statistics across 89 variables (health, demographics, economy, governance, sex/relationships, lifestyle, transport, environment, etc.) with 76% data coverage across 164 countries. It includes:
- Interactive choropleth map with filtering and variable selection
- Charts page with correlation explorer and country rankings
- Discoveries page showing 1,300+ correlations between variables
- Quiz feature ("The Truth Quiz") with 20 random questions

## Build & Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build (static export to ./out)
npm run lint     # Run ESLint
npm run fetch-data  # Fetch fresh country data (npx tsx scripts/fetch-all-data.ts)
```

## Deployment

**Live Site:** https://benpomme.github.io/countrymap/

**Deployment Method:** GitHub Actions → GitHub Pages
- Workflow file: `.github/workflows/deploy.yml`
- Triggers on push to `main` branch
- Builds static export to `./out` directory
- Deploys to GitHub Pages automatically

To deploy changes:
```bash
git add -A && git commit -m "Your message" && git push origin main
```
The GitHub Action will automatically build and deploy (takes ~2-3 minutes).

## Correlation System

The site computes Pearson correlations between all 89 numeric variables at build time.

**Script:** `scripts/compute-correlations.ts`
- Runs automatically during `npm run build`
- Outputs to `data/correlations.json`
- Filters to correlations with |r| >= 0.4
- Currently finds ~1,300 correlations (81 very strong, 441 strong)

**Discoveries Page:** `/discoveries`
- Displays all correlations sorted by strength
- Filterable by category, strength, search
- Links to scatter plot on charts page

## Architecture

### Data Flow
- Country data lives in `data/countries.json` (~870KB, 170+ countries)
- Type definitions in `src/types/country.ts` define the Country interface with nested data categories (health, sex, demographics, etc.)
- Variable configurations in `src/lib/constants/variables.ts` define how each of the 89 ColorVariables is displayed (name, color scheme, format function, domain)
- Correlation data in `data/correlations.json` (~1,300 correlations computed at build time)
- Data utilities in `src/lib/data/index.ts` handle filtering and statistics

### Key Patterns
- **Nested data access**: Country data uses dot-notation paths like `'health.penisSize'` or `'democracy.score'`. Use `getNestedValue()` from `src/lib/utils` to access them.
- **ColorVariable type**: Union type of all valid variable paths - must be updated in `src/types/country.ts` when adding new variables
- **VARIABLES config**: Each variable needs a corresponding entry in `src/lib/constants/variables.ts` with display name, domain, color scheme, and format function

### Static Export
- Configured for static export (`output: 'export'` in next.config.js)
- All pages must be static-compatible (no server components, dynamic routes need generateStaticParams)
- Images are unoptimized for static hosting

### Component Structure
- `src/components/maps/WorldMap.tsx` - Main map using react-simple-maps with d3 color scales
- `src/components/filters/FilterPanel.tsx` - Variable selector and filters sidebar
- `src/components/share/VisualShare.tsx` - html2canvas-based screenshot sharing
- `src/components/ads/` - Google AdSense ad components

### Quiz System
- `src/lib/quiz/questionGenerator.ts` - Generates random questions from available data
- Question types: highest, lowest, compare, true_false, guess_value
- Uses QUIZ_VARIABLES array to determine which variables to include

## Adding New Data Variables

1. Add type to the appropriate interface in `src/types/country.ts` (e.g., `HealthData`, `SexData`)
2. Add to `ColorVariable` union type in the same file
3. Add configuration entry to `VARIABLES` in `src/lib/constants/variables.ts`
4. Update `data/countries.json` with actual data values
5. Optionally add to `QUIZ_VARIABLES` in `src/lib/quiz/questionGenerator.ts`

## SEO Optimization

**IMPORTANT**: Whenever making significant changes (new features, new data, new pages), ensure SEO is updated:

### Checklist for SEO Updates
1. **Update meta tags** in layout.tsx files if adding new features/pages
2. **Update sitemap.xml** (`public/sitemap.xml`) when adding new pages
3. **Update keywords** in `src/app/layout.tsx` if adding new data categories
4. **Update descriptions** to reflect current statistics count (currently 89)
5. **Check JSON-LD structured data** in root layout if features change

### Current SEO Setup
- **Meta tags**: Each page has dedicated `layout.tsx` with Metadata export
- **Structured data**: JSON-LD in root layout (WebApplication, Dataset, Organization, WebSite schemas)
- **Sitemap**: `public/sitemap.xml` lists all main pages
- **Robots.txt**: `public/robots.txt` with crawler directives
- **Open Graph/Twitter**: Social sharing meta tags with og-image.png

## Data Update Scripts

Scripts in `scripts/` folder update `data/countries.json`:
- Run with `node scripts/scriptname.js`
- Scripts read, modify, and write back to `data/countries.json`
- Follow the pattern: load JSON, iterate countries, update values, save
