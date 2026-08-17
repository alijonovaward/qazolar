const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// DRF error bodies come in two shapes: `{"detail": "..."}` (explicit
// Response(...) calls, built-in exceptions like NotFound/Throttled) or a
// serializer's field-keyed validation errors, e.g.
// `{"password_confirm": ["Parollar mos kelmadi."]}` or
// `{"non_field_errors": ["..."]}` for a serializer-level check. Only
// checking `detail` meant every validation failure (wrong password format,
// taken username, etc.) fell through to a generic "Xatolik yuz berdi" with
// no indication of what was actually wrong.
function extractErrorMessage(body: unknown): string {
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;

    const messages = Object.values(obj).flatMap((value) => {
      if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
      if (typeof value === "string") return [value];
      return [];
    });
    if (messages.length) return messages.join(" ");
  }
  return "So'rovda xatolik yuz berdi";
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 401 && retry) {
    const refreshed = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      return request<T>(path, options, false);
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, extractErrorMessage(body));
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
