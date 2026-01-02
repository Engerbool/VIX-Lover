const API_TIMEOUT = 10000;

export async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getApiBaseUrl(): string {
  // In development, Vite proxy or direct call
  // In production, Vercel serverless functions
  if (import.meta.env.DEV) {
    return '/api';
  }
  return '/api';
}
