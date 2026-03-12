export async function apiRequest<T>(
  url: string,
  options?: RequestInit & { body?: unknown }
) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Request failed")
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
