/**
 * POST /api/results/update
 *
 * Called after a match result is confirmed (via cron polling).
 * Updates Elo ratings for both players and clears stale caches.
 *
 * Protected by CRON_SECRET header.
 */

import { NextRequest, NextResponse } from "next/server";
import type { Surface, Circuit } from "@/types";
import { recordMatchResult } from "@/lib/prediction/elo";
import { cacheDel, CacheKeys } from "@/lib/cache/kv";

interface ResultPayload {
  matchId: string;
  winnerId: string;
  loserId: string;
  surface: Surface;
  circuit: Circuit;
}

export async function POST(request: NextRequest) {
  // Verify cron secret
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: ResultPayload = await request.json();
    const { matchId, winnerId, loserId, surface, circuit } = body;

    if (!matchId || !winnerId || !loserId || !surface || !circuit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update Elo ratings
    await recordMatchResult(winnerId, loserId, surface, circuit);

    // Invalidate stale match cache
    await cacheDel(CacheKeys.match(matchId));
    await cacheDel(CacheKeys.matchPreview(matchId));
    await cacheDel(CacheKeys.matchPrediction(matchId));

    return NextResponse.json({ success: true, matchId });
  } catch (err) {
    console.error("[/api/results/update]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
