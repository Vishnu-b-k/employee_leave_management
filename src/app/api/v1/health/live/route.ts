import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "employee-leave-management",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
    },
    { status: 200 }
  );
}
