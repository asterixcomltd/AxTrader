// AxTrader DOM Utilities — safe DOM helpers, toast, overlays

/**
 * Create an element with optional attributes and children.
 */
export function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      // Use setHTML for safety when available
      if (element.setHTML) {
        element.setHTML(value);
      } else {
        element.innerHTML = value;
      }
    } else if (key.startsWith('on')) {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([k, v]) => { element.dataset[k] = v; });
    } else if (typeof value === 'boolean') {
      if (value) element.setAttribute(key, '');
    } else if (value !== null && value !== undefined) {
      element.setAttribute(key, value);
    }
  });
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  return element;
}

/**
 * Safely set HTML content (uses setHTML when available, falls back to innerHTML).
 */
export function setHTML(element, html) {
  if (element.setHTML) {
    element.setHTML(html);
  } else {
    element.innerHTML = html;
  }
}

/**
 * Show a toast notification.
 */
export function showToast(msg, duration = 3000) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = el('div', { id: 'toast', className: 'toast' });
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

/**
 * Open an overlay/modal by ID.
 */
export function openOverlay(id, center = false) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add('active');
  if (center) overlay.classList.add('center');
}

/**
 * Close an overlay/modal by ID.
 */
export function closeOverlay(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove('active');
  overlay.classList.remove('center');
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text, label = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`);
    return true;
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast(`${label} copied to clipboard`);
    return true;
  }
}

/**
 * Format a number with commas.
 */
export function formatNumber(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}

/**
 * Format a USD amount.
 */
export function formatUSD(n) {
  if (n == null) return '—';
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a number with K/M suffix for large values.
 */
export function compactNumber(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/**
 * Attach event via delegation on a parent element.
 */
export function delegate(parentSelector, childSelector, eventType, handler) {
  const parent = typeof parentSelector === 'string'
    ? document.querySelector(parentSelector)
    : parentSelector;
  if (!parent) return;
  parent.addEventListener(eventType, (e) => {
    const target = e.target.closest(childSelector);
    if (target && parent.contains(target)) {
      handler(e, target);
    }
  });
}
