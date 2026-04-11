#!/usr/bin/env python3
"""
AxTrader Signal Bot — Automated GWP Signal Generator
Runs every 30 min via GitHub Actions.
Fetches real OHLCV data → applies TA → writes signals to GitHub Gist.
"""

import requests, json, os, time, sys
from datetime import datetime, timezone

# ── Config ────────────────────────────────────────────────────────────────────
GIST_ID  = "a4caaf2993eea50322f31478391743b0"
GIST_PAT = os.environ.get("GIST_PAT", "")

BINANCE_URL = "https://api.binance.com/api/v3/klines"
YAHOO_URL   = "https://query1.finance.yahoo.com/v8/finance/chart/{}"

# Pairs to scan — (binance_symbol, display_pair, bot_type, interval)
CRYPTO_PAIRS = [
    ("BTCUSDT",  "BTC/USDT",  "crypto", "4h"),
    ("ETHUSDT",  "ETH/USDT",  "crypto", "4h"),
    ("SOLUSDT",  "SOL/USDT",  "crypto", "4h"),
    ("LINKUSDT", "LINK/USDT", "crypto", "4h"),
    ("UNIUSDT",  "UNI/USDT",  "crypto", "4h"),
    ("COMPUSDT", "COMP/USDT", "crypto", "4h"),
    ("DEXEUSDT", "DEXE/USDT", "crypto", "4h"),
]
FOREX_PAIRS = [
    ("XAUUSDT", "XAU/USD", "forex", "1h"),
    ("EURUSDT", "EUR/USD", "forex", "1h"),
    ("GBPUSDT", "GBP/USD", "forex", "1h"),
]
STOCK_SYMBOLS = [
    ("TSLA",  "TSLA",  "stocks"),
    ("NVDA",  "NVDA",  "stocks"),
    ("MSTR",  "MSTR",  "stocks"),
    ("AMD",   "AMD",   "stocks"),
    ("PLTR",  "PLTR",  "stocks"),
]

# ── Data Fetching ─────────────────────────────────────────────────────────────
def fetch_binance(symbol, interval, limit=60):
    try:
        r = requests.get(BINANCE_URL,
                         params={"symbol": symbol, "interval": interval, "limit": limit},
                         timeout=10)
        r.raise_for_status()
        return [{"t": d[0], "o": float(d[1]), "h": float(d[2]),
                 "l": float(d[3]), "c": float(d[4]), "v": float(d[5])}
                for d in r.json()]
    except Exception as e:
        print(f"  ⚠ Binance fetch failed for {symbol}: {e}")
        return []

def fetch_yahoo(symbol, limit=60):
    try:
        url = YAHOO_URL.format(symbol)
        r = requests.get(url,
                         params={"interval": "1d", "range": "6mo"},
                         headers={"User-Agent": "Mozilla/5.0"},
                         timeout=10)
        r.raise_for_status()
        res = r.json()["chart"]["result"][0]
        ts  = res["timestamp"]
        q   = res["indicators"]["quote"][0]
        candles = []
        for i in range(len(ts)):
            if q["close"][i] is None:
                continue
            candles.append({"t": ts[i]*1000, "o": q["open"][i],
                            "h": q["high"][i], "l": q["low"][i],
                            "c": q["close"][i], "v": q["volume"][i] or 0})
        return candles[-limit:]
    except Exception as e:
        print(f"  ⚠ Yahoo fetch failed for {symbol}: {e}")
        return []

# ── Technical Indicators ──────────────────────────────────────────────────────
def ema(values, period):
    k, result = 2 / (period + 1), [values[0]]
    for v in values[1:]:
        result.append(v * k + result[-1] * (1 - k))
    return result

def rsi(closes, period=14):
    gains, losses = [], []
    for i in range(1, len(closes)):
        d = closes[i] - closes[i-1]
        gains.append(max(d, 0)); losses.append(max(-d, 0))
    if len(gains) < period:
        return 50
    ag = sum(gains[:period]) / period
    al = sum(losses[:period]) / period
    for i in range(period, len(gains)):
        ag = (ag*(period-1) + gains[i]) / period
        al = (al*(period-1) + losses[i]) / period
    return 100 if al == 0 else round(100 - 100 / (1 + ag/al), 1)

def atr(candles, period=14):
    trs = [max(c["h"]-c["l"],
               abs(c["h"]-candles[i-1]["c"]),
               abs(c["l"]-candles[i-1]["c"]))
           for i, c in enumerate(candles) if i > 0]
    return sum(trs[-period:]) / period if trs else 0

# ── Signal Generator ──────────────────────────────────────────────────────────
def generate(candles, pair, bot, tf):
    if len(candles) < 30:
        return None

    closes = [c["c"] for c in candles]
    e9  = ema(closes, 9)
    e21 = ema(closes, 21)
    r   = rsi(closes)
    a   = atr(candles)
    price = closes[-1]

    if price == 0 or a == 0:
        return None

    # ── Trend detection ───────────────────────────────────────────────────────
    bull_cross = e9[-1] > e21[-1] and e9[-2] <= e21[-2]
    bear_cross = e9[-1] < e21[-1] and e9[-2] >= e21[-2]
    bull_trend = e9[-1] > e21[-1] and (e9[-1]-e21[-1])/e21[-1] > 0.0015
    bear_trend = e9[-1] < e21[-1] and (e21[-1]-e9[-1])/e21[-1] > 0.0015

    # ── Last candle structure ─────────────────────────────────────────────────
    last = candles[-1]
    bullish_candle = last["c"] > last["o"]
    bearish_candle = last["c"] < last["o"]

    # ── LONG setup ────────────────────────────────────────────────────────────
    if (bull_cross or bull_trend) and 38 <= r <= 68 and bullish_candle:
        direction = "LONG"
        entry = price
        sl    = entry - 2.0 * a
        tp1   = entry + 1.5 * a
        tp2   = entry + 2.8 * a
        tp3   = entry + 4.5 * a
        rr    = round((tp2 - entry) / (entry - sl), 1)
        score = 72 + (12 if bull_cross else 4) + (8 if 45<=r<=62 else 0) + (6 if price>e9[-1] else 0)

    # ── SHORT setup ───────────────────────────────────────────────────────────
    elif (bear_cross or bear_trend) and 32 <= r <= 62 and bearish_candle:
        direction = "SHORT"
        entry = price
        sl    = entry + 2.0 * a
        tp1   = entry - 1.5 * a
        tp2   = entry - 2.8 * a
        tp3   = entry - 4.5 * a
        rr    = round((entry - tp2) / (sl - entry), 1)
        score = 72 + (12 if bear_cross else 4) + (8 if 38<=r<=55 else 0) + (6 if price<e9[-1] else 0)

    else:
        return None   # No clear setup

    if rr < 1.8:
        return None   # Reject weak R:R

    score = min(int(score), 97)
    grade = "A" if score >= 87 else "B" if score >= 77 else "C"

    # ── Price formatting ──────────────────────────────────────────────────────
    if price >= 1000:   fmt = lambda x: f"{x:.2f}"
    elif price >= 1:    fmt = lambda x: f"{x:.4f}"
    else:               fmt = lambda x: f"{x:.6f}"

    now = datetime.now(timezone.utc)
    return {
        "pair"      : pair,
        "dir"       : direction,
        "entry"     : fmt(entry),
        "sl"        : fmt(sl),
        "tp1"       : fmt(tp1),
        "tp"        : fmt(tp2),
        "tp3"       : fmt(tp3),
        "score"     : score,
        "tf"        : tf.upper(),
        "grade"     : grade,
        "rr"        : str(rr),
        "time"      : now.strftime("%H:%M"),
        "ts"        : int(candles[-1]["t"]),
        "bot"       : bot,
    }

# ── Gist Publisher ────────────────────────────────────────────────────────────
def push_gist(files_dict):
    if not GIST_PAT:
        print("❌ No GIST_PAT secret found — cannot write to Gist")
        return False
    r = requests.patch(
        f"https://api.github.com/gists/{GIST_ID}",
        headers={"Authorization": f"token {GIST_PAT}",
                 "Accept": "application/vnd.github.v3+json"},
        json={"files": {k: {"content": json.dumps(v, indent=2)}
                        for k, v in files_dict.items()}},
        timeout=15
    )
    ok = r.status_code == 200
    if not ok:
        print(f"  ⚠ Gist update failed: {r.status_code} {r.text[:200]}")
    return ok

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print(f"🤖 AxTrader Signal Bot — {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC\n")

    crypto_sigs, forex_sigs, stocks_sigs = [], [], []

    # Crypto
    print("📊 Scanning crypto pairs…")
    for sym, pair, bot, tf in CRYPTO_PAIRS:
        candles = fetch_binance(sym, tf)
        sig = generate(candles, pair, bot, tf)
        if sig:
            crypto_sigs.append(sig)
            print(f"  ✅ {pair}: {sig['dir']} entry={sig['entry']} rr={sig['rr']} score={sig['score']}")
        else:
            print(f"  — {pair}: no setup")
        time.sleep(0.3)

    # Forex
    print("\n💱 Scanning forex pairs…")
    for sym, pair, bot, tf in FOREX_PAIRS:
        candles = fetch_binance(sym, tf)
        sig = generate(candles, pair, bot, tf)
        if sig:
            forex_sigs.append(sig)
            print(f"  ✅ {pair}: {sig['dir']} entry={sig['entry']} rr={sig['rr']} score={sig['score']}")
        else:
            print(f"  — {pair}: no setup")
        time.sleep(0.3)

    # Stocks
    print("\n📈 Scanning stock tickers…")
    for sym, pair, bot in STOCK_SYMBOLS:
        candles = fetch_yahoo(sym)
        sig = generate(candles, pair, bot, "1D")
        if sig:
            stocks_sigs.append(sig)
            print(f"  ✅ {pair}: {sig['dir']} entry={sig['entry']} rr={sig['rr']} score={sig['score']}")
        else:
            print(f"  — {pair}: no setup")
        time.sleep(0.5)

    # Summary
    total = len(crypto_sigs) + len(forex_sigs) + len(stocks_sigs)
    print(f"\n📤 Publishing {total} signal(s) → Gist…")
    print(f"   Crypto: {len(crypto_sigs)}  Forex: {len(forex_sigs)}  Stocks: {len(stocks_sigs)}")

    ok = push_gist({
        "crypto_signals.json" : crypto_sigs,
        "forex_signals.json"  : forex_sigs,
        "stocks_signals.json" : stocks_sigs,
    })

    if ok:
        print("✅ Gist updated successfully!")
    else:
        print("❌ Gist update failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
