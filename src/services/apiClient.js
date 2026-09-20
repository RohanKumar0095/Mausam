/**
 * MAUSAM API Client
 * Secure, safe HTTP wrapper with timeout, signal cancellation, and sanitized error handling.
 * Never prints or logs API keys.
 */

export async function safeFetch(url, options = {}) {
  const { timeout = 10000, signal: externalSignal, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // If external signal is provided, forward its abort
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = response.status;
      let errorType = 'HTTP_ERROR';
      let message = 'API request failed';

      if (status === 401 || status === 403) {
        errorType = 'AUTH_ERROR';
        message = 'Invalid or unauthorized API key.';
      } else if (status === 429) {
        errorType = 'RATE_LIMIT_ERROR';
        message = 'API rate limit exceeded. Please try again later.';
      } else if (status === 404) {
        errorType = 'NOT_FOUND';
        message = 'Weather data not found for requested location.';
      } else if (status >= 500) {
        errorType = 'SERVER_ERROR';
        message = 'External weather service is temporarily unavailable.';
      }

      const error = new Error(message);
      error.status = status;
      error.errorType = errorType;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      const abortErr = new Error('Request was cancelled or timed out.');
      abortErr.errorType = 'TIMEOUT_OR_CANCEL';
      throw abortErr;
    }

    if (!err.errorType) {
      err.errorType = 'NETWORK_ERROR';
      err.message = 'Unable to connect to weather data service. Check network connection.';
    }

    throw err;
  }
}
