export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    if (response.status === 429) {
      throw {
        status: 429,
        message: "Rate limit exceeded",
        details: error.details || "Too many requests, please try again later",
      };
    }
    throw error;
  }

  // Update rate limit meta tags
  const remaining = response.headers.get('x-ratelimit-remaining');
  const reset = response.headers.get('x-ratelimit-reset');
  
  if (remaining) {
    let meta = document.querySelector('meta[name="x-ratelimit-remaining"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'x-ratelimit-remaining');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', remaining);
  }

  return response.json();
}
