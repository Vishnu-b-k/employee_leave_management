import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifySessionCookie, verifyIdToken } from "@/lib/firebase/admin";
import { UserService, AuthenticatedUser } from "@/modules/users/user.service";
import { AuthError, InactiveUserError } from "./errors";

import { CSRF_COOKIE_NAME } from "./csrf";

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "leaveflow_session";
export { CSRF_COOKIE_NAME };
export const SESSION_MAX_AGE = (Number(process.env.SESSION_COOKIE_MAX_AGE_DAYS) || 5) * 24 * 60 * 60; // in seconds

/**
 * Resolves the authenticated application user from the session cookie or bearer token.
 * Validates:
 * 1. Token signature and revocation in Firebase Admin.
 * 2. Active status in PostgreSQL.
 * 3. PostgreSQL role assignment.
 */
export async function getCurrentUser(request?: Request | NextRequest): Promise<AuthenticatedUser | null> {
  let sessionToken: string | undefined;

  // 1. Try reading cookie from Next.js cookies() API
  try {
    const cookieStore = await cookies();
    sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  } catch {
    // cookies() may throw outside Next.js request context
  }

  // 2. Try reading from request if provided
  if (!sessionToken && request) {
    if ("cookies" in request && typeof request.cookies.get === "function") {
      sessionToken = (request as NextRequest).cookies.get(SESSION_COOKIE_NAME)?.value;
    } else {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader
          .split(";")
          .map((c) => c.trim())
          .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
        if (match) {
          sessionToken = match.substring(SESSION_COOKIE_NAME.length + 1);
        }
      }
    }

    // Fallback: Authorization header Bearer token
    if (!sessionToken) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        sessionToken = authHeader.substring(7);
      }
    }
  }

  if (!sessionToken) {
    return null;
  }

  try {
    let firebaseUid: string;

    // Verify session cookie first (with checkRevoked = true)
    try {
      const decodedClaims = await verifySessionCookie(sessionToken, true);
      firebaseUid = decodedClaims.uid;
    } catch {
      // If session cookie verification fails, attempt ID token verification (allows bearer token testing)
      const decodedIdToken = await verifyIdToken(sessionToken, true);
      firebaseUid = decodedIdToken.uid;
    }

    // Authoritative PostgreSQL user resolution
    const appUser = await UserService.resolveByFirebaseUid(firebaseUid);

    if (!appUser) {
      return null;
    }

    return appUser;
  } catch {
    return null;
  }
}

/**
 * Enforces authentication. Throws AuthError if unauthenticated.
 */
export async function requireAuth(request?: Request | NextRequest): Promise<AuthenticatedUser> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new AuthError("Authentication required. Please log in.", 401, "UNAUTHENTICATED");
  }

  if (user.status !== "ACTIVE") {
    throw new InactiveUserError();
  }

  return user;
}
