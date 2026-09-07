// Browser requests stay on the Next.js origin and are proxied by next.config.ts.
// API_URL remains available for any future server-side service calls.
export const API_URL =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
    : "";

export const AUTH_EXPIRED_EVENT = "mech:auth-expired";

type CsrfToken = {
  token: string;
  headerName: string;
  parameterName: string;
};

let csrfToken: CsrfToken | null = null;
let csrfRequest: Promise<CsrfToken> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function clearCsrfToken() {
  csrfToken = null;
  csrfRequest = null;
}

async function getCsrfToken(): Promise<CsrfToken> {
  if (csrfToken) return csrfToken;
  if (csrfRequest) return csrfRequest;

  csrfRequest = fetch(`${API_URL}/api/auth/csrf`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new ApiError("Unable to initialize request security", response.status);
      }
      return response.json() as Promise<CsrfToken>;
    })
    .then((value) => {
      csrfToken = value;
      return value;
    })
    .finally(() => {
      csrfRequest = null;
    });

  return csrfRequest;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const method = (init?.method ?? "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrf = await getCsrfToken();
    headers.set(csrf.headerName, csrf.token);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      message = body.message ?? body.error ?? message;
    } catch {}

    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
