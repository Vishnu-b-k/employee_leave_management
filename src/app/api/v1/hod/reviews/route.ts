import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { LeaveService, LeaveWorkflowError } from "@/modules/leave/leave.service";
import { AuthorizationError } from "@/lib/auth/errors";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required." } },
        { status: 401 }
      );
    }

    if (!user.isHOD) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied. HOD role required." } },
        { status: 403 }
      );
    }

    const reviews = await LeaveService.getHodReviewRequests(user);

    return NextResponse.json(
      { success: true, data: reviews },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof LeaveWorkflowError || error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
