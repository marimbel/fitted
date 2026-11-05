/**
 * services/apiClient.js
 *
 * Small shared fetch wrapper for calling the Express backend — the
 * Project 2 counterpart to tryOnService.js's "one place to change the
 * API call" idea. Every component that talks to the backend goes
 * through apiFetch() instead of calling fetch() directly, so the auth
 * header and error handling only need to be written once.
 *
 * VITE_API_BASE_URL is read from a .env file at the project root (see
 * .env.example) — Vite only exposes env vars prefixed with VITE_ to
 * browser code, as a safety boundary against accidentally shipping
 * server secrets into the bundle.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function apiFetch(path, { idToken, ...options } = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request to ${path} failed (${response.status})`);
  }
  return data;
}
