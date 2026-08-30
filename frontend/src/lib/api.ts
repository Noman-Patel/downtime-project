// Browser requests stay on the Next.js origin and are proxied by next.config.ts.
// Server-side dashboard requests can continue talking to Spring directly.
export const API_URL =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
    : "";

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.message ?? body.error ?? message;
    } catch {}
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
