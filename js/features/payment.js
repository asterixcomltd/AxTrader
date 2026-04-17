// AxTrader Payment Feature Module
// NOWPayments integration, MoMo, bank wire, premium codes

import { store } from '../store.js';
import { PAYMENT, TELEGRAM_SUPPORT } from '../config.js';
import { showToast, openOverlay, closeOverlay, copyToClipboard } from '../utils/dom.js';

let _npCountdown = null;
let _currentWireRef = '';

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
    const userId = user?.email || user?.name || 'guest';

    const res = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: `${userId}_${Date.now()}`,
        price_amount: PAYMENT.premium_price,
        price_currency: PAYMENT.premium_currency,
        pay_currency: currency,
        payer_email: user?.email || undefined,
      }),
    });

    if (!res.ok) throw new Error('Payment creation failed');
    const payment = await res.json();

    if (loading) loading.style.display = 'none';
    if (details) details.style.display = 'block';

    document.getElementById('np-pay-amount').textContent = `${payment.pay_amount} ${payment.pay_currency?.toUpperCase()}`;
    document.getElementById('np-address').textContent = payment.pay_address;
    document.getElementById('np-qr').src = payment.qr_code || '';

    // Start countdown
    if (_npCountdown) clearInterval(_npCountdown);
    startNpCountdown(payment.expiration_estimate);
    // Start status polling
    startNpPolling(payment.payment_id);

  } catch {
    showToast('Could not create payment - try another method or contact support.');
    closeOverlay('np-payment-overlay');
  }
}

function startNpPolling(paymentId) {
  const interval = setInterval(async () => {
    try {
      const res = await fetch(`/api/payments/status?payment_id=${paymentId}`);
      if (!res.ok) return;
      const status = await res.json();

      if (status.payment_status === 'finished' || status.payment_status === 'confirming') {
        clearInterval(interval);
        grantPremiumAutomatically();
        showNpConfirmed();
      } else if (status.payment_status === 'expired' || status.payment_status === 'refunded' || status.payment_status === 'failed') {
        clearInterval(interval);
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
  closeOverlay('upgrade-overlay');
  openOverlay('wire-overlay', true);
}

export function notifyBankTransfer() {
  const ref = _currentWireRef;
  const user = store.get('user');
  const message = `Premium Payment - Bank Wire\nRef: ${ref}\nUser: ${user?.email || 'unknown'}\nName: ${user?.name || 'unknown'}`;
  window.open(`${TELEGRAM_SUPPORT}?text=${encodeURIComponent(message)}`, '_blank');
  showToast('Admin notified - expect activation within 24h');
}

// ── Premium Codes ───────────────────────────────────────────

export function grantPremium(code) {
  // Validate code against allowed prefix 'AXT'
  if (!code || !code.startsWith('AXT')) {
    showToast('Invalid code');
    return false;
  }
  store.setPremium(code);
  showToast('Premium activated! Welcome to the inner circle');
  return true;
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
