import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyIdToken, createSessionCookie } from "@/lib/firebase/admin";
import { UserService } from "@/modules/users/user.service";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rate-limiter";
import { generateCsrfToken, CSRF_COOKIE_NAME } from "@/lib/auth/csrf";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth/session";

const loginSchema = z.object({
  idToken: z.string().min(10).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
}).refine((data) => data.idToken || (data.email && data.password), {
  message: "Either idToken or email and password must be provided",
});

/**
 * Exchange email/password for a Firebase ID token using the Identity Toolkit API.
 * Supports both production and Firebase Emulator.
 */
async function exchangePasswordForIdToken(email: string, password: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "assessment-api-key-demo";
  const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;

  let url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  if (emulatorHost) {
    const cleanHost = emulatorHost.replace(/^https?:\/\//, "");
    url = `http://${cleanHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });

  if (!response.ok) {
    throw new Error("Authentication failed");
  }

  const data = await response.json();
  return data.idToken;
}

export async function POST(request: NextRequest) {
  // Extract client IP for rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Rate limit: 5 attempts per minute per IP
  const rateLimit = checkRateLimit(ip, 5, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `Too many login attempts. Please try again in ${rateLimit.resetInSeconds} seconds.`,
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimit.resetInSeconds.toString(),
        },
      }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid login payload. Email and password or ID token required.",
          },
        },
        { status: 400 }
      );
    }

    const { idToken: providedIdToken, email, password } = parseResult.data;

    let idToken = providedIdToken;
    if (!idToken && email && password) {
      try {
        idToken = await exchangePasswordForIdToken(email, password);
      } catch {
        // Generic error: never leak whether email exists
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_CREDENTIALS",
              message: "Invalid email or password.",
            },
          },
          { status: 401 }
        );
      }
    }

    if (!idToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        },
        { status: 401 }
      );
    }

    // 1. Verify Firebase ID Token on Server
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(idToken, true);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid or expired authentication credentials.",
          },
        },
        { status: 401 }
      );
    }

    // 2. Authoritative PostgreSQL Application User Resolution
    const appUser = await UserService.resolveByFirebaseUid(decodedToken.uid);

    if (!appUser) {
      // Reject unknown or inactive users
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ACCESS_DENIED",
            message: "Account not authorized or access has been restricted.",
          },
        },
        { status: 403 }
      );
    }

    // 3. Create server-side session cookie (5 days duration)
    const sessionCookie = await createSessionCookie(idToken, SESSION_MAX_AGE * 1000);
    const csrfToken = generateCsrfToken();

    // Reset rate limiter on successful authentication
    resetRateLimit(ip);

    const isProduction = process.env.NODE_ENV === "production";

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: appUser.id,
          email: appUser.email,
          displayName: appUser.display_name,
          roles: appUser.roles,
          department: appUser.department_id
            ? {
                id: appUser.department_id,
                name: appUser.department_name,
              }
            : null,
          manager: appUser.manager_id
            ? {
                id: appUser.manager_id,
                displayName: appUser.manager_name,
              }
            : null,
        },
        csrfToken,
      },
      { status: 200 }
    );

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      maxAge: SESSION_MAX_AGE,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
    });

    // Set readable CSRF cookie for client header validation
    response.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: csrfToken,
      maxAge: SESSION_MAX_AGE,
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Authentication error";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AUTH_SERVER_ERROR",
          message: "An internal authentication error occurred.",
          details: process.env.NODE_ENV === "development" ? message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
