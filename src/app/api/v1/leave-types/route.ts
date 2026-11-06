import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const leaveTypes = await prisma.leaveTypeConfig.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      { success: true, data: leaveTypes },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
