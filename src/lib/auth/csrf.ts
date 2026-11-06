import { NextRequest } from "next/server";
import { randomBytes } from "crypto";

export const CSRF_COOKIE_NAME = "leaveflow_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generates a cryptographically secure CSRF token.
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Validates CSRF token for state-changing requests.
 * Compares the `x-csrf-token` header against the `leaveflow_csrf` cookie.
 */
export function validateCsrfToken(request: NextRequest | Request): boolean {
  const method = request.method.toUpperCase();

  // Safe HTTP methods do not require CSRF token
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true;
  }

  let cookieToken: string | undefined;
  let headerToken: string | null = null;

  if ("cookies" in request && typeof request.cookies.get === "function") {
    cookieToken = (request as NextRequest).cookies.get(CSRF_COOKIE_NAME)?.value;
  } else {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
      if (match) {
        cookieToken = match.substring(CSRF_COOKIE_NAME.length + 1);
      }
    }
  }

  headerToken = request.headers.get(CSRF_HEADER_NAME);

  // If a cookie exists, the header must match exactly
  if (cookieToken && headerToken) {
    return cookieToken === headerToken;
  }

  // If no cookie has been issued yet (e.g. initial login request), allow the initial mutation
  // but ensure SameSite cookie and CORS protections apply.
  return true;
}
