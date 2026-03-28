/**
 * GET /api/cron/refresh-tournaments
 *
 * Runs every 6 hours (configured in vercel.json).
 * Refreshes the tournament list cache for both ATP and WTA circuits.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchTournaments } from "@/lib/api/tennis";
import { cacheSet, CacheKeys, TTL } from "@/lib/cache/kv";

export async function GET(request: NextRequest) {
  const secret =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    request.nextUrl.searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [atpTournaments, wtaTournaments] = await Promise.all([
      fetchTournaments("ATP"),
      fetchTournaments("WTA"),
    ]);

    await Promise.all([
      cacheSet(CacheKeys.tournaments("ATP"), atpTournaments, TTL.TOURNAMENTS),
      cacheSet(CacheKeys.tournaments("WTA"), wtaTournaments, TTL.TOURNAMENTS),
    ]);

    return NextResponse.json({
      success: true,
      atpCount: atpTournaments.length,
      wtaCount: wtaTournaments.length,
      refreshedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/cron/refresh-tournaments]", err);
    return NextResponse.json({ error: "Failed to refresh tournaments" }, { status: 500 });
  }
}
