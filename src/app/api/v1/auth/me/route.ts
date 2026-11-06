import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "No active session found or session has expired.",
        },
      },
      { status: 401 }
    );
  }

  if (user.status !== "ACTIVE") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "USER_INACTIVE",
          message: "User account is inactive. Please contact your administrator.",
        },
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        roles: user.roles,
        department: user.department_id
          ? {
              id: user.department_id,
              name: user.department_name,
            }
          : null,
        manager: user.manager_id
          ? {
              id: user.manager_id,
              displayName: user.manager_name,
            }
          : null,
        isEmployee: user.isEmployee,
        isManager: user.isManager,
        isHOD: user.isHOD,
      },
    },
    { status: 200 }
  );
}
