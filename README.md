# AxTrader — Institutional Precision Trading Signals

> A mobile-first Progressive Web App delivering crypto, forex, and stocks trading signals, a full learning academy, and an automated premium subscription system. Also shipped as a native Android app (TWA) for the Play Store.

**Live:** https://axtrader.vercel.app
**Play Store:** in progress — see "Android / Play Store" below before submitting.

> ⚠️ **Domain note:** this repo's GitHub "Website" field has been seen
> pointing at `asterix-gwp.vercel.app` instead of `axtrader.vercel.app`.
> Every canonical reference INSIDE the app (this README, `manifest.json`,
> `twa-manifest.json`, `android/app/build.gradle`'s `hostName`, and every
> in-app URL in `index.html`) consistently says `axtrader.vercel.app` —
> that is the real, correct domain. `asterix-gwp.vercel.app` is almost
> certainly the Vercel project's own auto-generated default alias
> (Vercel names it after the *project*, not the custom domain you add on
> top) left over from when this Vercel project was created — `axtrader.vercel.app`
> was added afterward as a custom domain, and the GitHub "Website" field
> never got updated to match. To fix: (1) on GitHub, repo home → the gear
> icon next to "About" → change **Website** to `https://axtrader.vercel.app`
> → Save. (2) On Vercel, open this project → **Settings → Domains** and
> confirm `axtrader.vercel.app` is set as the **Production** domain — if
> `asterix-gwp.vercel.app` is still resolving to a live deployment,
> either remove it or redirect it to `axtrader.vercel.app` so there's
> only one canonical origin (duplicate live origins is also bad for the
> TWA's Digital Asset Link verification — see below).

---

## What It Does

- **Trading Signals** — Crypto, Forex, and Stocks signals from **two independent engines merged into one feed**: the [gwp-bots](https://github.com/) repo (Volume Profile POC/VAH/VAL + Fibonacci, D1/2H/30M/15M multi-timeframe vote — the "real" GWP engine, source-tagged `gwp-bots`) and this repo's own `scripts/signal_bot.py` (pure price-action ICT/SMC — market structure, BOS/CHoCH, order blocks, FVGs, source-tagged `ict-smc`). Both publish to the same shared GitHub Gist (read-merge-write, never clobbering each other) which `/api/signals.js` proxies to the app.
- **Academy** — ICT, SMC, and GWP deep-dive courses (free tier + premium)
- **Premium Subscriptions** — $12.99/month, auto-activated on crypto payment via NOWPayments
- **PlayCoins Economy** — In-app currency earned through games (Crash, Mines, Plinko, Candle Call)
- **PWA** — Installable on Android & iOS, works offline
- **Native Android app** — Trusted Web Activity (TWA) wrapper around the PWA, built via Bubblewrap/Gradle in `.github/workflows/build-android.yml`, targeting the Play Store

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | `index.html` (markup/CSS/legacy inline JS) + a growing ES-module layer in `js/` (`app.js`, `router.js`, `store.js`, `config.js`, `i18n.js`, plus `js/features/`, `js/auth/`, `js/utils/`) |
| Hosting | Vercel (auto-deploy on push to `main`) — see the domain note above |
| Serverless API | Vercel Edge Functions in `api/` — `signals.js` (Gist proxy), `prices.js`, `news.js`, `nowpayments.js` (payments/webhook), `admin.js`, `notify.js`, `demo-test.js` |
| Signal Storage | GitHub Gist (JSON — written by `gwp-bots` + `scripts/signal_bot.py`, read by `/api/signals.js`) |
| Premium Store | GitHub Gist (`premium_users.json` — SHA-256 hashed emails) |
| PWA | Service Worker (`sw.js`) + Web App Manifest (`manifest.json`) |
| Native Android | Trusted Web Activity — `android/` (Gradle), `twa-manifest.json`, `.well-known/assetlinks.json` |
| Admin | `admin/index.html` — standalone admin panel |

---

## Payment Methods

| Method | Activation | Auto? |
|---|---|---|
| **Crypto — USDT/BTC/ETH** via NOWPayments | On-chain confirmation → IPN webhook | ✅ Automatic |
| **Bank Wire** — Ecobank Ghana | Admin verifies transfer in bank app | Manual |
| **Mobile Money** — MTN / Telecel | User DMs proof to @asterix_support1 | Manual |
| **Telegram** | DM @asterix_support1 to arrange | Manual |

### Auto-Upgrade Flow (NOWPayments)

```
User picks crypto → /api creates NOWPayments invoice
    → Modal shows QR + address + live countdown
    → App polls /api/check every 15 seconds
    → NOWPayments IPN fires to /api/nowpayments?action=webhook
    → Webhook verifies HMAC-SHA512 signature
    → Writes SHA256(email) to premium_users.json Gist
    → Sends Telegram alert to admin
    → Poll detects "finished" → Premium granted instantly ✅
```

---

## Repository Structure

```
AxTrader/
├── index.html                  ← Main frontend markup/CSS/legacy JS (~10K lines)
├── sw.js                       ← Service Worker
├── manifest.json               ← PWA config
├── twa-manifest.json           ← Android TWA config (Bubblewrap)
├── vercel.json                 ← Routing + cache headers
├── .well-known/
│   └── assetlinks.json         ← Digital Asset Links — REQUIRED for the TWA
│                                  to open full-screen (no URL bar) on Android
├── js/                         ← ES-module frontend layer (newer code)
│   ├── app.js, router.js, store.js, config.js, i18n.js
│   ├── features/               ← signals.js, market.js, payment.js, academy.js, referral.js, websocket.js
│   ├── auth/                   ← auth-flow.js, supabase.js
│   └── utils/                  ← api.js, dom.js, formatDate.js, icons.js, validate.js
├── api/                        ← Vercel Edge Functions
│   ├── signals.js              ← Merges gwp-bots + signal_bot.py Gist feeds
│   ├── prices.js, news.js, notify.js, admin.js, demo-test.js
│   └── nowpayments.js          ← Payments, webhook, premium check
├── admin/
│   └── index.html              ← Standalone admin panel
├── android/                    ← Native Android (TWA) Gradle project
│   └── app/                    ← applicationId com.asterixcom.axtrader
├── css/                        ← main.css, institutional.css
├── assets/logos/                ← Partner exchange logos
├── .github/
│   └── workflows/
│       ├── signal-bot.yml      ← ict-smc signal generator, every 30 min
│       ├── build-android.yml   ← Builds signed APK/AAB for Play Store
│       └── keepalive.yml       ← Weekly commit so GitHub doesn't auto-disable the cron
└── scripts/
    └── signal_bot.py           ← ict-smc price-action signal generator
```

Note: Vercel deploys straight from git pushes to `main` via its own
GitHub integration — there's no `deploy.yml` workflow in this repo (an
earlier version of this doc referenced one that doesn't exist).

---

## Environment Variables (Vercel)

Set these in: **Vercel Dashboard → AxTrader → Settings → Environment Variables**

| Variable | Required | Description |
|---|---|---|
| `NOWPAYMENTS_API_KEY` | ✅ | From nowpayments.io → Settings → API keys |
| `NOWPAYMENTS_IPN_SECRET` | ✅ | From nowpayments.io → Settings → IPN |
| `GH_PAT` | ✅ | GitHub PAT with `gist` write scope |
| `TELEGRAM_BOT_TOKEN` | ✅ | Telegram bot token for admin alerts |
| `TELEGRAM_ADMIN_CHAT` | ✅ | Admin Telegram chat ID |
| `PREMIUM_PRICE` | Optional | Defaults to `12.99` |

---

## NOWPayments Webhook

**Must be set in NOWPayments dashboard → Settings → IPN:**
```
https://axtrader.vercel.app/api/nowpayments?action=webhook
```

**Verify it's live:**
```bash
curl -X POST "https://axtrader.vercel.app/api/nowpayments?action=webhook" \
  -H "Content-Type: application/json" \
  -H "x-nowpayments-sig: test" \
  -d '{"payment_status":"finished"}'
# → {"error":"invalid signature"}  ✅ running + HMAC guard active
```

---

## Google Sign-In

Uses **Google Identity Services (GSI)** — client-side only, no backend needed.

**Client ID:** `688135725461-su1l15k9biemu8ki48apbth1gd6vhh9m.apps.googleusercontent.com`

**Required GCP setting:**
> Google Cloud Console → APIs & Services → Credentials → your OAuth client → Authorized JavaScript Origins → Add `https://axtrader.vercel.app`

---

## Manual Premium Grant (Admin)

To upgrade a user manually, share this URL with them (or copy their promo code):
```
https://axtrader.vercel.app/?promo=AXPREM-ASTERIX
```

Or via browser DevTools on the user's device:
```javascript
grantPremium('AXPREM-ASTERIX')
```

---

## Signal Bots

The feed is a merge of **two independent, separately-hosted engines**
writing to the same Gist (`crypto_signals.json` / `forex_signals.json` /
`stocks_signals.json`), each doing a read-merge-write so neither one
clobbers the other's entries (matched by `source` tag):

| Source | Repo | Markets | Cadence | Method |
|---|---|---|---|---|
| `gwp-bots` | separate `gwp-bots` repo | Crypto (20 pairs, KuCoin), Forex (14 pairs, Twelve Data), Stocks (18 tickers, Twelve Data) | every 15 min | Volume Profile POC/VAH/VAL + Fibonacci, D1/2H/30M/15M 4-timeframe vote |
| `ict-smc` | this repo, `scripts/signal_bot.py` | Crypto (17 pairs, Binance), Forex (XAU/USD, EUR/USD, GBP/USD, Binance-sourced), Stocks (TSLA, NVDA, MSTR, AMD, PLTR, Yahoo Finance) | every 30 min (`.github/workflows/signal-bot.yml`) | Pure price action — market structure, BOS/CHoCH, order blocks, FVGs, GWP sweeps |

`/api/signals.js` (Vercel Edge Function) fetches all three Gist files
and serves them combined, sorted newest-first, with a cache-busting
timestamp — the app never talks to GitHub's Gist API directly.

Keep the `pairs` display copy in `js/config.js`'s `SIGNAL_BOTS` array in
sync with whichever bot's actual symbol list changes — it's cosmetic
text only and won't update itself.

---

## Deploying Changes

```bash
# Make changes to index.html or api/nowpayments.js
git add .
git commit -m "feat: your change"
git push origin main
# Vercel auto-deploys in ~2 minutes → live at axtrader.vercel.app
```

---

## Checking Premium Status

```bash
# Check if an email has paid
curl "https://axtrader.vercel.app/api/nowpayments?action=is-premium&email=user@example.com"
# → {"premium": true}
```

---

## Android / Play Store

AxTrader ships to Android as a **Trusted Web Activity (TWA)** — a thin
native wrapper (`android/`) that opens `https://axtrader.vercel.app`
full-screen with no browser chrome, generated via Bubblewrap
(`twa-manifest.json`). `applicationId` / `namespace` is
`com.asterixcom.axtrader`.

### 🔴 Current blocker: `.well-known/assetlinks.json` is still a placeholder

```json
"sha256_cert_fingerprints": ["__REPLACE_WITH_YOUR_SIGNING_KEY_FINGERPRINT__"]
```

Until this is replaced with your **real release-keystore SHA-256
fingerprint**, Android cannot verify that this website and this APK
belong to the same developer. The practical effect: the app installs
and runs, but shows a browser URL bar instead of a full-screen native
experience (Digital Asset Link verification fails silently) — not a
rejection-worthy bug on its own, but it defeats the entire point of
shipping a TWA, and Play Store reviewers do check for it.

**Fix — run the existing workflow, it already does the hard part:**
1. GitHub → Actions → **Build Android APK & AAB** → Run workflow.
2. First-ever run: since no `KEYSTORE_BASE64` secret exists yet, the
   workflow generates a new release keystore for you and uploads it as
   a build artifact named `signing-keystore`. **Download it and store it
   somewhere permanent and safe outside GitHub — it cannot be regenerated,
   and losing it means you can never publish an update to this app again.**
3. `base64 -w0 axtrader-release.keystore` → save the output as a new repo
   secret named `KEYSTORE_BASE64` (Settings → Secrets and variables →
   Actions), plus set `KEYSTORE_PASSWORD` if you haven't already. Every
   build after this reuses the same key automatically.
4. Open the same workflow run's **"Print signing fingerprint"** step —
   it prints the exact `SHA256:` line you need.
5. Paste that value into `.well-known/assetlinks.json`, replacing the
   placeholder string, and commit.
6. Verify: `https://axtrader.vercel.app/.well-known/assetlinks.json`
   must serve that same fingerprint (it's a static file, deploys
   automatically with the next Vercel push).
7. Re-run the workflow once more to get the final signed **AAB** — that's
   the file you upload to Play Console, not the APK.

### Play Store checklist specific to this repo

- [ ] `assetlinks.json` fingerprint fixed (above) — **do this first**
- [ ] Domain consistency fixed (see the domain note near the top of this
      README) — Play Console's asset-link check and the TWA's own
      `hostName` both need to agree on exactly one canonical origin
- [ ] `twa-manifest.json`'s `appVersionCode` / `appVersionName` bumped
      before each new AAB upload (Play Console rejects a re-upload of an
      already-used version code)
- [ ] Icons present at the sizes Play Console expects (512×512 hi-res
      icon, feature graphic, phone screenshots) — `icon-512.png` exists
      in the repo but Play Console's *store listing* assets are separate
      uploads, not pulled from this repo
- [ ] Privacy Policy URL in Play Console pointed at
      `https://axtrader.vercel.app/privacy.html` (already exists)
- [ ] Data safety form filled in Play Console — this app collects email
      (Google Sign-In/Supabase) and handles payments (NOWPayments), both
      need to be declared

---

## Support

- **Admin Telegram:** @asterix_support1
- **Support email:** asterixcomltd@gmail.com

---

© 2024–2026 Asterix.COM Ltd. All rights reserved.
