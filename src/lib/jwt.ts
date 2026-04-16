/**
 * Decode JWT payload (no signature verification — same as any SPA using localStorage tokens).
 * Used only to read `exp` and drop obviously expired sessions without waiting for an API call.
 */
function base64UrlToJson(payload: string): Record<string, unknown> | null {
  try {
    let base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const json = atob(base64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getJwtExpiryMs(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = base64UrlToJson(parts[1]);
  if (!payload || typeof payload.exp !== "number") return null;
  return payload.exp * 1000;
}

/** True if token is missing exp, malformed, or past expiry (with small clock skew). */
export function isJwtExpired(token: string, skewMs = 60_000): boolean {
  const expMs = getJwtExpiryMs(token);
  if (expMs === null) return false;
  return Date.now() >= expMs - skewMs;
}
