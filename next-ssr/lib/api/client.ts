export class ApiError extends Error {
  status: number;
  statusText: string;
  url: string;

  constructor(status: number, statusText: string, url: string, message?: string) {
    super(message || `API error: ${status} ${statusText} at ${url}`);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.url = url;
  }
}

export const BASE_URL =
  process.env.API_ENDPOINT ||
  process.env.NEXT_PUBLIC_API_ENDPOINT ||
  "https://medingen.in/api/";

export async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path.replace(/^\//, "")}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText, url);
  }

  return response.json() as Promise<T>;
}

export async function fetchCached<T>(
  path: string,
  revalidateSeconds: number,
  options?: RequestInit
): Promise<T> {
  return fetchJson<T>(path, {
    ...options,
    next: {
      revalidate: revalidateSeconds,
      ...options?.next,
    },
  });
}

export async function fetchServer<T>(path: string, options?: RequestInit): Promise<T> {
  return fetchJson<T>(path, options);
}
