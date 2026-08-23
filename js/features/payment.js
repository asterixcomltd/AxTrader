// AxTrader Payment Feature Module
// NOWPayments integration, MoMo, bank wire, premium codes

import { store } from '../store.js';
import { TELEGRAM_SUPPORT } from '../config.js';
import { showToast, openOverlay, closeOverlay, copyToClipboard } from '../utils/dom.js';

let _npCountdown = null;
let _npPollInterval = null;
let _currentWireRef = '';

// Chrome sets this referrer specifically when a page is opened inside a
// Trusted Web Activity (i.e. our Android app shell) — reliable, no native
// code changes needed. Used to keep all purchase flows web-only, since
// Google Play requires Google Play Billing for in-app digital purchases;
// routing them through crypto/bank-wire inside the Android app would
// violate that policy. The TWA still reads live signals fine — only the
// purchase entry points are redirected to the browser.
export function isAndroidApp() {
  return document.referrer.startsWith('android-app://');
}

export function initPayments() {
  // Generate wire reference on init
  _currentWireRef = 'AXT-BT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function attachPaymentListeners() {
  // Wire modal reference
  const wireRef = document.getElementById('wire-ref');
  if (wireRef && _currentWireRef) wireRef.textContent = _currentWireRef;
}

// ── NOWPayments ─────────────────────────────────────────────

export function openNowPayments() {
  if (isAndroidApp()) return openWebOnlyNotice();
  openOverlay('np-currency-overlay', true);
}

export async function createNowPayment(currency) {
  closeOverlay('np-currency-overlay');
  openOverlay('np-payment-overlay', true);

  const loading = document.getElementById('np-loading');
  const details = document.getElementById('np-details');
  if (loading) loading.style.display = 'block';
  if (details) details.style.display = 'none';

  try {
    const user = store.get('user');
    if (!user?.email) throw new Error('Sign in with an email to purchase premium');

    const res = await fetch('/api/nowpayments?action=create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, currency }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Payment creation failed');
    }
    const payment = await res.json();

    if (loading) loading.style.display = 'none';
    if (details) details.style.display = 'block';

    document.getElementById('np-pay-amount').textContent = `${payment.pay_amount} ${payment.pay_currency?.toUpperCase()}`;
    document.getElementById('np-address').textContent = payment.pay_address;
    document.getElementById('np-qr').src = payment.qr_code || '';

    // Start countdown
    if (_npCountdown) clearInterval(_npCountdown);
    startNpCountdown(new Date(payment.expiration_estimate_date || Date.now() + 20 * 60000).getTime());
    // Start status polling
    startNpPolling(payment.payment_id);

  } catch (e) {
    showToast(e.message || 'Could not create payment - try another method or contact support.');
    closeOverlay('np-payment-overlay');
  }
}

function startNpPolling(paymentId) {
  if (_npPollInterval) clearInterval(_npPollInterval);
  _npPollInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/nowpayments?action=check&id=${paymentId}`);
      if (!res.ok) return;
      const status = await res.json();

      if (status.payment_status === 'finished' || status.payment_status === 'confirming') {
        clearInterval(_npPollInterval);
        grantPremiumAutomatically();
        showNpConfirmed();
      } else if (status.payment_status === 'expired' || status.payment_status === 'refunded' || status.payment_status === 'failed') {
        clearInterval(_npPollInterval);
        showToast('Payment expired or failed.');
        cancelNowPayment();
      }
    } catch {}
  }, 30000); // Poll every 30s
}

function startNpCountdown(expirationTs) {
  if (_npCountdown) clearInterval(_npCountdown);
  const updateCountdown = () => {
    const remaining = expirationTs - Date.now();
    const el = document.getElementById('np-countdown');
    if (remaining <= 0) {
      if (el) el.textContent = 'Expired';
      clearInterval(_npCountdown);
      return;
    }
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    if (el) el.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  updateCountdown();
  _npCountdown = setInterval(updateCountdown, 1000);
}

function showNpConfirmed() {
  const confirmed = document.getElementById('np-confirmed');
  if (confirmed) confirmed.style.display = 'block';
  const statusDot = document.getElementById('np-status-dot');
  const statusLabel = document.getElementById('np-status-label');
  if (statusDot) { statusDot.style.background = 'var(--green)'; statusDot.style.animation = 'none'; }
  if (statusLabel) statusLabel.textContent = 'Payment confirmed';
  showToast('Premium activated automatically! Welcome');
}

function grantPremiumAutomatically() {
  store.setPremium('nowpayments_auto');
}

export function cancelNowPayment() {
  if (_npCountdown) clearInterval(_npCountdown);
  closeOverlay('np-payment-overlay');
  // Reset modal states
  const confirmed = document.getElementById('np-confirmed');
  if (confirmed) confirmed.style.display = 'none';
  const statusDot = document.getElementById('np-status-dot');
  const statusLabel = document.getElementById('np-status-label');
  if (statusDot) { statusDot.style.background = '#f59e0b'; statusDot.style.animation = 'pulse 1.4s infinite'; }
  if (statusLabel) statusLabel.textContent = 'Waiting for payment...';
}

// ── Bank Wire ────────────────────────────────────────────────

export function openBankTransfer() {
  if (isAndroidApp()) return openWebOnlyNotice();
  closeOverlay('upgrade-overlay');
  openOverlay('wire-overlay', true);
}

function openWebOnlyNotice() {
  showToast('To upgrade, open axtrader.vercel.app in your browser — purchases aren\'t handled inside the app.');
  window.open('https://axtrader.vercel.app/?upgrade=1', '_blank');
}

export function notifyBankTransfer() {
  const ref = _currentWireRef;
  const user = store.get('user');
  const message = `Premium Payment - Bank Wire\nRef: ${ref}\nUser: ${user?.email || 'unknown'}\nName: ${user?.name || 'unknown'}`;
  window.open(`${TELEGRAM_SUPPORT}?text=${encodeURIComponent(message)}`, '_blank');
  showToast('Admin notified - expect activation within 24h');
}

// ── Premium Codes ───────────────────────────────────────────
// NOTE: there is no server endpoint yet to validate a manually-issued
// premium code — it was previously "validated" client-side only by
// checking the prefix 'AXT', which meant literally any string starting
// with those 3 letters granted free premium to anyone. Disabled until
// a real server-side redemption endpoint exists. Manual grants should
// go through addPremiumUser() in api/nowpayments.js (e.g. via the admin
// panel or a support-driven bank-wire confirmation) instead.
export function grantPremium(code) {
  showToast('Code redemption isn\'t available yet — contact support to activate premium manually.');
  return false;
}

// ── Copy helpers ────────────────────────────────────────────

export function copyNpField(elementId, label) {
  const el = document.getElementById(elementId);
  if (el) copyToClipboard(el.textContent, label);
}

export function copyWireField(value, label) {
  copyToClipboard(value, label);
}

// Expose for inline handlers
window.openNowPayments = openNowPayments;
window.createNowPayment = createNowPayment;
window.cancelNowPayment = cancelNowPayment;
window.openBankTransfer = openBankTransfer;
window.notifyBankTransfer = notifyBankTransfer;
window.grantPremium = grantPremium;
window.copyNpField = copyNpField;
window.copyWireField = copyWireField;
window.isAndroidApp = isAndroidApp;
