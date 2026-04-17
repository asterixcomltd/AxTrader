# 🏰 AXTRADER EMPIRE — OPERATIONS MANUAL
## Complete Control Document (Inheritance/Backup)

**CONFIDENTIAL - KEEP SECURE**
**Last Updated:** April 11, 2026
**Version:** 2.0
**Owner:** Ben Abdin Adama
**Successor Access:** Authorized Personnel Only

---

## 📌 QUICK START FOR SUCCESSOR

If you're reading this, the original owner has passed control or this is for backup.

**3-Step Activation:**
1. Go to https://github.com/asterixcomltd/AxTrader
2. Set all Environment Variables in Vercel (Section C)
3. Set NOWPayments IPN webhook URL (Section A5)

**That's it. System is live and making money automatically.**

---

## 🔐 SECTION A: ACTIVE PRODUCTION KEYS & CREDENTIALS

### A1. ADSTERRA AD NETWORK (Primary Ad Revenue)

**Current Status:** ✅ LIVE
**Publisher ID:** `25ab08d68e8b0c0eb45c7f62ba70f5a9`
**Dashboard:** https://adsterra.com/dashboard

**Implementation:** `index.html` lines ~31-39 (head section)
**Revenue:** CPM ~$1.00 · Payout monthly to bank

**How to Update:**
1. Search `25ab08d68e8b0c0eb45c7f62ba70f5a9` in index.html
2. Replace with your Publisher ID
3. Commit & push

---

### A2. PAYPAL (Cosmetics Payments)

**Current Status:** ✅ LIVE
**PayPal.Me URL:** https://paypal.me/axtrader/
**Implementation:** index.html — search `paypal.me/axtrader` (6 instances)

**Cosmetics Pricing:** Avatar $0.99 · Theme $1.99 · Badge $2.99 · Legend $4.99

---

### A3. AFFILIATE PARTNER IDs

| Exchange | ID | Commission | Dashboard |
|---|---|---|---|
| Binance | `H4GJ4NKG` | 20% | binance.com/en/referral |
| OKX | `88883488` | 30% | okx.com/partner |
| Kraken | `RKD12345` | 30% | kraken.com/referral |
| Luno | `AXX12345` | 40% | luno.com/referral |

---

### A4. GITHUB & VERCEL (Infrastructure)

**GitHub Repo:** https://github.com/asterixcomltd/AxTrader
**Owner:** `asterixcomltd`
**Production Branch:** `main`
**Live URL:** https://axtrader.vercel.app
**Vercel Dashboard:** https://vercel.com/dashboard

**Deploy process:** Push to `main` → Vercel auto-deploys in ~2 minutes.

---

### A5. ⚡ NOWPAYMENTS — AUTO CRYPTO UPGRADE (NEW — April 2026)

**Current Status:** ✅ FULLY LIVE & AUTOMATED
**Account:** benabdinadama @ nowpayments.io
**Dashboard:** https://nowpayments.io/merchant
**Premium Price:** $12.99 / month

#### How the Auto-Upgrade Works (Full Flow)

```
1. User opens Upgrade modal → taps "Crypto (USDT · BTC · ETH)"
2. Picks currency → app calls /api/nowpayments?action=create
3. Vercel serverless function creates payment via NOWPayments API
4. Modal shows: QR code · exact amount · live countdown · status badge
5. App polls /api/nowpayments?action=check every 15 seconds
6. User sends crypto to the address shown

ON PAYMENT CONFIRMED:
   → NOWPayments sends signed IPN to webhook URL
   → Vercel function verifies HMAC-SHA512 signature
   → Writes SHA256(user_email) to premium_users.json in GitHub Gist
   → Sends Telegram alert to admin
   → App polling detects "finished" → grants Premium instantly
   ✅ User is upgraded — zero admin action required
```

#### Supported Currencies
- USDT TRC-20 (recommended — lowest fees)
- USDT BEP-20 (BNB Chain)
- Bitcoin (BTC)
- Ethereum (ETH)

#### IPN Webhook URL ← CRITICAL
```
https://axtrader.vercel.app/api/nowpayments?action=webhook
```
**Must be set in:** nowpayments.io → Settings → IPN → Webhook URL

#### Vercel Environment Variables (already set ✅)
| Variable | Description |
|---|---|
| `NOWPAYMENTS_API_KEY` | From nowpayments.io → Settings → API keys |
| `NOWPAYMENTS_IPN_SECRET` | From nowpayments.io → Settings → IPN (yellow field) |
| `GH_PAT` | GitHub PAT with `gist` write scope |
| `PREMIUM_PRICE` | Optional override — defaults to `12.99` |

#### Serverless Function Location
- **File:** `/api/nowpayments.js`
- **Actions:** `create` · `check` · `webhook` · `is-premium`

#### Premium Users Store
- **Storage:** GitHub Gist `a4caaf2993eea50322f31478391743b0`
- **File:** `premium_users.json`
- **Format:** Array of `{hash, paymentId, activatedAt}` objects
- **Security:** Emails stored as SHA-256 hashes — never in plaintext

#### Verify Webhook is Live
```bash
curl -X POST "https://axtrader.vercel.app/api/nowpayments?action=webhook" \
  -H "Content-Type: application/json" \
  -H "x-nowpayments-sig: badsig" \
  -d '{"payment_status":"finished"}'
# Expected: {"error":"invalid signature"} ← function running, HMAC guard active
```

#### If Something Breaks
1. Check Vercel Functions logs → dashboard → AxTrader → Functions tab
2. Re-check env vars are all set (Section C)
3. Regenerate IPN secret in NOWPayments → update `NOWPAYMENTS_IPN_SECRET` in Vercel → redeploy
4. Fallback: user can still DM `@asterix_support1` for manual upgrade

---

### A6. 🏦 BANK WIRE TRANSFER — ECOBANK GHANA (NEW — April 2026)

**Current Status:** ✅ LIVE (manual confirmation by admin)
**Bank:** Ecobank Ghana
**Account Name:** BEN ADAMA
**Account Number:** `1441005170611`
**SWIFT / BIC:** `ECOCGHAC`
**Branch:** 2 Morocco Lane, Off Independence Ave, Accra

#### How It Works
1. User opens Upgrade modal → taps "Bank Wire Transfer"
2. Unique reference code generated: `AXT-BT-XXXXXX`
3. User sees all bank details + reference (each field copyable with 📋)
4. User taps "I've Made the Transfer — Notify Admin"
5. App sends Telegram message to admin via bot API
6. Admin verifies transfer in Ecobank app → manually upgrades user via promo URL

#### Telegram Notification Format
```
🏦 New Bank Transfer Request
Amount: $12.99 USD
Ref: AXT-BT-XXXXXXX
User: John Doe (john@email.com)

✅ Confirm only after you see the transfer in your Ecobank account.
```

#### To Manually Upgrade a User
Share this URL with the user (or open it on their device):
```
https://axtrader.vercel.app/?promo=AXPREM-ASTERIX
```
Or open DevTools on their device and run:
```javascript
grantPremium('AXPREM-ASTERIX')
```

#### Code Location
- **HTML modal:** `#wire-overlay` in index.html
- **JS functions:** `openBankTransfer()`, `notifyBankTransfer()`, `copyWireField()`
- **Config:** `PAYMENT_CONFIG.bank_*` in index.html

---

### A7. 📱 MOBILE MONEY — GHANA (Existing)

**MTN MoMo:** +233 541 760 074
**Telecel Cash:** +233 508 588 238
**Process:** User taps number to call/send · DMs proof to @asterix_support1 · admin upgrades manually

---

### A8. 🔑 GOOGLE SIGN-IN (NEW — April 2026)

**Current Status:** ✅ Code live — needs 1 GCP setting to activate
**Method:** Google Identity Services (GSI) — One-Tap popup
**Client ID:** `688135725461-su1l15k9biemu8ki48apbth1gd6vhh9m.apps.googleusercontent.com`
**GCP Console:** console.cloud.google.com → APIs & Services → Credentials

#### How It Works
1. User taps "Continue with Google" on auth screen
2. Google One-Tap popup appears → user picks account → instantly logged in
3. If One-Tap is suppressed by browser: a Google-rendered button appears automatically as fallback
4. Google profile photo is used as AxTrader avatar automatically

#### ⚠️ Required GCP Setting (not yet done)
```
Google Cloud Console → APIs & Services → Credentials
→ OAuth Client (Bayiri) → Edit
→ Authorized JavaScript Origins → Add URI:
  https://axtrader.vercel.app
→ Save (takes ~5 minutes to propagate)
```

#### Code Location
- **Script:** `<script src="https://accounts.google.com/gsi/client" ...>` in `<head>`
- **Config:** `const GOOGLE_CLIENT_ID = '688135...'` in index.html
- **Functions:** `_initGSI()`, `loginWithGoogle()`, `_handleGoogleCred()`
- **Fallback div:** `<div id="google-rendered-btn">` in auth screen

---

### A9. 📣 TELEGRAM BOT (Admin Notifications)

**Current Status:** ✅ LIVE
**Bot Name:** asterix_direct_bank_bot
**Bot Token:** (stored in Vercel — see Section C)
**Admin Chat ID:** (stored in Vercel — @asterix_support1)

**Used for:**
- NOWPayments auto-upgrade confirmation alerts
- Bank wire transfer payment notification
- Any future admin alerts

**Test the bot:**
```bash
curl "https://api.telegram.org/bot{TOKEN}/sendMessage?chat_id={CHAT_ID}&text=Hello"
```

---

## 📊 SECTION B: FREE API KEYS & DATA SOURCES

| Service | Endpoint | Used For |
|---|---|---|
| CoinGecko | api.coingecko.com/api/v3 | Live crypto prices |
| open.er-api.com | /v6/latest/USD | Forex rates |
| alternative.me/fng | /fng/?limit=1 | Fear & Greed index |
| CoinTelegraph | cointelegraph.com/api/feed | Crypto news |

No authentication needed for any of the above — all public APIs.

---

## 🔧 SECTION C: VERCEL ENVIRONMENT VARIABLES

**All variables set in:** vercel.com/dashboard → AxTrader → Settings → Environment Variables

| Variable | Purpose | Status |
|---|---|---|
| `NOWPAYMENTS_API_KEY` | Create + check payments via NOWPayments API | ✅ Set |
| `NOWPAYMENTS_IPN_SECRET` | Verify HMAC signature on incoming IPNs | ✅ Set |
| `GH_PAT` | Write `premium_users.json` to GitHub Gist | ✅ Set |
| `TELEGRAM_BOT_TOKEN` | Send payment alert messages to admin | ✅ Set |
| `TELEGRAM_ADMIN_CHAT` | Admin Telegram chat ID for alerts | ✅ Set |
| `GIST_ID` | Hardcoded in function — `a4caaf2993eea50322f31478391743b0` | N/A |
| `PREMIUM_PRICE` | Optional — defaults to `12.99` if not set | Optional |

**How to Add/Update:**
1. vercel.com/dashboard → AxTrader → Settings → Environment Variables
2. Add/edit variable
3. Save → Vercel auto-triggers redeploy

**How to Rotate a Secret (e.g., if leaked):**
1. Generate new value in the relevant service
2. Update in Vercel → redeploy
3. Old value is immediately invalid after redeploy

---

## 📊 SECTION D: REVENUE TRACKING

### D1. Crypto Payments (NOWPayments)
- **Dashboard:** nowpayments.io/merchant
- **Payments flow to:** Payout wallets set in NOWPayments (BTC main wallet + USDT Polygon)
- **BTC Wallet:** `19vghapZgLn2...runDvhjWEUHQ` (main wallet — set in NOWPayments)
- **USDT Polygon:** `0xe713a07b10...d34a8036584d`
- **Admin alert:** Telegram message sent for every confirmed payment

### D2. Bank Wire Transfers
- **Check:** Ecobank Ghana mobile app / online banking
- **Reference format:** `AXT-BT-XXXXXX` (user includes in memo)
- **Confirmation:** Telegram alert when user submits — verify transfer before upgrading

### D3. Mobile Money
- **MTN MoMo:** Check MTN Mobile Money app
- **Telecel:** Check Telecel Cash app
- **Confirmation:** User DMs @asterix_support1 with screenshot

### D4. Ad Revenue (Adsterra)
- **Dashboard:** adsterra.com/dashboard
- **Check:** Statistics → Impressions, Clicks, Earnings
- **Payout:** Monthly to linked bank account

### D5. Affiliate Commissions
- **Check monthly** on all 4 exchange dashboards (Section A3)
- **Passive income** — no action needed once IDs are set

---

## ✅ SECTION E: TASK CHECKLIST

### Completed ✅
- [x] NOWPayments crypto auto-upgrade (USDT, BTC, ETH)
- [x] Webhook IPN with HMAC-SHA512 verification
- [x] Auto premium activation (Gist store + login-time check)
- [x] Bank wire transfer (Ecobank Ghana) with Telegram notify
- [x] Mobile Money (MTN + Telecel)
- [x] Google One-Tap Sign-In (code live)
- [x] Telegram admin notifications for all payment types
- [x] All Vercel env vars set and tested
- [x] Webhook URL set in NOWPayments dashboard

### Needs 1 Action ⚠️
- [ ] **Google GCP:** Add `https://axtrader.vercel.app` to Authorized JavaScript Origins
  → console.cloud.google.com → APIs & Services → Credentials → your OAuth client → Edit → Add URI → Save

### High Priority 🔴
- [ ] Update affiliate IDs (replace placeholder IDs in index.html with your real ones)
- [ ] Update PayPal.Me username (`paypal.me/axtrader` → your username, 6 instances)
- [ ] Test a real NOWPayments payment end-to-end (small amount)

### Medium Priority 🟡
- [ ] Custom domain setup (axtrader.com)
- [ ] Add legal pages (ToS / Privacy Policy)
- [ ] Setup Google Analytics for traffic tracking

---

## 🗂️ SECTION F: FILE STRUCTURE

```
AxTrader/
├── index.html                               ← Main app (6,600+ lines)
├── sw.js                                    ← Service Worker / PWA offline
├── manifest.json                            ← PWA manifest
├── vercel.json                              ← Vercel routing & cache headers
├── api/
│   └── nowpayments.js                       ← Serverless: payments + webhook
├── .github/
│   └── workflows/
│       ├── deploy.yml                       ← Vercel auto-deploy trigger
│       └── signal-bot.yml                   ← Signal bot scheduler
├── scripts/
│   └── signal_bot.py                        ← Trading signal generator
└── docs/
    ├── AXTRADER_EMPIRE_OPERATIONS_MANUAL.md ← This file
    ├── README.md                            ← Developer quick-start
    ├── CRITICAL_TASKS_CHECKLIST.md
    ├── GHANA_LAUNCH_STRATEGY.md
    └── READY_FOR_CHECKLIST.md
```

### Key Code Sections in index.html

| Section | Purpose |
|---|---|
| Head (lines 1–10) | Google fonts + GSI script |
| CSS vars (lines 41–60) | Design tokens (colors, spacing) |
| Auth screen | Login / Signup / Google One-Tap |
| Upgrade modal `#upgrade-overlay` | Payment options (MoMo, Crypto, Wire, Telegram) |
| Currency picker `#np-currency-overlay` | NOWPayments currency selection |
| Payment details `#np-payment-overlay` | Address, QR, countdown, live status |
| Wire transfer `#wire-overlay` | Ecobank Ghana wire details |
| `PAYMENT_CONFIG` (~line 2430) | All payment config in one object |
| `GOOGLE_CLIENT_ID` (~line 2431) | Google OAuth client ID |
| `_initGSI()` | Initialize Google Identity Services |
| `loginWithGoogle()` | Trigger One-Tap popup |
| `_handleGoogleCred()` | Decode JWT → loginUser() |
| `openNowPayments()` | Open currency picker |
| `createNowPayment(currency)` | Call API → show payment modal |
| `startNpPolling(id)` | Poll payment status every 15s |
| `grantPremiumAutomatically()` | Auto-upgrade user on confirmed payment |
| `checkServerPremium(email)` | On login: check Gist for server-side premium |
| `openBankTransfer()` | Open wire transfer modal |
| `notifyBankTransfer()` | Send Telegram alert via Bot API |
| `grantPremium(code)` | Manual upgrade via promo code |

---

## 🔐 SECTION G: SECURITY

### G1. Secrets & Keys
| Secret | Stored In | Rotation |
|---|---|---|
| `NOWPAYMENTS_API_KEY` | Vercel env vars | Rotate if leaked → update Vercel |
| `NOWPAYMENTS_IPN_SECRET` | Vercel env vars | Regenerate in NOWPayments → update Vercel |
| `GH_PAT` | Vercel env vars | github.com/settings/tokens → regenerate |
| `TELEGRAM_BOT_TOKEN` | Vercel env vars | @BotFather → /revoke → /newbot |
| Google Client ID | index.html (public) | Fine to be public — restrict in GCP |
| Google Client Secret | NOT in AxTrader | Only needed in Bayiri backend |

### G2. What's Safe to Be Public
- `GOOGLE_CLIENT_ID` — by design, used in frontend JS
- Adsterra Publisher ID — by design, in frontend JS
- Gist ID — public gist, only contains hashed emails
- NOWPayments Payout wallet addresses — public blockchain addresses

### G3. Git Security Rules
- **Never** commit `NOWPAYMENTS_API_KEY` or `IPN_SECRET` to the repo
- **Never** commit `GH_PAT` or `TELEGRAM_BOT_TOKEN` to the repo
- All secrets live in Vercel environment variables only

---

## 📞 SECTION H: SUCCESSION PLAN

**What to hand to successor:**
1. This file (updated version)
2. Vercel account login + 2FA backup codes
3. GitHub account (asterixcomltd) + 2FA backup codes
4. NOWPayments account login
5. Adsterra account login
6. Ecobank Ghana online banking login
7. Telegram bot token (from Vercel env vars)

**What successor must do immediately:**
1. Change all account passwords
2. Regenerate `GH_PAT`, `NOWPAYMENTS_API_KEY`, `TELEGRAM_BOT_TOKEN`
3. Update all rotated secrets in Vercel environment variables
4. Verify NOWPayments payout wallets point to THEIR addresses
5. Test one real end-to-end payment

---

## 🎯 SECTION I: MONTHLY CHECKLIST

**Week 1:**
- [ ] Check NOWPayments dashboard — payments received?
- [ ] Check Ecobank — wire transfers received?
- [ ] Check Adsterra earnings
- [ ] Check affiliate commissions (all 4 exchanges)

**Week 2:**
- [ ] Verify Gist `premium_users.json` is growing
- [ ] Check Vercel Functions logs for errors
- [ ] Test payment flow with a small amount

**Week 3:**
- [ ] Rotate secrets if >90 days old
- [ ] Backup this file
- [ ] Review Telegram alert history

**Week 4:**
- [ ] Calculate total revenue (crypto + wire + MoMo + affiliates + ads)
- [ ] Update this file with any changes
- [ ] Plan next month optimizations

---

## 🚀 SECTION J: QUICK COMMAND REFERENCE

```bash
# Clone repo
git clone https://github.com/asterixcomltd/AxTrader.git

# Push changes (triggers Vercel auto-deploy)
git add .
git commit -m "update: description"
git push origin main

# Test webhook is live
curl -X POST "https://axtrader.vercel.app/api/nowpayments?action=webhook" \
  -H "Content-Type: application/json" -H "x-nowpayments-sig: test" \
  -d '{"payment_status":"finished"}' \
  # Expected: {"error":"invalid signature"}

# Check if email is premium
curl "https://axtrader.vercel.app/api/nowpayments?action=is-premium&email=user@test.com"
# Expected: {"premium":false} or {"premium":true}

# Send test Telegram alert
curl "https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage?chat_id={CHAT_ID}&text=Test"

# Emergency rollback
git log --oneline -5    # find commit to roll back to
git revert HEAD         # creates a new revert commit
git push origin main
```

---

## 🔗 APPENDIX: QUICK LINKS

| Resource | URL |
|---|---|
| **Live App** | https://axtrader.vercel.app |
| **GitHub Repo** | https://github.com/asterixcomltd/AxTrader |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **NOWPayments Dashboard** | https://nowpayments.io/merchant |
| **NOWPayments IPN Settings** | https://nowpayments.io/merchant (Settings → IPN) |
| **Google Cloud Console** | https://console.cloud.google.com |
| **GitHub Gist (signals + premium)** | https://gist.github.com/asterixcomltd/a4caaf2993eea50322f31478391743b0 |
| **Adsterra Dashboard** | https://adsterra.com/dashboard |
| **Ecobank Online** | https://ecobank.com |
| **Telegram Bot API** | https://api.telegram.org |

---

```
Created: April 10, 2026
Updated: April 11, 2026 (v2.0 — NOWPayments, Wire Transfer, Google Sign-In, Telegram)
Owner: Ben Abdin Adama
Status: LIVE & AUTOMATED
```

*This document is your operational inheritance. Guard it wisely.*
