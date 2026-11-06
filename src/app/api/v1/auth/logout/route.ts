import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, SESSION_COOKIE_NAME, CSRF_COOKIE_NAME } from "@/lib/auth/session";
import { revokeUserTokens } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    // Attempt to revoke Firebase refresh tokens if user session is active
    const user = await getCurrentUser(request);
    if (user?.firebase_uid) {
      try {
        await revokeUserTokens(user.firebase_uid);
      } catch {
        // Token revocation error should not block cookie clearance
      }
    }

    const acceptHeader = request.headers.get("accept") || "";
    const wantsJson =
      acceptHeader.includes("application/json") && !acceptHeader.includes("text/html");

    const response = wantsJson
      ? NextResponse.json(
          {
            success: true,
            message: "Logged out successfully.",
          },
          { status: 200 }
        )
      : NextResponse.redirect(new URL("/login", request.url), { status: 303 });

    // Clear session and CSRF cookies
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      maxAge: 0,
      path: "/",
      httpOnly: true,
    });

    response.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: "",
      maxAge: 0,
      path: "/",
      httpOnly: false,
    });

    return response;
  } catch {
    const acceptHeader = request.headers.get("accept") || "";
    if (acceptHeader.includes("text/html") || !acceptHeader.includes("application/json")) {
      return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
    }
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "LOGOUT_ERROR",
          message: "Failed to cleanly logout session.",
        },
      },
      { status: 500 }
    );
  }
}

// Support GET for direct browser link navigations
export async function GET(request: NextRequest) {
  return POST(request);
}
