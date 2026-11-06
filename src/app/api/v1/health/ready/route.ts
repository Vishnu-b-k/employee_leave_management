import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const startTime = Date.now();
  try {
    // Check PostgreSQL connection and query responsiveness
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "ready",
        service: "employee-leave-management",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        database: {
          status: "connected",
          latency_ms: latencyMs,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown database connection error";
    return NextResponse.json(
      {
        status: "not_ready",
        service: "employee-leave-management",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        database: {
          status: "disconnected",
          error: errorMessage,
        },
      },
      { status: 503 }
    );
  }
}
