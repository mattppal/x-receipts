export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    if (response.status === 429) {
      throw {
        status: 429,
        message: "Rate limit exceeded",
        details: error.details || "Too many requests, please try again later",
        resetTime: error.resetTime,
      };
    }
    throw error;
  }

  // Get rate limit headers
  const limit = response.headers.get('x-ratelimit-limit');
  const remaining = response.headers.get('x-ratelimit-remaining');
  const reset = response.headers.get('x-ratelimit-reset');
  const wasCache = response.headers.get('x-cache-hit') === 'true';

  // Only update rate limit if it wasn't a cache hit
  if (!wasCache) {
    // Dispatch a custom event with rate limit info
    const rateLimitEvent = new CustomEvent('ratelimitupdate', {
      detail: {
        remaining: remaining ? parseInt(remaining, 10) : 3,
        limit: limit ? parseInt(limit, 10) : 3,
        resetTime: reset || null
      }
    });
    window.dispatchEvent(rateLimitEvent);
  }

  return response.json();
}
