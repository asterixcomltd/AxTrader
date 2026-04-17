// AxTrader API Client — centralized HTTP client with retry logic

const DEFAULT_RETRIES = 2;
const DEFAULT_TIMEOUT = 10000;

/**
 * Fetch wrapper with retry logic, error handling, and loading states.
 */
export async function apiFetch(url, options = {}) {
  const {
    retries = DEFAULT_RETRIES,
    timeout = DEFAULT_TIMEOUT,
    loadingKey = null,
    onError = null,
    ...fetchOptions
  } = options;

  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        throw error;
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      attempt++;

      if (attempt > retries) {
        if (onError) onError(error);
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * GET request.
 */
export async function get(url, options = {}) {
  return apiFetch(url, { ...options, method: 'GET' });
}

/**
 * POST request with JSON body.
 */
export async function post(url, body, options = {}) {
  return apiFetch(url, {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: JSON.stringify(body),
  });
}

/**
 * PUT request.
 */
export async function put(url, body, options = {}) {
  return apiFetch(url, {
    ...options,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request.
 */
export async function del(url, options = {}) {
  return apiFetch(url, { ...options, method: 'DELETE' });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
