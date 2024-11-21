export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 401) {
      throw {
        status: 401,
        message: "Authentication error",
        details: "Please check your API token configuration",
      };
    }

    throw {
      message: error.error || "Failed to fetch X user",
      details: error.details || "Unknown error occurred",
    };
  }

  return response.json();
}