import { getToken } from "./token";
import { API_URL } from "./constants";

/**
 * Thin fetch wrapper that automatically attaches the Bearer token.
 * Use this for all API calls from the mobile app.
 *
 * Example:
 *   const res = await apiFetch("/api/mobile/sessions");
 *   const data = await res.json();
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${path}`, { ...options, headers });
}

/** Convenience: POST with a JSON body. */
export async function apiPost<T>(path: string, body: T): Promise<Response> {
  return apiFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Convenience: PATCH with a JSON body. */
export async function apiPatch<T>(path: string, body: T): Promise<Response> {
  return apiFetch(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
