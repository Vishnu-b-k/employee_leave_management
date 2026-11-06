import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { DocumentService } from "@/modules/documents/document.service";
import { RBAC } from "@/lib/auth/rbac";

export async function GET(
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

    // Find document by UUID id or storage_key
    const doc = await prisma.document.findFirst({
      where: {
        OR: [{ id: id }, { storage_key: id }],
      },
      include: {
        leave_request: {
          include: {
            employee: {
              include: {
                department: true,
              },
            },
          },
        },
      },
    });

    if (!doc) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Document not found." } },
        { status: 404 }
      );
    }

    // Enforce RBAC on parent leave request
    const canAccess = RBAC.canAccessLeaveRequest(user, {
      id: doc.leave_request_id,
      employee_id: doc.leave_request.employee_id,
      status: doc.leave_request.status,
      employee: doc.leave_request.employee,
    });

    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied. You are not authorized to view this document." } },
        { status: 403 }
      );
    }

    // Retrieve file buffer from secure local disk storage
    const fileResult = await DocumentService.getLocalFile(doc.storage_key);

    if (!fileResult) {
      return NextResponse.json(
        { success: false, error: { code: "FILE_MISSING", message: "File data could not be located on storage." } },
        { status: 404 }
      );
    }

    // Set security headers to prevent sniffing or malicious execution
    const headers = new Headers();
    headers.set("Content-Type", fileResult.mimeType || "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(fileResult.filename)}"`);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Cache-Control", "private, max-age=3600");

    return new NextResponse(fileResult.buffer as any, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
