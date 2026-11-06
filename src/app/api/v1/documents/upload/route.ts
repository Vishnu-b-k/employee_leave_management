import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { DocumentService } from "@/modules/documents/document.service";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required." } },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_FILE", message: "File payload is required." } },
        { status: 400 }
      );
    }

    // Convert file to Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storedDoc = await DocumentService.saveLocalFile(
      buffer,
      file.name,
      file.type || "application/octet-stream"
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          storageKey: storedDoc.storageKey,
          originalFilename: storedDoc.originalFilename,
          mimeType: storedDoc.mimeType,
          fileSizeBytes: storedDoc.fileSizeBytes,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = error instanceof Error && (error.message.includes("Invalid file") || error.message.includes("exceeds maximum")) ? 400 : 500;
    return NextResponse.json(
      { success: false, error: { code: status === 400 ? "INVALID_FILE" : "INTERNAL_ERROR", message } },
      { status }
    );
  }
}
