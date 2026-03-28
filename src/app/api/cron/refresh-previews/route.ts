/**
 * GET /api/cron/refresh-previews
 *
 * Runs daily at 00:00 UTC (configured in vercel.json).
 * Clears all cached AI match previews so they regenerate fresh
 * on the next user visit.
 *
 * Protected by CRON_SECRET.
 */

import { NextRequest, NextResponse } from "next/server";
import { cacheDelPattern } from "@/lib/cache/kv";

export async function GET(request: NextRequest) {
  const secret =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    request.nextUrl.searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await cacheDelPattern("match:*:preview");

    return NextResponse.json({
      success: true,
      message: "All match previews cleared — will regenerate on next visit",
      clearedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/cron/refresh-previews]", err);
    return NextResponse.json({ error: "Failed to clear previews" }, { status: 500 });
  }
}
