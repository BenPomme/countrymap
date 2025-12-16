# Offertoro Setup Guide

This guide explains how to enable real rewards through Offertoro once your publisher account is approved.

## Prerequisites

- Offertoro publisher account (https://www.offertoro.com/publishers)
- Firebase Blaze plan (pay-as-you-go) for Cloud Functions
- Firebase CLI installed (`npm install -g firebase-tools`)

## Step 1: Get Your Offertoro Credentials

1. Log into Offertoro dashboard
2. Go to **Apps** → Create a new app or select existing
3. Note down:
   - **Publisher ID** (shown in your dashboard URL or app settings)
   - **App ID** (usually `1` for first app)
   - **Secret Key** (from Postback Settings)

## Step 2: Configure Environment Variables

Add to your `.env.local` file:

```bash
NEXT_PUBLIC_OFFERTORO_PUBID=your_publisher_id
NEXT_PUBLIC_OFFERTORO_APPID=1
```

For GitHub Actions deployment, add these as repository secrets:
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add `NEXT_PUBLIC_OFFERTORO_PUBID` and `NEXT_PUBLIC_OFFERTORO_APPID`

## Step 3: Configure Offertoro Postback URL

In Offertoro dashboard:

1. Go to **Apps** → Your App → **Postback Settings**
2. Set **Postback URL** to:
   ```
   https://us-central1-worldtruth-f9789.cloudfunctions.net/offertoroPostback
   ```
3. Add these **parameters**:
   ```
   ?user_id={user_id}&amount={payout}&oid={offer_id}&sig={sig}
   ```
4. Full URL should look like:
   ```
   https://us-central1-worldtruth-f9789.cloudfunctions.net/offertoroPostback?user_id={user_id}&amount={payout}&oid={offer_id}&sig={sig}
   ```
5. Set **Response on Success**: `1`
6. Set **Response on Failure**: `0`

## Step 4: Deploy Firebase Cloud Functions

```bash
# Login to Firebase (if not already)
firebase login

# Set your Offertoro secret key
firebase functions:config:set offertoro.secret="YOUR_SECRET_KEY_HERE"

# Install function dependencies
cd functions
npm install
cd ..

# Deploy functions and Firestore rules
firebase deploy --only functions,firestore:rules
```

## Step 5: Verify Setup

1. Rebuild and deploy your site:
   ```bash
   npm run build
   git add -A && git commit -m "Enable Offertoro" && git push
   ```

2. Visit https://theworldtruth.com/truthle/shop
3. You should now see the "Earn Coins" tab
4. Test with Offertoro's test postback feature

## Coin Conversion Rate

Current rate: **10 coins per cent** ($1 USD = 1,000 coins)

To change this, edit `functions/index.js`:
```javascript
const CENTS_TO_COINS = 10; // Change this value
```

Then redeploy functions:
```bash
firebase deploy --only functions
```

## Troubleshooting

### "Earn Coins" tab not showing
- Verify `NEXT_PUBLIC_OFFERTORO_PUBID` is set in environment
- Rebuild and redeploy the site

### Postbacks not working
- Check Firebase Functions logs: `firebase functions:log`
- Verify secret key matches: `firebase functions:config:get`
- Test postback URL manually in browser

### Coins not syncing
- User must visit the shop page to sync coins
- Check Firestore for `users/{uid}/wallet/balance` document
- Check `offertoro_postbacks` collection for duplicate detection

## Revenue Model

| User Action | You Earn | User Gets |
|-------------|----------|-----------|
| Video ad | ~$0.01-0.05 | 10-50 coins |
| Survey | ~$0.20-2.00 | 200-2000 coins |
| App install | ~$0.50-5.00 | 500-5000 coins |

You keep the revenue. Users redeem coins for virtual rewards (badges, themes, powerups).

## Files Reference

| File | Purpose |
|------|---------|
| `src/components/truthle/OfferWall.tsx` | Offer wall iframe component |
| `functions/index.js` | Cloud Functions for postbacks |
| `src/lib/truthle/storage.ts` | `syncCloudCoins()` function |
| `firestore.rules` | Security rules for wallet |

## Support

- Offertoro support: https://www.offertoro.com/contact
- Firebase docs: https://firebase.google.com/docs/functions
