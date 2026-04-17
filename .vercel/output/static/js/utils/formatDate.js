// AxTrader Date/Time Formatting Utilities

/**
 * Format a timestamp to relative time string (e.g. "5m ago", "2h ago").
 */
export function relativeTime(ts) {
  if (!ts) return '--:--';
  const ms = Date.now() - ts;
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ${Math.floor((ms % 3600000) / 60000)}m ago`;
  return `${days}d ago`;
}

/**
 * Format an expiry timestamp.
 */
export function expiryTime(ts) {
  if (!ts) return '';
  const ms = ts - Date.now();
  if (ms <= 0) return 'Expired';
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return hrs > 0 ? `in ${hrs}h ${mins}m` : `in ${mins}m`;
}

/**
 * Format a timestamp to a short date string.
 */
export function shortDate(ts) {
  if (!ts) return '--';
  return new Date(ts).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

/**
 * Format a timestamp to a full date + time string.
 */
export function fullDateTime(ts) {
  if (!ts) return '--';
  return new Date(ts).toLocaleDateString('en', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Format minutes to a readable duration.
 */
export function durationMinutes(ms) {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

/**
 * Get a signal expiration date from a base timestamp and timeframe.
 */
export function calcExpiry(baseTs, timeframe) {
  if (!baseTs) return null;
  const tf = (timeframe || '4H').toUpperCase();
  const addMs = tf === '1H' ? 4 * 3600000 : tf === '1D' ? 78 * 3600000 : 16 * 3600000;
  return baseTs + addMs;
}
