#!/usr/bin/env python3
"""
AxTrader Signal Bot v3.9 — Pure Price Action / Smart Money Concepts
Runs every 30 min via GitHub Actions.

ZERO LAGGING INDICATORS. No EMA. No RSI. No MACD. No Bollinger.

Strategy — GWP (Ghost Wick Protocol) + ICT Smart Money:
  1. Market Structure  — Swing highs/lows → HH/HL (bullish) or LH/LL (bearish)
  2. BOS / CHoCH       — Break of Structure (continuation) or Change of Character (reversal)
  3. Order Block       — Last opposing candle before the impulse move (institutional origin)
  4. Fair Value Gap    — 3-candle price imbalance (price magnet, tends to fill)
  5. GWP Sweep         — True Ghost Wick: wick through equal highs/lows + rejection close

  Signal fires when:
  - Structure confirms direction (BOS) OR reversal signal present (CHoCH)
  - At least ONE confluence: OB + FVG + GWP sweep
  - Higher quality signals require 2+ confluences

ATR used ONLY as a geometric ruler for SL/TP distance — never as a signal or filter.
Daily bias from PRICE STRUCTURE only (swing HH/HL vs LH/LL) — no daily EMA.

v3 vs v2:
  REMOVED: EMA(9), EMA(21) cross/trend (lagging)
  REMOVED: RSI(14) filter (lagging)
  REMOVED: ATR regime filter using 20-bar average (lagging)
  REMOVED: Daily EMA9/EMA21 bias (lagging on lagging)
  ADDED:   Swing high/low detection (pure price)
  ADDED:   BOS / CHoCH detection (pure price)
  ADDED:   Order Block identification (pure price)
  ADDED:   Fair Value Gap detection (pure price)
  ADDED:   TRUE GWP sweep — equal highs/lows + wick + rejection (pure price)
  ADDED:   Daily bias from daily swing structure (pure price)
"""

import requests
import json
import os
import time
import sys
from datetime import datetime, timezone

# ── Config ────────────────────────────────────────────────────────────────────
GIST_ID  = os.environ.get("GIST_ID", "a4caaf2993eea50322f31478391743b0")
GIST_PAT = os.environ.get("GIST_PAT", "")

# Daily bias cache — avoid redundant API calls per symbol
_daily_bias_cache = {}

BINANCE_URL = "https://api.binance.com/api/v3/klines"
YAHOO_URL   = "https://query1.finance.yahoo.com/v8/finance/chart/{}"

CRYPTO_PAIRS = [
    # v3.8: switched from Binance to Yahoo Finance. Run 88966290681
    # confirmed Binance's spot API returns HTTP 451 for EVERY crypto
    # pair from GitHub Actions' hosted-runner IPs — not a bad symbol,
    # the whole exchange is geo-blocked from this infra, so crypto had
    # been producing zero signals from this bot since inception.
    # Yahoo prices crypto in USD (not USDT) — pair labels below changed
    # from "/USDT" to "/USD" to reflect the real data source (price
    # difference between USD and USDT is negligible for signal purposes,
    # but the label should be honest about what's actually being read).
    # Yahoo has no native 4h candle; fetch_yahoo_crypto() below builds
    # 4h bars from 60m bars.
    #
    # v3.9: 5th element is a price floor passed to fetch_yahoo_crypto's
    # min_price guard (see fetch_yahoo() docstring). Run 89067006085
    # confirmed UNI-USD/COMP-USD/SUI-USD are ticker collisions on Yahoo
    # — those exact symbols belong to unrelated near-worthless coins,
    # not Uniswap/Compound/Sui. They currently 404 for us (safe), but
    # the floor protects against Yahoo ever serving that wrong data
    # under the right label, silently, for these or any other pair here.
    # Floors are set conservatively below any realistic price for the
    # real asset, comfortably above the confirmed imposters (which
    # trade at $0.00000005–$0.0003).
    #
    # v3.9.1: run 89214736896 confirmed the guard caught a REAL
    # imposter on ARB-USD too (Yahoo returned $0.00063; real Arbitrum
    # trades ~$0.08–0.19 — ~150x off, definitely not the real asset;
    # floor left as-is, it did its job). It also caught a FALSE
    # POSITIVE on DOT-USD: real Polkadot has genuinely crashed to
    # ~$0.85–0.90 (confirmed against CoinGecko/CoinMarketCap/Coinbase,
    # all agreeing, near DOT's real all-time low of $0.727) — the
    # original $1 floor was too conservative and blocked legitimate
    # data. Lowered to $0.3. Lesson: these floors are estimates, not
    # verified thresholds — if a real crypto crash pushes a legit asset
    # below its floor, check the actual current price (a couple of
    # independent sources agreeing) before assuming it's an imposter.
    (["BTC-USD"],  "BTC/USD",  "crypto", "4h", 1000),
    (["ETH-USD"],  "ETH/USD",  "crypto", "4h", 50),
    (["SOL-USD"],  "SOL/USD",  "crypto", "4h", 5),
    (["LINK-USD"], "LINK/USD", "crypto", "4h", 1),
    (["BNB-USD"],  "BNB/USD",  "crypto", "4h", 50),
    (["DEXE-USD"], "DEXE/USD", "crypto", "4h", 1),
    (["UNI-USD"],  "UNI/USD",  "crypto", "4h", 0.5),
    (["COMP-USD"], "COMP/USD", "crypto", "4h", 5),
    (["NEAR-USD"], "NEAR/USD", "crypto", "4h", 0.2),
    (["AVAX-USD"], "AVAX/USD", "crypto", "4h", 1),
    (["AAVE-USD"], "AAVE/USD", "crypto", "4h", 10),
    (["ARB-USD"],  "ARB/USD",  "crypto", "4h", 0.05),
    (["INJ-USD"],  "INJ/USD",  "crypto", "4h", 0.2),
    (["DOT-USD"],  "DOT/USD",  "crypto", "4h", 0.3),
    (["FIL-USD"],  "FIL/USD",  "crypto", "4h", 0.5),
    (["SUI-USD"],  "SUI/USD",  "crypto", "4h", 0.1),
    (["ATOM-USD"], "ATOM/USD", "crypto", "4h", 1),
]
FOREX_PAIRS = [
    # v3.7: switched from Binance (XAUUSDT/EURUSDT/GBPUSDT — unreliable/
    # unverified as real spot pairs there) to Yahoo Finance, confirmed
    # working for EURUSD=X and GBPUSD=X directly against
    # query1.finance.yahoo.com. Gold's exact Yahoo ticker couldn't be
    # independently confirmed, so it carries a fallback candidate
    # (GC=F, the COMEX futures proxy) — fetch_yahoo_fx tries each in
    # order and logs which one actually worked.
    (["XAUUSD=X", "GC=F"], "XAU/USD", "forex", "1h"),
    (["EURUSD=X"],         "EUR/USD", "forex", "1h"),
    (["GBPUSD=X"],         "GBP/USD", "forex", "1h"),
]
STOCK_SYMBOLS = [
    ("TSLA",  "TSLA",  "stocks"),
    ("NVDA",  "NVDA",  "stocks"),
    ("MSTR",  "MSTR",  "stocks"),
    ("AMD",   "AMD",   "stocks"),
    ("PLTR",  "PLTR",  "stocks"),
]

EXPIRY_HOURS = {"1H": 4, "4H": 16, "1D": 78}  # v3.6: 1D raised 72→78 (aligned with CT gate)

# ── Data Fetching (with retry + validation) ──────────────────────────────────
def fetch_binance(symbol, interval, limit=150, retries=2):
    """
    v3.8: no longer called anywhere in this file by default — Binance's
    spot API is geo-blocked (HTTP 451) from GitHub Actions' hosted
    runners (see CRYPTO_PAIRS/FOREX_PAIRS comments above). Left in place
    only in case this bot ever runs from infra Binance doesn't block
    (e.g. a self-hosted runner) and someone wants it back.
    """
    for attempt in range(retries + 1):
        try:
            r = requests.get(BINANCE_URL,
                             params={"symbol": symbol, "interval": interval, "limit": limit},
                             timeout=10)
            r.raise_for_status()
            data = r.json()
            if not isinstance(data, list) or not data:
                print(f"  ⚠ Binance returned empty/invalid data for {symbol} {interval}")
                return []
            candles = []
            for d in data:
                if len(d) < 6:
                    continue
                try:
                    candles.append({"t": d[0], "o": float(d[1]), "h": float(d[2]),
                                    "l": float(d[3]), "c": float(d[4]), "v": float(d[5])})
                except (ValueError, TypeError):
                    continue
            return candles
        except Exception as e:
            if attempt < retries:
                time.sleep(1)
                continue
            print(f"  ⚠ Binance fetch failed for {symbol} {interval}: {e}")
            return []

def fetch_yahoo(symbol, limit=80, retries=2, interval="1d", range_="6mo", min_price=None):
    """
    min_price (v3.9): if given, reject the fetch (return []) when the
    most recent close is below it. This exists because Yahoo's crypto
    tickers collide: the plain "UNI-USD"/"COMP-USD"/"SUI-USD" symbols
    are NOT Uniswap/Compound/Sui — they're unrelated coins that happen
    to share the ticker ("UNICORN Token" @ $0.00016, "Compound Coin" @
    $0.00000005, "Salmonation" @ $0.0003) sitting on an otherwise-
    unclaimed symbol, while the real assets sit behind an unstable
    numeric-suffixed ID (UNI7083-USD today, something else next month
    per Yahoo's own listings) that isn't safe to hardcode. A name check
    was tried first and rejected — "Compound" is literally a substring
    of the impostor's own name "Compound Coin", so it wouldn't have
    caught this. Price is the reliable signal: every real token in
    CRYPTO_PAIRS trades comfortably above any of these imposters, which
    are near-worthless by construction (that's why the ticker was free
    to squat on). A 404 is a safe, loud failure; silently accepting the
    WRONG coin's real price data under the right label is worse and
    wouldn't show up in the logs — this check turns that failure mode
    back into a loud one too.
    """
    for attempt in range(retries + 1):
        try:
            url = YAHOO_URL.format(symbol)
            r = requests.get(url,
                             params={"interval": interval, "range": range_},
                             headers={"User-Agent": "Mozilla/5.0"},
                             timeout=10)
            r.raise_for_status()
            body = r.json()
            if "chart" not in body or "result" not in body["chart"]:
                print(f"  ⚠ Yahoo returned unexpected structure for {symbol}")
                return []
            result = body["chart"]["result"]
            if not result:
                return []
            res = result[0]
            ts  = res.get("timestamp", [])
            q   = res.get("indicators", {}).get("quote", [{}])[0]
            candles = []
            for i in range(len(ts)):
                try:
                    c = q["close"][i]
                    if c is None:
                        continue
                    o = q["open"][i] or c
                    h = q["high"][i] or c
                    l = q["low"][i] or c
                    v = q["volume"][i] or 0
                    candles.append({"t": ts[i]*1000, "o": o, "h": h, "l": l, "c": c, "v": v})
                except (KeyError, IndexError, TypeError):
                    continue
            if min_price is not None and candles and candles[-1]["c"] < min_price:
                print(f"  ⚠ Yahoo ticker {symbol} looks like the WRONG asset (last close "
                      f"{candles[-1]['c']} is far below the expected price floor {min_price} — "
                      f"this ticker is likely squatted by an unrelated coin) — rejecting, not using this data.")
                return []
            return candles[-limit:]
        except Exception as e:
            if attempt < retries:
                time.sleep(1)
                continue
            print(f"  ⚠ Yahoo fetch failed for {symbol}: {e}")
            return []

def fetch_yahoo_fx(symbol_candidates, limit=150, retries=2, interval="60m", range_="1mo", min_price=None):
    """
    v3.7: Forex/commodity fetch with automatic ticker fallback. Gold in
    particular has been observed under different tickers ("XAUUSD=X" vs
    the futures proxy "GC=F") depending on Yahoo's current listings —
    rather than hardcoding a guess, try each candidate in order and use
    whichever actually returns data. symbol_candidates is a list;
    logs which one worked so future runs/maintainers know the truth
    without needing to test it by hand again.
    v3.9: min_price passed through to fetch_yahoo() — see its
    docstring. Optional; omit for pairs with no known collision risk.
    """
    for i, sym in enumerate(symbol_candidates):
        candles = fetch_yahoo(sym, limit=limit, retries=retries, interval=interval, range_=range_, min_price=min_price)
        if candles:
            if i > 0:
                print(f"  ℹ using fallback ticker {sym} (primary {symbol_candidates[0]} returned no data)")
            return candles
    print(f"  ⚠ Yahoo fetch failed for all candidates: {symbol_candidates}")
    return []

def resample_candles(candles, group_size):
    """
    v3.8: Aggregate consecutive same-size candles into larger bars
    (e.g. 4× 60m → 1× 4h). Assumes candles arrive in chronological
    order with even spacing (true for a single Yahoo chart response).
    A trailing partial group (fewer than group_size bars left) is
    dropped rather than emitted as a short/incomplete bar.
    """
    out = []
    for i in range(0, len(candles) - group_size + 1, group_size):
        chunk = candles[i:i + group_size]
        out.append({
            "t": chunk[0]["t"],
            "o": chunk[0]["o"],
            "h": max(c["h"] for c in chunk),
            "l": min(c["l"] for c in chunk),
            "c": chunk[-1]["c"],
            "v": sum(c["v"] for c in chunk),
        })
    return out

def fetch_yahoo_crypto(symbol_candidates, tf, limit=150, retries=2, min_price=None):
    """
    v3.8: Crypto fetch via Yahoo Finance instead of Binance — Binance's
    spot API returns HTTP 451 (region-blocked) from GitHub Actions'
    hosted-runner IPs (confirmed in run 88966290681: every single
    crypto pair failed this way), so crypto had been silently producing
    zero signals from this bot. Yahoo has no native 4h interval, so 4h
    bars are built by fetching 60m bars and aggregating 4-at-a-time via
    resample_candles(). 1d (used for daily bias) is fetched directly —
    Yahoo does support a native 1d interval.
    v3.9: min_price passed straight through to fetch_yahoo_fx/
    fetch_yahoo — see fetch_yahoo()'s docstring for why this matters
    for crypto specifically (confirmed real ticker collisions on
    UNI-USD/COMP-USD/SUI-USD, run 89067006085).
    """
    if tf == "1d":
        return fetch_yahoo_fx(symbol_candidates, limit=limit, retries=retries, interval="1d", range_="6mo", min_price=min_price)
    if tf == "4h":
        hourly = fetch_yahoo_fx(symbol_candidates, limit=(limit * 4) + 4, retries=retries, interval="60m", range_="3mo", min_price=min_price)
        return resample_candles(hourly, 4)[-limit:]
    # Any other tf string is passed straight through as a Yahoo interval —
    # covers future additions without needing another branch here.
    return fetch_yahoo_fx(symbol_candidates, limit=limit, retries=retries, interval=tf, range_="3mo", min_price=min_price)

# ── ATR — geometric ruler only, NOT a signal ──────────────────────────────────
def atr(candles, period=14):
    trs = [max(c["h"]-c["l"],
               abs(c["h"]-candles[i-1]["c"]),
               abs(c["l"]-candles[i-1]["c"]))
           for i, c in enumerate(candles) if i > 0]
    return sum(trs[-period:]) / period if trs else 0

# ── Market Structure ──────────────────────────────────────────────────────────
def find_swings(candles, pivot=3):
    """
    Find confirmed swing highs and lows.
    A swing high: highest point in a window of (pivot) candles on each side.
    A swing low:  lowest  point in a window of (pivot) candles on each side.
    Only uses confirmed candles (not the live/forming candle).
    """
    swings = []
    for i in range(pivot, len(candles) - pivot):
        hi = candles[i]["h"]
        lo = candles[i]["l"]
        left_highs  = [candles[j]["h"] for j in range(i-pivot, i)]
        right_highs = [candles[j]["h"] for j in range(i+1, i+pivot+1)]
        left_lows   = [candles[j]["l"] for j in range(i-pivot, i)]
        right_lows  = [candles[j]["l"] for j in range(i+1, i+pivot+1)]

        if hi >= max(left_highs) and hi >= max(right_highs):
            swings.append({"idx": i, "type": "high", "price": hi, "t": candles[i]["t"]})
        elif lo <= min(left_lows) and lo <= min(right_lows):
            swings.append({"idx": i, "type": "low", "price": lo, "t": candles[i]["t"]})
    return swings

def get_structure(swings):
    """
    Determine market structure bias from last swing points.
    Bullish = HH + HL (Higher Highs and Higher Lows)
    Bearish = LH + LL (Lower Highs and Lower Lows)
    Returns: "bullish", "bearish", or "ranging"
    """
    if len(swings) < 4:
        return "ranging"

    recent = swings[-8:]
    highs = [s for s in recent if s["type"] == "high"]
    lows  = [s for s in recent if s["type"] == "low"]

    if len(highs) < 2 or len(lows) < 2:
        return "ranging"

    hh = highs[-1]["price"] > highs[-2]["price"]
    hl = lows[-1]["price"]  > lows[-2]["price"]
    lh = highs[-1]["price"] < highs[-2]["price"]
    ll = lows[-1]["price"]  < lows[-2]["price"]

    if hh and hl:  return "bullish"
    if lh and ll:  return "bearish"
    return "ranging"

def detect_bos_choch(candles, swings):
    """
    Break of Structure (BOS): price closes beyond the last swing in the trend direction.
      → Signals continuation of the existing trend.
    Change of Character (CHoCH): price closes beyond the last swing AGAINST the trend.
      → Signals a potential reversal — first sign of trend change.

    Returns dict with type ("BOS"/"CHoCH"/"none") and direction ("bullish"/"bearish"/"none").
    """
    if len(swings) < 3:
        return {"type": "none", "direction": "none", "level": 0}

    last_close = candles[-1]["c"]
    prev_close = candles[-2]["c"]
    structure  = get_structure(swings)

    recent_highs = [s for s in swings if s["type"] == "high"]
    recent_lows  = [s for s in swings if s["type"] == "low"]

    if not recent_highs or not recent_lows:
        return {"type": "none", "direction": "none", "level": 0}

    last_sh = recent_highs[-1]["price"]
    last_sl = recent_lows[-1]["price"]

    # BOS Bullish: close above swing high in existing bullish structure
    if structure == "bullish" and prev_close <= last_sh < last_close:
        return {"type": "BOS",   "direction": "bullish", "level": last_sh}

    # BOS Bearish: close below swing low in existing bearish structure
    if structure == "bearish" and prev_close >= last_sl > last_close:
        return {"type": "BOS",   "direction": "bearish", "level": last_sl}

    # CHoCH Bullish: close above swing high in a bearish structure (reversal signal)
    if structure == "bearish" and prev_close <= last_sh < last_close:
        return {"type": "CHoCH", "direction": "bullish", "level": last_sh}

    # CHoCH Bearish: close below swing low in a bullish structure (reversal signal)
    if structure == "bullish" and prev_close >= last_sl > last_close:
        return {"type": "CHoCH", "direction": "bearish", "level": last_sl}

    return {"type": "none", "direction": "none", "level": 0}

# ── Order Block ───────────────────────────────────────────────────────────────
def find_order_block(candles, direction, lookback=40):
    """
    Bullish OB: The last BEARISH (red) candle before a bullish impulse that led to BOS/CHoCH.
    Bearish OB: The last BULLISH (green) candle before a bearish impulse that led to BOS/CHoCH.

    The OB is the institutional origin — where smart money entered.
    Price returning to the OB = second chance entry at the institutional price.

    Returns OB zone dict or None if price is not currently at an active OB.
    """
    end   = len(candles) - 2
    start = max(5, end - lookback)
    current = candles[-1]["c"]

    if direction == "LONG":
        for i in range(end - 1, start, -1):
            c = candles[i]
            # Must be a bearish candle (the OB)
            if c["c"] >= c["o"]:
                continue
            # Followed by bullish impulse (at least 2 of next 3 candles bullish)
            fwd = candles[i+1 : min(i+4, end+1)]
            if sum(1 for f in fwd if f["c"] > f["o"]) < 2:
                continue
            ob_high = c["h"]
            ob_low  = c["l"]
            # Is current price returning into the OB zone?
            if not (ob_low <= current <= ob_high):
                continue
            # Has this OB been violated? (price went below OB low after formation)
            violated = any(candles[j]["l"] < ob_low * 0.998
                           for j in range(i+1, end))
            if violated:
                continue
            return {
                "high":     ob_high,
                "low":      ob_low,
                "midpoint": (ob_high + ob_low) / 2,
                "idx":      i,
                "fresh":    True,
            }

    else:  # SHORT
        for i in range(end - 1, start, -1):
            c = candles[i]
            if c["c"] <= c["o"]:
                continue
            fwd = candles[i+1 : min(i+4, end+1)]
            if sum(1 for f in fwd if f["c"] < f["o"]) < 2:
                continue
            ob_high = c["h"]
            ob_low  = c["l"]
            if not (ob_low <= current <= ob_high):
                continue
            violated = any(candles[j]["h"] > ob_high * 1.002
                           for j in range(i+1, end))
            if violated:
                continue
            return {
                "high":     ob_high,
                "low":      ob_low,
                "midpoint": (ob_high + ob_low) / 2,
                "idx":      i,
                "fresh":    True,
            }

    return None

# ── Fair Value Gap ────────────────────────────────────────────────────────────
def find_fvg(candles, direction, lookback=25):
    """
    A Fair Value Gap (FVG) is a 3-candle imbalance:
      Bullish FVG: candle[i-1].high < candle[i+1].low
        → A gap exists between them that candle[i] (the impulse) jumped through.
        → Price tends to return to fill this gap (acts as a magnet).
      Bearish FVG: candle[i-1].low > candle[i+1].high

    Returns the most recent unfilled FVG that price is currently entering.
    """
    end     = len(candles) - 2
    start   = max(2, end - lookback)
    current = candles[-1]["c"]

    if direction == "LONG":
        for i in range(end - 1, start, -1):
            # Gap: candle before (i-1) and candle after (i+1) the impulse (i)
            fvg_bottom = candles[i-1]["h"]
            fvg_top    = candles[i+1]["l"] if i+1 <= end else 0
            if fvg_top <= fvg_bottom:
                continue  # no gap
            # Is price currently entering this FVG from above?
            if fvg_bottom <= current <= fvg_top:
                # Check it hasn't been fully filled already
                filled = any(candles[j]["l"] <= fvg_bottom
                             for j in range(i+2, end))
                if not filled:
                    return {
                        "top":      fvg_top,
                        "bottom":   fvg_bottom,
                        "midpoint": (fvg_top + fvg_bottom) / 2,
                        "idx":      i,
                    }

    else:  # SHORT
        for i in range(end - 1, start, -1):
            fvg_top    = candles[i-1]["l"]
            fvg_bottom = candles[i+1]["h"] if i+1 <= end else 999999
            if fvg_top <= fvg_bottom:
                continue
            if fvg_bottom <= current <= fvg_top:
                filled = any(candles[j]["h"] >= fvg_top
                             for j in range(i+2, end))
                if not filled:
                    return {
                        "top":      fvg_top,
                        "bottom":   fvg_bottom,
                        "midpoint": (fvg_top + fvg_bottom) / 2,
                        "idx":      i,
                    }

    return None

# ── GWP — True Ghost Wick Protocol ───────────────────────────────────────────
def detect_gwp_sweep(candles, direction, lookback=30, equal_pct=0.003):
    """
    TRUE Ghost Wick Protocol — institutional liquidity sweep detection:

    Step 1: Find EQUAL HIGHS or EQUAL LOWS (liquidity pools)
      — Two or more swing points within 0.3% of each other = a liquidity magnet.
      — Smart money knows retail stops cluster here.

    Step 2: Detect if the current/last candle WICKED THROUGH that level
      — The wick must pierce the equal high/low.

    Step 3: Confirm REJECTION — the candle CLOSED back on the correct side
      — This is the "ghost wick": price hunted the stops, grabbed liquidity,
        then reversed. The wick is the ghost — it came and went.
      — Lower wick must be > 30% of total candle range (significant rejection).

    This is the REAL GWP — not 'close > open'.
    """
    if len(candles) < 15:
        return {"detected": False}

    last  = candles[-1]
    prev  = candles[-2:-1]
    look  = candles[-(lookback+1):-1]

    candle_range = last["h"] - last["l"]
    if candle_range < 1e-10:
        return {"detected": False}

    if direction == "LONG":
        # Look for equal LOWS — sell-side liquidity pool
        swing_lows = []
        for i in range(3, len(look) - 3):
            lo = look[i]["l"]
            if lo <= min(look[j]["l"] for j in range(i-3, i)) and \
               lo <= min(look[j]["l"] for j in range(i+1, i+4)):
                swing_lows.append(lo)

        for ref_low in swing_lows:
            # Are there at least 2 equal lows near this level?
            equals = [l for l in swing_lows if abs(l - ref_low) / max(abs(ref_low), 1e-10) < equal_pct]
            if len(equals) < 2:
                continue
            liquidity_level = sum(equals) / len(equals)  # average of the pool

            # Did the last candle wick below this level?
            if last["l"] >= liquidity_level:
                continue

            # Did it close ABOVE — confirming rejection?
            if last["c"] <= liquidity_level:
                continue

            # Is the rejection wick significant (> 30% of range)?
            wick = min(last["o"], last["c"]) - last["l"]
            if wick / candle_range < 0.30:
                continue

            return {
                "detected":        True,
                "swept_level":     round(liquidity_level, 6),
                "equal_count":     len(equals),
                "wick_pct":        round(wick / candle_range * 100, 1),
                "type":            "sell-side sweep",
            }

    else:  # SHORT
        # Look for equal HIGHS — buy-side liquidity pool
        swing_highs = []
        for i in range(3, len(look) - 3):
            hi = look[i]["h"]
            if hi >= max(look[j]["h"] for j in range(i-3, i)) and \
               hi >= max(look[j]["h"] for j in range(i+1, i+4)):
                swing_highs.append(hi)

        for ref_high in swing_highs:
            equals = [h for h in swing_highs if abs(h - ref_high) / max(abs(ref_high), 1e-10) < equal_pct]
            if len(equals) < 2:
                continue
            liquidity_level = sum(equals) / len(equals)

            if last["h"] <= liquidity_level:
                continue
            if last["c"] >= liquidity_level:
                continue

            wick = last["h"] - max(last["o"], last["c"])
            if wick / candle_range < 0.30:
                continue

            return {
                "detected":        True,
                "swept_level":     round(liquidity_level, 6),
                "equal_count":     len(equals),
                "wick_pct":        round(wick / candle_range * 100, 1),
                "type":            "buy-side sweep",
            }

    return {"detected": False}

# ── Kill Zone (for 1H forex scoring, 4H display only) ────────────────────────
def in_kill_zone(ts_ms):
    """London 02–06 UTC | NY 13–17 UTC."""
    h = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).hour
    return (2 <= h < 6) or (13 <= h < 17)

# ── HTF Daily Bias — from STRUCTURE, zero indicators ─────────────────────────
def get_daily_bias(symbol, yahoo_candidates=None, min_price=None):
    """
    Daily directional bias from PRICE STRUCTURE only (cached per symbol).
    HH + HL pattern → bullish bias (+1)
    LH + LL pattern → bearish bias (-1)
    Mixed / not enough swings → neutral (0)

    v3.7: yahoo_candidates (list of Yahoo tickers, primary first) routes
    forex/commodity symbols through fetch_yahoo_fx instead of Binance —
    Binance doesn't reliably list true forex/commodity spot pairs, so
    forex bias was silently defaulting to neutral (0) for every pair
    before this. Crypto symbols (yahoo_candidates=None) are unaffected.
    v3.9: min_price passed through to fetch_yahoo_fx for the same
    ticker-collision protection as the main candle fetch.
    """
    cache_key = symbol if yahoo_candidates is None else yahoo_candidates[0]
    if cache_key in _daily_bias_cache:
        return _daily_bias_cache[cache_key]
    if yahoo_candidates is not None:
        candles = fetch_yahoo_fx(yahoo_candidates, limit=80, interval="1d", range_="6mo", min_price=min_price)
    else:
        candles = fetch_binance(symbol, "1d", limit=80)
    if len(candles) < 20:
        _daily_bias_cache[cache_key] = 0
        return 0
    swings = find_swings(candles, pivot=3)
    struct = get_structure(swings)
    if struct == "bullish":
        _daily_bias_cache[cache_key] = 1
        return 1
    if struct == "bearish":
        _daily_bias_cache[cache_key] = -1
        return -1
    _daily_bias_cache[cache_key] = 0
    return 0

# ── Main Signal Generator v3.6 ────────────────────────────────────────────────
def generate(candles, pair, bot, tf, daily_bias=0):
    """
    Pure price action signal. Zero lagging indicators.

    Flow:
      1. Swing detection  → find HH/HL or LH/LL
      2. BOS / CHoCH      → directional event
      3. Order Block      → institutional entry zone (price is at OB now)
      4. FVG              → price imbalance retest (price is in FVG now)
      5. GWP Sweep        → wick through liquidity + rejection close
      6. Score and filter → needs at least 1 confluence, CHoCH needs 2

    ATR = ruler only (SL/TP placement). Not a filter, not a signal.
    """
    if len(candles) < 55:
        return None

    price = candles[-1]["c"]
    last  = candles[-1]
    if not price:
        return None

    # ── Step 1: Market structure from confirmed candles ───────────────────────
    confirmed = candles[:-1]          # exclude live candle
    swings    = find_swings(confirmed, pivot=3)
    structure = get_structure(swings)

    # ── Step 2: BOS / CHoCH (use confirmed candles for consistency) ────────
    event = detect_bos_choch(confirmed, swings)

    # Determine direction
    if event["direction"] in ("bullish", "bearish"):
        direction = "LONG" if event["direction"] == "bullish" else "SHORT"
    elif structure == "bullish":
        direction = "LONG"
    elif structure == "bearish":
        direction = "SHORT"
    else:
        return None  # ranging, no clear bias

    # ── Step 3: Order Block ───────────────────────────────────────────────────
    ob = find_order_block(candles, direction)

    # ── Step 4: Fair Value Gap ────────────────────────────────────────────────
    fvg = find_fvg(candles, direction)

    # ── Step 5: GWP Sweep — True Ghost Wick Protocol ─────────────────────────
    sweep = detect_gwp_sweep(candles, direction)

    # ── Must have at least ONE price-action confluence ────────────────────────
    confirmations = sum([ob is not None, fvg is not None, sweep["detected"]])
    if confirmations == 0:
        return None

    # ── Step 6: Scoring (pure price action, every point earned) ──────────────
    score   = 25
    reasons = []

    # Structural event quality
    if event["type"] == "CHoCH":
        score += 20; reasons.append("CHoCH ↺")
    elif event["type"] == "BOS":
        score += 12; reasons.append("BOS →")
    elif structure in ("bullish", "bearish"):
        score += 6;  reasons.append(f"{structure.capitalize()} structure")
    else:
        score += 2

    # Order Block — institutional origin
    if ob:
        score += 20
        reasons.append("Fresh Order Block ⚡" if ob["fresh"] else "Order Block")

    # Fair Value Gap — imbalance retest
    if fvg:
        score += 15; reasons.append("FVG retest")

    # GWP — True liquidity sweep + rejection
    if sweep["detected"]:
        score += 22; reasons.append(f"GWP sweep ({sweep['type']})")

    # HTF structural alignment — reward aligned, penalize counter-trend
    htf_counter = (daily_bias ==  1 and direction == "SHORT") or \
                  (daily_bias == -1 and direction == "LONG")
    if (daily_bias == 1 and direction == "LONG") or \
       (daily_bias == -1 and direction == "SHORT"):
        score += 10; reasons.append("HTF aligned")
    elif daily_bias == 0:
        score += 3
    elif htf_counter:
        score -= 8; reasons.append("HTF counter ⚠")

    # Kill Zone — 1H forex only (4H candles span sessions)
    kz = in_kill_zone(last["t"])
    if tf == "1h" and kz:
        score += 8; reasons.append("Kill Zone ⚡")
    elif kz:
        reasons.append("Kill Zone")

    score = min(int(score), 98)

    # ── Minimum thresholds ────────────────────────────────────────────────────
    # v3.7: was requiring 2+ confluences for CHoCH and score>=50/65 — this
    # combination was firing ~0 signals across every 30-min run for weeks
    # (confirmed via Gist history: crypto/forex/stocks all stayed `[]`).
    # Loosened to 1 confluence for CHoCH and lower score floors; still
    # requires at least one real confluence (OB/FVG/sweep) via the
    # `confirmations == 0` guard above, so this isn't scoreless noise.
    if event["type"] == "CHoCH" and confirmations < 1:
        return None

    min_score = 55 if htf_counter else 40
    if score < min_score:
        return None

    # ── ATR — ruler for SL/TP distance only ──────────────────────────────────
    a = atr(candles)
    if not a:
        return None

    # ── Price levels ──────────────────────────────────────────────────────────
    entry = price
    if direction == "LONG":
        # SL just below the OB low (structural SL) — better than arbitrary ATR mult
        sl  = (ob["low"] * 0.9985) if ob else (entry - 2.0 * a)
        tp1 = entry + 1.5 * a
        tp2 = entry + 2.8 * a
        tp3 = entry + 4.5 * a
    else:
        sl  = (ob["high"] * 1.0015) if ob else (entry + 2.0 * a)
        tp1 = entry - 1.5 * a
        tp2 = entry - 2.8 * a
        tp3 = entry - 4.5 * a

    # R:R validation
    if direction == "LONG":
        risk = entry - sl
        if risk <= 0: return None
        rr_check   = (tp3 - entry) / risk
        rr_display = round((tp2 - entry) / risk, 1)
    else:
        risk = sl - entry
        if risk <= 0: return None
        rr_check   = (entry - tp3) / risk
        rr_display = round((entry - tp2) / risk, 1)

    if rr_check < 1.5:
        return None  # minimum acceptable R:R

    # ── Grade ─────────────────────────────────────────────────────────────────
    if score >= 80:   grade = "A+"
    elif score >= 70: grade = "A"
    elif score >= 60: grade = "B"
    else:             grade = "C"

    # ── Expiry ────────────────────────────────────────────────────────────────
    expire_h   = EXPIRY_HOURS.get(tf.upper(), 16)
    expires_at = int(last["t"]) + (expire_h * 3600 * 1000)

    # ── Price formatting ──────────────────────────────────────────────────────
    if price >= 1000:  fmt = lambda x: f"{x:.2f}"
    elif price >= 1:   fmt = lambda x: f"{x:.4f}"
    else:              fmt = lambda x: f"{x:.6f}"

    now = datetime.now(timezone.utc)

    return {
        "pair"          : pair,
        "dir"           : direction,
        "entry"         : fmt(entry),
        "sl"            : fmt(sl),
        "tp1"           : fmt(tp1),
        "tp2"           : fmt(tp2),
        "tp"            : fmt(tp2),       # legacy alias for frontend compat
        "tp3"           : fmt(tp3),
        "score"         : score,
        "tf"            : tf.upper(),
        "grade"         : grade,
        "rr"            : str(rr_display),
        "time"          : now.strftime("%H:%M"),
        "ts"            : int(last["t"]),
        "expiresAt"     : expires_at,
        "bot"           : bot,
        "reasons"       : reasons,
        # Structure data
        "structure"     : structure,
        "event"         : event["type"],          # "BOS" / "CHoCH" / "none"
        "eventLevel"    : round(event.get("level", 0), 6),
        # Confluences
        "hasOB"         : ob is not None,
        "hasFVG"        : fvg is not None,
        "hasSweep"      : sweep["detected"],
        "sweepType"     : sweep.get("type", ""),
        "sweepWickPct"  : sweep.get("wick_pct", 0),
        "confirmations" : confirmations,
        # Context
        "htfBias"       : daily_bias,
        "inKillZone"    : kz,
        "source"        : "ict-smc",
    }

# ── Gist Publisher ────────────────────────────────────────────────────────────
# v3.7: read-merge-write instead of blind overwrite. gwp-bots (the real
# GWP Volume-Profile/Fibonacci engine) now also publishes to these same
# three files (tagged source:"gwp-bots") — a blind overwrite here would
# clobber those every 30 min. We only ever replace OUR OWN prior batch
# (source:"ict-smc") and drop anything expired; everything else is left
# untouched.
def push_gist(files_dict):
    if not GIST_PAT:
        print("❌ No GIST_PAT secret found — cannot write to Gist")
        return False

    now_ms = int(time.time() * 1000)
    merged_files = {}

    try:
        r = requests.get(
            f"https://api.github.com/gists/{GIST_ID}",
            headers={"Authorization": f"token {GIST_PAT}",
                     "Accept": "application/vnd.github.v3+json"},
            timeout=15,
        )
        existing_files = r.json().get("files", {}) if r.status_code == 200 else {}
    except Exception as e:
        print(f"  ⚠ Gist read failed, proceeding fresh-only: {e}")
        existing_files = {}

    for fname, fresh_list in files_dict.items():
        existing = []
        raw = existing_files.get(fname, {}).get("content")
        if raw:
            try:
                existing = json.loads(raw)
            except Exception:
                existing = []
        if not isinstance(existing, list):
            existing = []

        kept = [
            s for s in existing
            if s.get("source") != "ict-smc" and not (s.get("expiresAt") and s["expiresAt"] < now_ms)
        ]
        merged_files[fname] = (kept + fresh_list)[:40]

    r = requests.patch(
        f"https://api.github.com/gists/{GIST_ID}",
        headers={"Authorization": f"token {GIST_PAT}",
                 "Accept": "application/vnd.github.v3+json"},
        json={"files": {k: {"content": json.dumps(v, indent=2)} for k, v in merged_files.items()}},
        timeout=15
    )
    ok = r.status_code == 200
    if not ok: print(f"  ⚠ Gist update failed: {r.status_code} {r.text[:200]}")
    return ok

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    now_utc   = datetime.utcnow()
    utc_h     = now_utc.hour
    kz_active = (2 <= utc_h < 6) or (13 <= utc_h < 17)

    print(f"🤖 AxTrader Signal Bot v3.9 — {now_utc.strftime('%Y-%m-%d %H:%M')} UTC")
    print(f"   Mode: Pure Price Action | Zero Lagging Indicators")
    print(f"   Engine: Market Structure → BOS/CHoCH → Order Block → FVG → GWP Sweep")
    print(f"   Kill Zone: {'✅ London/NY active' if kz_active else '⏳ Off-hours'}\n")

    crypto_sigs, forex_sigs, stocks_sigs = [], [], []

    # ── Crypto ────────────────────────────────────────────────────────────────
    print("📊 Scanning crypto pairs…")
    for symbols, pair, bot, tf, min_price in CRYPTO_PAIRS:
        candles = fetch_yahoo_crypto(symbols, tf, limit=150, min_price=min_price)
        bias    = get_daily_bias(symbols[0], yahoo_candidates=symbols, min_price=min_price)
        bias_lbl = {1: "↑Bull", 0: "→Neut", -1: "↓Bear"}.get(bias, "?")

        sig = generate(candles, pair, bot, tf, daily_bias=bias)
        if sig:
            crypto_sigs.append(sig)
            print(f"  ✅ {pair}: {sig['dir']} {sig['grade']} score={sig['score']} "
                  f"rr={sig['rr']} [{sig['event']}] HTF={bias_lbl} | {' · '.join(sig['reasons'])}")
        else:
            print(f"  — {pair}: no PA setup (HTF={bias_lbl})")
        time.sleep(0.5)

    # ── Forex ─────────────────────────────────────────────────────────────────
    print("\n💱 Scanning forex pairs…")
    for symbols, pair, bot, tf in FOREX_PAIRS:
        candles = fetch_yahoo_fx(symbols, limit=150, interval="60m", range_="1mo")
        bias    = get_daily_bias(symbols[0], yahoo_candidates=symbols)
        bias_lbl = {1: "↑Bull", 0: "→Neut", -1: "↓Bear"}.get(bias, "?")

        sig = generate(candles, pair, bot, tf, daily_bias=bias)
        if sig:
            forex_sigs.append(sig)
            print(f"  ✅ {pair}: {sig['dir']} {sig['grade']} score={sig['score']} "
                  f"rr={sig['rr']} [{sig['event']}] HTF={bias_lbl} | {' · '.join(sig['reasons'])}")
        else:
            print(f"  — {pair}: no PA setup (HTF={bias_lbl})")
        time.sleep(0.5)

    # ── Stocks ────────────────────────────────────────────────────────────────
    print("\n📈 Scanning stock tickers…")
    for sym, pair, bot in STOCK_SYMBOLS:
        candles = fetch_yahoo(sym)
        sig = generate(candles, pair, bot, "1D", daily_bias=0)
        if sig:
            stocks_sigs.append(sig)
            print(f"  ✅ {pair}: {sig['dir']} {sig['grade']} score={sig['score']} "
                  f"rr={sig['rr']} [{sig['event']}] | {' · '.join(sig['reasons'])}")
        else:
            print(f"  — {pair}: no PA setup")
        time.sleep(0.5)

    total = len(crypto_sigs) + len(forex_sigs) + len(stocks_sigs)
    print(f"\n📤 Publishing {total} signal(s) → Gist…")
    if total == 0:
        print("   0 signals — no valid PA setups right now. Quality > quantity.")

    ok = push_gist({
        "crypto_signals.json" : crypto_sigs,
        "forex_signals.json"  : forex_sigs,
        "stocks_signals.json" : stocks_sigs,
    })

    if ok:
        print("✅ Gist updated!")
    else:
        print("❌ Gist update failed"); sys.exit(1)

if __name__ == "__main__":
    main()
