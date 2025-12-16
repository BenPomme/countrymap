# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The World Truth Map is a Next.js 14 interactive world map visualization that displays country-level statistics across 70+ variables (health, demographics, economy, governance, sex/relationships, lifestyle, etc.). It includes:
- Interactive choropleth map with filtering and variable selection
- Charts page with correlation explorer and country rankings
- Quiz feature ("The Truth Quiz") with 20 random questions

## Build & Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build (static export to ./out)
npm run lint     # Run ESLint
npm run fetch-data  # Fetch fresh country data (npx tsx scripts/fetch-all-data.ts)
```

Deployment is automatic via GitHub Actions on push to main - builds and deploys to GitHub Pages.

## Architecture

### Data Flow
- Country data lives in `data/countries.json` (~870KB, 170+ countries)
- Type definitions in `src/types/country.ts` define the Country interface with nested data categories (health, sex, demographics, etc.)
- Variable configurations in `src/lib/constants/variables.ts` define how each of the 70+ ColorVariables is displayed (name, color scheme, format function, domain)
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

## Data Update Scripts

Scripts in `scripts/` folder update `data/countries.json`:
- Run with `node scripts/scriptname.js`
- Scripts read, modify, and write back to `data/countries.json`
- Follow the pattern: load JSON, iterate countries, update values, save
