# Quick Implementation Code Snippets

## 1. RENAME ATX → PlayCoins (Search/Replace)

**Find & Replace in index.html:**
```
Find: "ATX"
Replace: "PlayCoins"

Find: "⚡"
Replace: "🎮" (on balance displays)
```

Example results:
```javascript
// Before:
<div class="atx-strip-val">⚡ <span id="atx-balance">1,000</span> ATX</div>

// After:
<div class="atx-strip-val">🎮 <span id="atx-balance">1,000</span> PlayCoins</div>
```

---

## 2. ADD ADSTERRA ADS (Paste into <head>)

```html
<!-- Adsterra Ad Network (Gaming + Finance friendly) -->
<script type="text/javascript">
  atOptions = {
    'key' : 'YOUR_ADSTERRA_KEY_HERE',  <!-- Get from adsterra.com dashboard -->
    'format' : 'banner',
    'height' : 90,
    'width' : 728,
    'params' : {}
  };
  document.write('<scr'+'ipt type="text/javascript" src="//example.com/script.js"></scr'+'ipt>');
</script>
```

**How to get YOUR_ADSTERRA_KEY:**
1. Go to adsterra.com
2. Sign up (instant approval, no questions)
3. Go to Dashboard → Code/Zones
4. Copy your publisher key

---

## 3. ADD AD BANNERS TO PAGE (Paste into body)

**Top of page** (above games):
```html
<div style="text-align:center; margin:12px 0; background:#f0ede8; padding:10px; border-radius:10px; overflow:hidden">
  <script type="text/javascript">
    atOptions = {
      'key' : 'YOUR_ADSTERRA_KEY',
      'format' : 'banner',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };
    document.write('<scr'+'ipt type="text/javascript" src="//example.com/script.js"></scr'+'ipt>');
  </script>
</div>
```

**After game cards** (between Crash and Mines):
```html
<div style="text-align:center; margin:16px 0; background:#f0ede8; padding:10px; border-radius:10px">
  <script type="text/javascript">
    atOptions = {
      'key' : 'YOUR_ADSTERRA_KEY',
      'format' : 'banner',
      'height' : 300,
      'width' : 250,
      'params' : {}
    };
    document.write('<scr'+'ipt type="text/javascript" src="//example.com/script.js"></scr'+'ipt>');
  </script>
</div>
```

---

## 4. ADD AFFILIATE SECTION TO GAMES PAGE

**Add this after leaderboard, before game cards:**

```html
<!-- AFFILIATE PARTNERS SECTION -->
<div class="section-header" style="margin-top:24px">
  <div class="section-title">💰 Earn Real Money</div>
  <span style="font-size:.72rem;color:var(--text2)">Trade crypto, get commission</span>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
  <!-- Binance -->
  <a href="https://www.binance.com/en/register?ref=YOUR_BINANCE_ID" target="_blank" style="text-decoration:none;color:inherit">
    <div style="background:var(--surface);padding:14px;border-radius:12px;text-align:center;border:1px solid var(--border);cursor:pointer;transition:.2s;hover:{background:var(--surface2)}">
      <div style="font-size:2rem;margin-bottom:6px">💎</div>
      <div style="font-weight:600;color:var(--text);font-size:.9rem">Binance</div>
      <div style="font-size:.7rem;color:var(--text2);margin-top:4px">Earn 20% commission</div>
      <button style="background:var(--gold);color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:600;font-size:.8rem;margin-top:8px;cursor:pointer;width:100%">Sign Up</button>
    </div>
  </a>

  <!-- OKX -->
  <a href="https://www.okx.com/join/YOUR_OKX_ID" target="_blank" style="text-decoration:none;color:inherit">
    <div style="background:var(--surface);padding:14px;border-radius:12px;text-align:center;border:1px solid var(--border);cursor:pointer;transition:.2s">
      <div style="font-size:2rem;margin-bottom:6px">⚡</div>
      <div style="font-weight:600;color:var(--text);font-size:.9rem">OKX</div>
      <div style="font-size:.7rem;color:var(--text2);margin-top:4px">Earn 30% commission</div>
      <button style="background:var(--blue);color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:600;font-size:.8rem;margin-top:8px;cursor:pointer;width:100%">Sign Up</button>
    </div>
  </a>

  <!-- Kraken -->
  <a href="https://www.kraken.com/referral/RKD12345" target="_blank" style="text-decoration:none;color:inherit">
    <div style="background:var(--surface);padding:14px;border-radius:12px;text-align:center;border:1px solid var(--border);cursor:pointer;transition:.2s">
      <div style="font-size:2rem;margin-bottom:6px">🐙</div>
      <div style="font-weight:600;color:var(--text);font-size:.9rem">Kraken</div>
      <div style="font-size:.7rem;color:var(--text2);margin-top:4px">Earn 30% commission</div>
      <button style="background:var(--green);color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:600;font-size:.8rem;margin-top:8px;cursor:pointer;width:100%">Sign Up</button>
    </div>
  </a>

  <!-- Luno (African-friendly) -->
  <a href="https://www.luno.com/en/register?referrer=YOUR_LUNO_ID" target="_blank" style="text-decoration:none;color:inherit">
    <div style="background:var(--surface);padding:14px;border-radius:12px;text-align:center;border:1px solid var(--border);cursor:pointer;transition:.2s">
      <div style="font-size:2rem;margin-bottom:6px">🪙</div>
      <div style="font-weight:600;color:var(--text);font-size:.9rem">Luno</div>
      <div style="font-size:.7rem;color:var(--text2);margin-top:4px">Earn 40% commission</div>
      <button style="background:var(--premium);color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:600;font-size:.8rem;margin-top:8px;cursor:pointer;width:100%">Sign Up</button>
    </div>
  </a>
</div>

<div style="background:#f0ede8;border-left:3px solid var(--gold);padding:12px;border-radius:8px;font-size:.8rem;color:var(--text2);margin-bottom:16px">
  <strong style="color:var(--text)">💡 How it works:</strong> Sign up via our link, deposit crypto, trade. We earn commission on your trading fees. You get world-class trading platforms. Win-win!
</div>
```

---

## 5. ADD PREMIUM SECTION TO MORE PAGE

**Add to the More page (after Account section):**

```html
<!-- ─── SECTION: PREMIUM FEATURES ─────────────────────────── -->
<div class="more-section-label">⭐ Premium Features</div>
<div class="more-section" style="margin:0 16px 16px">
  <div class="more-row" onclick="openPremiumModal()">
    <div class="more-row-icon" style="background:var(--premium-bg)">🚀</div>
    <div class="more-row-text">
      <h5>Auto Signal Copier</h5>
      <p>Automatically copy pro trader signals to your broker</p>
    </div>
    <span class="more-row-badge">$9.99/mo</span>
    <span class="more-row-arrow">›</span>
  </div>
</div>

<!-- ─── SECTION: COSMETICS SHOP ─────────────────────────── -->
<div class="more-section-label">🛍️ Cosmetics & Upgrades</div>
<div style="padding:0 16px 16px">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <!-- Premium Avatar -->
    <div onclick="buyCosmetic('avatar')" style="background:var(--surface);padding:14px;border-radius:12px;text-align:center;cursor:pointer;border:1px solid var(--border);transition:.2s">
      <div style="font-size:2rem;margin-bottom:6px">👤</div>
      <div style="font-weight:600;color:var(--text);font-size:.85rem">Premium Avatar</div>
      <div style="font-size:.7rem;color:var(--text2);margin:4px 0">Stand out on leaderboard</div>
      <button style="background:var(--gold);color:#fff;border:none;border-radius:8px;padding:8px;font-weight:600;font-size:.75rem;width:100%;margin-top:8px;cursor:pointer">$0.99</button>
    </div>

    <!-- Theme Pack -->
    <div onclick="buyCosmetic('theme')" style="background:var(--surface);padding:14px;border-radius:12px;text-align:center;cursor:pointer;border:1px solid var(--border);transition:.2s">
      <div style="font-size:2rem;margin-bottom:6px">🎨</div>
      <div style="font-weight:600;color:var(--text);font-size:.85rem">Dark Theme Pack</div>
      <div style="font-size:.7rem;color:var(--text2);margin:4px 0">Premium dark mode</div>
      <button style="background:var(--blue);color:#fff;border:none;border-radius:8px;padding:8px;font-weight:600;font-size:.75rem;width:100%;margin-top:8px;cursor:pointer">$1.99</button>
    </div>

    <!-- Golden Nameplate -->
    <div onclick="buyCosmetic('nameplate')" style="background:var(--surface);padding:14px;border-radius:12px;text-align:center;cursor:pointer;border:1px solid var(--border);transition:.2s">
      <div style="font-size:2rem;margin-bottom:6px">👑</div>
      <div style="font-weight:600;color:var(--text);font-size:.85rem">Golden Nameplate</div>
      <div style="font-size:.7rem;color:var(--text2);margin:4px 0">Shine on leaderboards</div>
      <button style="background:var(--gold);color:#fff;border:none;border-radius:8px;padding:8px;font-weight:600;font-size:.75rem;width:100%;margin-top:8px;cursor:pointer">$0.49</button>
    </div>

    <!-- VIP Badge -->
    <div onclick="buyCosmetic('vip')" style="background:var(--surface);padding:14px;border-radius:12px;text-align:center;cursor:pointer;border:1px solid var(--border);transition:.2s">
      <div style="font-size:2rem;margin-bottom:6px">💎</div>
      <div style="font-weight:600;color:var(--text);font-size:.85rem">VIP Badge</div>
      <div style="font-size:.7rem;color:var(--text2);margin:4px 0">Show your status</div>
      <button style="background:var(--premium);color:#fff;border:none;border-radius:8px;padding:8px;font-weight:600;font-size:.75rem;width:100%;margin-top:8px;cursor:pointer">$2.99</button>
    </div>
  </div>
</div>
```

---

## 6. ADD JAVASCRIPT FOR COSMETICS & PREMIUM

**Add to index.html before closing </script>:**

```javascript
// ============ COSMETICS & PREMIUM SHOP ============

function buyCosmetic(item) {
  const prices = {
    'avatar': 0.99,
    'theme': 1.99,
    'nameplate': 0.49,
    'vip': 2.99
  };
  
  const price = prices[item];
  const paypalMe = `https://paypal.me/axtrader/${price}?item=${item}`;
  
  if (confirm(`🛒 Buy ${item} for $${price}? You'll be redirected to PayPal.`)) {
    window.open(paypalMe, '_blank');
    showToast(`✨ Sent to PayPal! After payment, your item will appear in your profile.`);
  }
}

function openPremiumModal() {
  const modal = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:1000" onclick="this.remove()">
      <div style="background:var(--surface);border-radius:16px;padding:28px;max-width:400px;width:90%" onclick="event.stopPropagation()">
        <h2 style="font-family:'Space Grotesk',sans-serif;font-size:1.4rem;margin-bottom:12px">⭐ Premium Features</h2>
        
        <div style="margin:16px 0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <span style="font-size:1.4rem">🚀</span>
            <div>
              <div style="font-weight:600">Auto Signal Copier</div>
              <div style="font-size:.75rem;color:var(--text2)">Auto-execute pro trades on your broker</div>
            </div>
          </div>
          
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <span style="font-size:1.4rem">📊</span>
            <div>
              <div style="font-weight:600">Advanced Analytics</div>
              <div style="font-size:.75rem;color:var(--text2)">Backtest signals, view ROI curves</div>
            </div>
          </div>
          
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <span style="font-size:1.4rem">📧</span>
            <div>
              <div style="font-weight:600">Daily Email Alerts</div>
              <div style="font-size:.75rem;color:var(--text2)">Get top signals before markets open</div>
            </div>
          </div>
          
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
            <span style="font-size:1.4rem">🚫</span>
            <div>
              <div style="font-weight:600">No Ads</div>
              <div style="font-size:.75rem;color:var(--text2)">Clean experience, no interruptions</div>
            </div>
          </div>
        </div>
        
        <div style="background:var(--gold-bg);border-left:3px solid var(--gold);padding:12px;border-radius:8px;margin:16px 0;font-size:.8rem">
          <strong>First month $4.99, then $9.99/month</strong>
        </div>
        
        <button onclick="openPremiumCheckout()" style="width:100%;padding:14px;background:var(--gold);color:#fff;border:none;border-radius:10px;font-weight:700;font-size:.95rem;cursor:pointer;margin-bottom:8px">
          Start Premium
        </button>
        
        <button onclick="this.parentElement.parentElement.remove()" style="width:100%;padding:10px;background:var(--surface2);color:var(--text);border:none;border-radius:10px;font-weight:600;font-size:.9rem;cursor:pointer">
          Maybe Later
        </button>
      </div>
    </div>
  `;
  
  document.body.innerHTML += modal;
}

function openPremiumCheckout() {
  // Option 1: Use PayPal subscription
  window.open('https://paypal.me/axtrader/4.99?item=premium-month-1', '_blank');
  
  // Option 2: Use Stripe (if you setup later)
  // redirect to https://your-domain.com/checkout/premium
  
  showToast('✨ Opening payment page...');
}
```

---

## 7. HIDE/REMOVE WALLET & DEPOSIT UI

**Search for and comment out/delete:**

```javascript
// FIND AND REMOVE:
- Wallet Connection button
- Deposit button  
- Withdrawal button
- Polygon network detection
- Stripe/payment processing code
```

**Before:**
```html
<button class="nav-item" onclick="navTo('wallet')">💳 Wallet</button>
```

**After:**
```html
<!-- REMOVED: Wallet button (using ads + affiliate instead) -->
```

---

## 8. UPDATE ToS/About

**Add to About/Terms section:**

```html
<div style="background:var(--gold-bg);border-left:3px solid var(--gold);padding:12px;border-radius:8px;margin:16px 0;font-size:.75rem">
  <strong style="color:var(--text)">📋 Important:</strong> AxTrader uses PlayCoins for simulated gaming. PlayCoins have NO real value. Games are for entertainment only. Visit our affiliate partners to trade real crypto or sports.
</div>
```

---

## INSTALLATION SUMMARY

**Files to modify:**
- index.html (main app file)

**Lines to add:**
- ~40 lines Adsterra ad code
- ~50 lines affiliate partner section
- ~60 lines premium/cosmetics shop
- ~80 lines JavaScript for purchases

**Total additions:** ~230 lines  
**Time to implement:** 2 hours  
**Testing:** 30 mins  
**Deployment:** 15 mins  

