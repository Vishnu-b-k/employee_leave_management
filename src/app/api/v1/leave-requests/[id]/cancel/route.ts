import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { LeaveService, LeaveWorkflowError } from "@/modules/leave/leave.service";
import { AuthorizationError } from "@/lib/auth/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required." } },
        { status: 401 }
      );
    }

    const { id } = await params;
    let version: number | undefined;
    try {
      const body = await request.json();
      version = body?.version;
    } catch {
      // Body is optional
    }

    const result = await LeaveService.cancelLeaveRequest(user, id, version);

    return NextResponse.json(
      { success: true, data: result },
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
