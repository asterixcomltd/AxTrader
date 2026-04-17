// AxTrader Referral Feature Module

import { store } from '../store.js';
import { showToast, copyToClipboard } from '../utils/dom.js';

export function initReferral() {
  // Generate or restore referral code
  let code = store.get('referralCode');
  if (!code) {
    const user = store.get('user');
    code = user?.name ? `axtrader-${user.name.toLowerCase().replace(/\s+/g, '-')}` : 'axtrader-' + Math.random().toString(36).substring(2, 6);
    store.set('referralCode', code);
    try { localStorage.setItem('axtrader_referral_code', code); } catch {}
  }
  // Populate referral link input
  const input = document.getElementById('referral-link-input');
  if (input) input.value = `${window.location.origin}?ref=${code}`;
}

export function copyReferralLink() {
  const input = document.getElementById('referral-link-input');
  if (input && input.value) {
    copyToClipboard(input.value, 'Referral link');
  }
}

export function shareReferral(platform) {
  const link = document.getElementById('referral-link-input')?.value || window.location.href;
  const text = 'Join AxTrader and get 7 days of free Premium with my referral link!';

  switch (platform) {
    case 'whatsapp':
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`, '_blank');
      break;
    case 'telegram':
      window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, '_blank');
      break;
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`, '_blank');
      break;
    case 'native':
      if (navigator.share) {
        navigator.share({ title: 'AxTrader', text, url: link }).catch(() => {});
      } else {
        copyReferralLink();
      }
      break;
    default:
      copyReferralLink();
  }
}

// Expose for inline handlers
window.copyReferralLink = copyReferralLink;
window.shareReferral = shareReferral;
