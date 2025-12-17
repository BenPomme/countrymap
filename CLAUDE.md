# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The World Truth Map** is a Next.js 14 interactive world map visualization that displays country-level statistics across 89 variables (health, demographics, economy, governance, sex/relationships, lifestyle, transport, environment, etc.) with 76% data coverage across 164 countries.

**Live Site:** https://theworldtruth.com

### Main Features
- **Interactive Map** (`/`) - Choropleth map with filtering and variable selection
- **Truthle** (`/truthle`) - Daily world facts quiz (flagship feature, Wordle-style)
- **Charts** (`/charts`) - Correlation explorer and country rankings
- **Discoveries** (`/discoveries`) - Browse 1,300+ correlations between variables
- **Quiz** (`/quiz`) - Random 20-question knowledge test

## Build & Development Commands

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build (runs correlations + static export)
npm run lint         # Run ESLint
npm run fetch-data   # Fetch fresh country data (npx tsx scripts/fetch-all-data.ts)
```

## Deployment

### GitHub Pages (Frontend)
**Deployment Method:** GitHub Actions → GitHub Pages
- Workflow file: `.github/workflows/deploy.yml`
- Triggers on push to `main` branch
- Builds static export to `./out` directory
- Deploys automatically (takes ~2-3 minutes)

```bash
git add -A && git commit -m "Your message" && git push origin main
```

### Firebase (Backend)
**Project ID:** `worldtruth-f9789`
**Services Used:**
- Firebase Authentication (Anonymous, Google, Email)
- Cloud Firestore (Truthle game state)

```bash
firebase deploy --only firestore:rules  # Deploy Firestore security rules
firebase deploy                          # Deploy all Firebase services
```

## Project Structure

```
countrymap/
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions deployment
├── data/
│   ├── countries.json          # Main dataset (~870KB, 164 countries, 89 variables)
│   └── correlations.json       # Precomputed correlations (built at build time)
├── public/
│   ├── ads.txt                 # Google AdSense authorization
│   ├── og-image.png            # Social sharing image
│   ├── truthle.png             # Truthle logo
│   ├── sitemap.xml             # SEO sitemap
│   └── robots.txt              # Crawler directives
├── scripts/
│   ├── compute-correlations.ts # Runs at build time
│   └── *.js                    # Data import scripts
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with SEO, AdSense, JSON-LD
│   │   ├── page.tsx            # Main map page
│   │   ├── truthle/            # Daily quiz game + shop
│   │   ├── charts/             # Charts and correlation explorer
│   │   ├── discoveries/        # Correlation browser
│   │   ├── quiz/               # Random quiz
│   │   └── privacy/            # Privacy policy
│   ├── components/
│   │   ├── maps/               # WorldMap.tsx
│   │   ├── filters/            # FilterPanel.tsx
│   │   ├── charts/             # Chart components
│   │   ├── share/              # VisualShare.tsx (screenshot sharing)
│   │   ├── ads/                # AdSense components
│   │   └── truthle/            # TruthleGame.tsx, RewardShop.tsx, AuthModal.tsx, AccountButton.tsx
│   ├── lib/
│   │   ├── constants/
│   │   │   ├── variables.ts    # 89 variable definitions
│   │   │   └── ads.ts          # AdSense configuration
│   │   ├── firebase/
│   │   │   └── config.ts       # Firebase initialization
│   │   ├── truthle/
│   │   │   ├── generator.ts    # Seeded daily question generation
│   │   │   ├── correlationQuestions.ts  # Correlation question types
│   │   │   ├── scoring.ts      # Score calculation
│   │   │   ├── storage.ts      # Firebase + localStorage + coins + share tracking
│   │   │   ├── coins.ts        # Coin earning/spending logic
│   │   │   └── rewards.ts      # Virtual rewards catalog
│   │   ├── quiz/
│   │   │   └── questionGenerator.ts
│   │   ├── data/
│   │   │   └── index.ts        # Data utilities
│   │   └── utils.ts            # Shared utilities (getNestedValue, etc.)
│   └── types/
│       └── country.ts          # TypeScript types, ColorVariable union
├── firestore.rules             # Firestore security rules
├── firebase.json               # Firebase configuration
└── next.config.js              # Next.js config (static export)
```

## Firebase Setup

### Configuration (`src/lib/firebase/config.ts`)
```typescript
const firebaseConfig = {
  apiKey: "AIzaSyATKR_CgZopNx44uXa7WELA_IQIoEHDmjM",
  authDomain: "worldtruth-f9789.firebaseapp.com",
  projectId: "worldtruth-f9789",
  storageBucket: "worldtruth-f9789.firebasestorage.app",
  appId: "1:653141420908:web:6a7c2b6cc9e8fde0dc6149"
}
```

### Authentication
- **Anonymous Auth**: Auto-creates persistent user ID for Truthle play tracking
- **Google Auth**: Optional account linking
- **Email Auth**: Full email registration with signup bonuses

#### Email Auth Functions (`src/lib/firebase/config.ts`)
- `signUpWithEmail(email, password, displayName?)` - Create new account
- `signInWithEmail(email, password)` - Login existing user
- `linkAnonymousToEmail(email, password, displayName?)` - Upgrade anonymous to email account
- `resetPassword(email)` - Send password reset email
- `logOut()` - Sign out user
- `subscribeToReminders(userId, email, displayName, enabled)` - Manage daily reminders

### Firestore Structure
```
firestore/
├── truthle/
│   └── daily/
│       └── {YYYY-MM-DD}/           # One document per day
│           └── {userId}/           # User's attempt
│               ├── score: number
│               ├── results: boolean[]
│               ├── times: number[]
│               ├── streak: number
│               └── timestamp: serverTimestamp
├── users/
│   └── {userId}/
│       ├── profile/data            # User profile (email, displayName, etc.)
│       └── wallet/balance          # Coins from offer completions
├── email_subscribers/
│   └── {userId}                    # Daily reminder preferences
│       ├── email: string
│       ├── displayName: string
│       ├── enabled: boolean
│       └── updatedAt: timestamp
└── mail/                           # Firebase Extension: Trigger Email queue
```

## Truthle System

**Daily World Facts Quiz** - Same questions for everyone, one attempt per day.

### How It Works
1. **Question Generation** (`src/lib/truthle/generator.ts`)
   - Uses date string as seed for Mulberry32 PRNG
   - Deterministically generates 10 questions (7-8 regular + 2-3 correlation questions)
   - Everyone worldwide gets identical questions for the same day
   - **Question Types**:
     - `highest` - "Which country has the highest X?"
     - `lowest` - "Which country has the lowest X?"
     - `compare` - "Which country has higher X?"
     - `direction` - "Are X and Y positively or negatively correlated?"
     - `yes_no` - "Is X correlated with Y?"
     - `strongest_pair` - "Which pair has the strongest correlation?"

2. **Scoring** (`src/lib/truthle/scoring.ts`)
   - Base: 100 points per correct answer
   - Speed bonus: +50 (<3s), +40 (<5s), +30 (<8s), +20 (<12s), +10 (<15s)
   - Streak bonus: +5% per consecutive day (max +50%)
   - Max theoretical score: ~1,500

3. **Play Tracking** (`src/lib/truthle/storage.ts`)
   - Firebase Anonymous Auth creates persistent user ID
   - Attempt saved to Firestore under user's UID
   - localStorage backup for offline/fast loading
   - Cannot play again until next day (UTC midnight)

4. **Sharing**
   - Wordle-style emoji grid (🟩🟥)
   - Score + percentile + streak
   - Native share API with clipboard fallback

5. **Rewards System** (`src/lib/truthle/coins.ts`, `rewards.ts`)
   - **Truthle Coins** - Virtual currency earned through gameplay
   - **Earning**: Daily play (10), correct answers (5/ea), speed bonus (2/ea), perfect (50), streaks (25-2000)
   - **Welcome bonus**: 100 coins for first game
   - **Email signup bonus**: 100 coins + Verified Player badge
   - **Share bonus**: 15 coins + Social Butterfly badge (first share)
   - **Shop** (`/truthle/shop`) - Purchase virtual rewards only (no physical gifts)

6. **Email Reminders** (requires Blaze plan)
   - Daily 9am UTC reminder for subscribers who haven't played
   - Opt-in during signup or in settings
   - Uses Firebase Extension: Trigger Email + SendGrid

### Rewards Catalog (`src/lib/truthle/rewards.ts`)
| Category | Items | Price Range |
|----------|-------|-------------|
| Badges | Globe Trotter, Data Nerd, Truth Seeker, etc. | 100-5000 coins |
| Themes | Dark, Ocean, Sunset, Neon, Gold, Rainbow | 200-1500 coins |
| Powerups | Streak Freeze, Hints, 50/50, Double Coins | 75-250 coins |
| Profile | Frames (Bronze/Silver/Gold), Titles | 100-2000 coins |

**Achievement Badges** (unlocked, not purchased):
- First Steps (play 1 game)
- Perfect 10 (all correct)
- Speed Demon (5 fast answers)
- Verified Player (email signup) - NEW
- Social Butterfly (first share) - NEW
- Week Warrior (7-day streak)
- Monthly Master (30-day streak)
- Century Legend (100-day streak)

### Offertoro Integration (Real Rewards)

Users can earn coins by completing offers (surveys, app installs, etc.) through Offertoro. The provider handles all reward fulfillment - no physical gifts to manage.

**Setup Required:**
1. Sign up at https://www.offertoro.com/publishers
2. Create an app and get your Publisher ID and Secret Key
3. Set environment variables:
   ```
   NEXT_PUBLIC_OFFERTORO_PUBID=your_publisher_id
   NEXT_PUBLIC_OFFERTORO_APPID=your_app_id
   ```
4. Set postback URL in Offertoro dashboard:
   ```
   https://us-central1-worldtruth-f9789.cloudfunctions.net/offertoroPostback?user_id={user_id}&amount={payout}&oid={offer_id}&sig={sig}
   ```
5. Set secret key in Firebase:
   ```bash
   firebase functions:config:set offertoro.secret="YOUR_SECRET_KEY"
   ```
6. Deploy Cloud Functions:
   ```bash
   cd functions && npm install && cd .. && firebase deploy --only functions
   ```

**Flow:**
1. User clicks "Earn Coins" tab in shop
2. Offertoro iframe shows available offers
3. User completes offer → Offertoro calls postback URL
4. Cloud Function verifies signature and credits coins to Firestore
5. Next time user visits shop, coins sync from cloud to local

### Daily Email Reminders Setup

**Requirements:** Firebase Blaze (pay-as-you-go) plan

**Step 1: Install Firebase Extension**
```bash
firebase ext:install firebase/firestore-send-email --project=worldtruth-f9789
```
During installation, configure:
- SMTP connection URI: `smtps://apikey:YOUR_SENDGRID_API_KEY@smtp.sendgrid.net:465`
- Email documents collection: `mail`
- Default FROM address: `noreply@theworldtruth.com`
- Templates collection: `email_templates`

**Step 2: Configure SendGrid**
1. Log in to https://app.sendgrid.com/
2. Go to Settings > API Keys > Create API Key (Full Access)
3. Copy the key (starts with `SG.`)
4. Go to Settings > Sender Authentication > Verify domain: `theworldtruth.com`

**Step 3: Create Email Template in Firestore**
Create document at `email_templates/truthle_daily_reminder`:
```json
{
  "subject": "Truthle #{{truthleDay}} is ready!",
  "html": "<h2>Hey {{userName}}!</h2><p>Today's Truthle is waiting for you.</p><p><a href='{{playUrl}}'>Play Now</a></p><p><small><a href='{{unsubscribeUrl}}'>Unsubscribe</a></small></p>"
}
```

**Step 4: Deploy Cloud Functions**
```bash
firebase deploy --only functions
```

The `sendDailyReminders` function runs at 9am UTC and sends emails to subscribers who haven't played.

## Correlation System

Computes Pearson correlations between all 89 numeric variables at build time.

**Script:** `scripts/compute-correlations.ts`
- Runs automatically during `npm run build`
- Outputs to `data/correlations.json`
- Filters to |r| >= 0.4 (moderate+)
- Currently: ~1,300 correlations (81 very strong, 441 strong)

## Adding New Data Variables

1. Add type to interface in `src/types/country.ts` (e.g., `HealthData`)
2. Add to `ColorVariable` union type in same file
3. Add config entry to `VARIABLES` in `src/lib/constants/variables.ts`
4. Update `data/countries.json` with actual values
5. Optionally add to `QUIZ_VARIABLES` in `src/lib/quiz/questionGenerator.ts`
6. Optionally add to `TRUTHLE_VARIABLES` in `src/lib/truthle/generator.ts`

## SEO Optimization

**IMPORTANT**: Update SEO when adding new features/pages:

### Checklist
1. Update meta tags in page's `layout.tsx`
2. Update `public/sitemap.xml` with new pages
3. Update keywords in `src/app/layout.tsx`
4. Update descriptions to reflect current stats count (89)
5. Check JSON-LD structured data in root layout

### Current Pages in Sitemap
- `/` - Main map (priority 1.0)
- `/truthle/` - Daily quiz (priority 1.0, changefreq: daily)
- `/truthle/shop/` - Rewards shop (priority 0.7)
- `/charts/` - Charts (priority 0.9)
- `/discoveries/` - Correlations (priority 0.9)
- `/quiz/` - Random quiz (priority 0.8)

## Monetization

### Google AdSense
- Publisher ID: `ca-pub-6325580740065771`
- Config: `src/lib/constants/ads.ts`
- Components: `src/components/ads/`
- Authorization: `public/ads.txt`

### Ad Placements
| Location | Slot | Component |
|----------|------|-----------|
| Main page header | headerBanner | AdBanner |
| Country detail | countryDetail | AdSidebar |
| Charts header | chartsBanner | AdBanner |
| Charts in-feed | chartsInFeed | AdBanner |

## Key Patterns

### Nested Data Access
Country data uses dot-notation paths like `'health.penisSize'` or `'democracy.score'`.
```typescript
import { getNestedValue } from '@/lib/utils'
const value = getNestedValue(country, 'health.lifeExpectancy')
```

### Static Export Constraints
- No server components
- No dynamic routes without `generateStaticParams`
- Images unoptimized (`next.config.js`)
- All data fetched at build time or client-side

### Date Handling (Truthle)
- All dates in UTC to ensure global consistency
- Day changes at midnight UTC
- `getTodayDateString()` returns `YYYY-MM-DD` in UTC
