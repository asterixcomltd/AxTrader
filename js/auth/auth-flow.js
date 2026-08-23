// AxTrader Authentication Flow Module
// Handles login/signup/password-reset UI, local storage auth,
// overlay management, and profile editing

import { store } from '../store.js';
import { t, setLang, getLang } from '../i18n.js';
import { navigate } from '../router.js';
import { openOverlay, closeOverlay, showToast } from '../utils/dom.js';
import { validateField, validateForm, showFieldErrors, clearFieldError } from '../utils/validate.js';
import { initSupabase } from './supabase.js';
import { AUTH, SUPPORT_EMAIL } from '../config.js';
import { boot, showApp, showAuth } from '../app.js';

// ── Auth State ────────────────────────────────────────────────

let authMode = 'signin'; // 'signin' or 'signup'

export function initAuth() {
  switchAuthTab('signin');
}

// ── Login/Logout ──────────────────────────────────────────────

export function loginUser(user) {
  store.setUser(user);
  syncPremiumFromServer(user?.email);
  showApp();
}

// Server (the premium_users gist, updated only by the NOWPayments webhook or
// admin) is the real source of truth for premium status — this reconciles it
// into the local session on every login so premium survives across devices
// and reinstalls, instead of only ever living in this device's localStorage.
async function syncPremiumFromServer(email) {
  if (!email) return;
  try {
    const res = await fetch(`/api/nowpayments?action=is-premium&email=${encodeURIComponent(email)}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.premium) store.setPremium('server_verified');
  } catch {
    // Network hiccup — leave existing local state as-is rather than
    // demoting a legitimately premium user due to a transient failure.
  }
}

export function doLogout() {
  store.clearUser();
  showAuth();
  showToast('Signed out');
}

// ── Auth Tab switching ────────────────────────────────────────

function switchAuthTab(mode) {
  authMode = mode;
  const signTab = document.getElementById('tab-signin');
  const upTab = document.getElementById('tab-signup');
  const signForm = document.getElementById('form-signin');
  const upForm = document.getElementById('form-signup');
  if (signTab) signTab.classList.toggle('active', mode === 'signin');
  if (upTab) upTab.classList.toggle('active', mode === 'signup');
  if (signForm) signForm.style.display = mode === 'signin' ? 'flex' : 'none';
  if (upForm) upForm.style.display = mode === 'signup' ? 'flex' : 'none';
}

// ── Sign-in handler ───────────────────────────────────────────

async function handleSignIn(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email')?.value?.trim();
  const password = document.getElementById('auth-password')?.value?.trim();

  const result = validateForm({
    email: { value: email, rules: { required: true, email: true } },
    password: { value: password, rules: { required: true, min: 8 } },
  });

  if (!result.valid) {
    Object.entries(result.errors).forEach(([k, errs]) => showFieldErrors(k, errs));
    return;
  }

  clearFieldError('email');
  clearFieldError('password');

  // Try Supabase first, fallback to local storage auth
  const supabase = await initSupabase();
  if (supabase) {
    try {
      const { data } = await supabase.auth.signInWithPassword({ email, password });
      if (data?.user) {
        loginUser({ name: data.user.user_metadata?.name || email, email: data.user.email });
        return;
      }
    } catch {
      // Fall through to local auth
    }
  }

  // Local fallback: accept any valid email + 8+ char password
  loginUser({ name: email.split('@')[0], email });
}

// ── Sign-up handler ───────────────────────────────────────────

async function handleSignUp(e) {
  e.preventDefault();
  const name = document.getElementById('auth-signup-name')?.value?.trim();
  const email = document.getElementById('auth-signup-email')?.value?.trim();
  const password = document.getElementById('auth-signup-password')?.value?.trim();

  const result = validateForm({
    name: { value: name, rules: { required: true } },
    email: { value: email, rules: { required: true, email: true } },
    password: { value: password, rules: { required: true, min: 8 } },
  });

  if (!result.valid) {
    Object.entries(result.errors).forEach(([k, errs]) => showFieldErrors(k, errs));
    return;
  }

  Object.keys(result.errors).forEach(clearFieldError);

  // Try Supabase first
  const supabase = await initSupabase();
  if (supabase) {
    try {
      const { data } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (data?.user) {
        loginUser({ name, email });
        showToast('Account created!');
        return;
      }
    } catch {
      // Fall through to local auth
    }
  }

  // Local fallback
  loginUser({ name, email });
  showToast('Account created!');
}

// ── Password reset ────────────────────────────────────────────

async function handlePasswordReset(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email')?.value?.trim();
  if (!email) return;

  const supabase = await initSupabase();
  let sent = false;
  if (supabase) {
    try {
      await supabase.auth.resetPasswordForEmail(email);
      sent = true;
    } catch {
      // Fall through to honest local-mode message below
    }
  }

  showToast(sent
    ? 'Reset link sent to your email'
    : `Password reset isn't available yet — contact ${SUPPORT_EMAIL} for help signing in.`);
  closeOverlay('forgot-overlay');
}

// ── Google Sign-In ──────────────────────────────────────────────

async function handleGoogleSignIn() {
  const supabase = await initSupabase();
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (!error) return;
  }

  // Fallback: use Google Identity Services
  if (window.google?.accounts?.id) {
    window.google.accounts.id.initialize({
      client_id: AUTH.google_client_id,
      callback: (response) => {
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        loginUser({ name: payload.name || payload.email, email: payload.email });
        showToast('Signed in with Google');
      },
    });
    window.google.accounts.id.prompt();
  } else {
    showToast('Google Sign-In requires script');
  }
}

// ── Profile editing ───────────────────────────────────────────

export function attachProfileListeners() {
  // Name change
  document.getElementById('profile-name')?.addEventListener('input', async function () {
    const name = this.value.trim();
    if (name) {
      const user = store.get('user');
      if (user && user.name !== name) {
        store.setUser({ ...user, name });
        const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        document.getElementById('topbar-initials').textContent = initials;
      }
    }
  });

  // Avatar upload
  document.getElementById('profile-avatar-btn')?.addEventListener('change', async function () {
    const file = this.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      try { localStorage.setItem('axtrader_avatar', dataUrl); } catch {}
      store.set('avatarDataURL', dataUrl);
      showToast('Profile picture updated');
    };
    reader.readAsDataURL(file);
  });
}

// ── Modal/Overlay listeners ────────────────────────────────────

export function attachModalListeners() {
  // Close overlays on backdrop click
  document.querySelectorAll('.overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        overlay.classList.remove('center');
        if (overlay.id === 'auth-screen') { /* do not close */ }
      }
    });
  });
}

// ── Auth listeners (event delegation) ─────────────────────────

export function attachAuthListeners() {
  document.addEventListener('click', (e) => {
    // Tab switching
    if (e.target.closest('#tab-signin')) { e.preventDefault(); switchAuthTab('signin'); }
    if (e.target.closest('#tab-signup')) { e.preventDefault(); switchAuthTab('signup'); }

    // Google sign-in
    if (e.target.closest('#google-signin-btn') || e.target.closest('[data-action="google-signin"]')) {
      e.preventDefault();
      handleGoogleSignIn();
    }

    // Forgot password
    if (e.target.closest('#forgot-password-link')) {
      e.preventDefault();
      closeOverlay('auth-screen');
      openOverlay('forgot-overlay', true);
    }

    // Upgrade button
    if (e.target.closest('#upgrade-btn') || e.target.closest('[data-action="upgrade"]')) {
      e.preventDefault();
      openOverlay('upgrade-overlay', true);
    }

    // Sign out
    if (e.target.closest('#signout-btn') || e.target.closest('[data-action="signout"]')) {
      e.preventDefault();
      doLogout();
    }

    // Open referral
    if (e.target.closest('[data-action="open-referral"]')) {
      e.preventDefault();
      navigate('referral');
    }

    // Open analytics
    if (e.target.closest('[data-action="open-analytics"]')) {
      e.preventDefault();
      navigate('analytics');
    }

    // Open profile
    if (e.target.closest('#topbar-avatar') || e.target.closest('[data-action="profile"]')) {
      e.preventDefault();
      openOverlay('profile-overlay', true);
    }

    // Close profile
    if (e.target.closest('#close-profile')) {
      e.preventDefault();
      closeOverlay('profile-overlay');
    }

    // Open upgrade from profile
    if (e.target.closest('#profile-upgrade-btn')) {
      e.preventDefault();
      closeOverlay('profile-overlay');
      openOverlay('upgrade-overlay', true);
    }

    // Close upgrade
    if (e.target.closest('#close-upgrade')) {
      e.preventDefault();
      closeOverlay('upgrade-overlay');
    }

    // Upgrade methods
    if (e.target.closest('[data-method="nowpay"]')) openNowPayments();
    if (e.target.closest('[data-method="telegram"]')) openTelegramPayment();
    if (e.target.closest('[data-method="wire"]')) openBankTransfer();

    // Apply referral code
    if (e.target.closest('#apply-ref-code')) {
      e.preventDefault();
      const input = document.getElementById('referral-code-input');
      if (input) {
        grantPremium(input.value.trim());
      }
    }

    // Save profile
    if (e.target.closest('#save-profile-btn')) {
      e.preventDefault();
      const name = document.getElementById('profile-name')?.value?.trim();
      if (name) {
        const user = store.get('user');
        if (user) store.setUser({ ...user, name });
        showToast('Profile saved');
      }
    }
  });

  // Form submissions
  document.getElementById('auth-form-signin')?.addEventListener('submit', handleSignIn);
  document.getElementById('auth-form-signup')?.addEventListener('submit', handleSignUp);
  document.getElementById('forgot-form')?.addEventListener('submit', handlePasswordReset);

  // Premium code input
  document.getElementById('premium-code-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      grantPremium(e.target.value.trim());
    }
  });
}

// Import these at the top for delegation
import { openNowPayments, openBankTransfer } from '../features/payment.js';
import { grantPremium } from '../features/payment.js';
import { openTelegramPayment } from '../features/payment.js';

// Google sign-in is triggered via Google Identity Services
window.handleGoogleSignIn = handleGoogleSignIn;
window.switchAuthTab = switchAuthTab;
