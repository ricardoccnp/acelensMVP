/**
 * GET /api/match/[id]/preview
 *
 * Returns the AI-generated match preview. If no cached preview exists,
 * generates one on-demand using claude-sonnet-4-6 with prompt caching.
 *
 * Cache strategy: permanent KV storage until daily midnight cron clears it.
 */

import { NextRequest, NextResponse } from "next/server";
import { cacheGet, CacheKeys } from "@/lib/cache/kv";
import { getOrGeneratePreview } from "@/lib/ai/preview";
import { getMockMatchDetail, isMockMode } from "@/lib/api/mock";
import type { MatchDetail, MatchPreview } from "@/types";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    // Check cache first (fast path — no generation needed)
    const cached = await cacheGet<MatchPreview>(CacheKeys.matchPreview(id));
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch match detail — from mock data or KV depending on mode
    let matchDetail: MatchDetail | null;
    if (isMockMode()) {
      matchDetail = getMockMatchDetail(id);
    } else {
      matchDetail = await cacheGet<MatchDetail>(CacheKeys.match(id));
    }

    if (!matchDetail) {
      return NextResponse.json(
        { error: "Match data not available" },
        { status: 404 }
      );
    }

    const preview = await getOrGeneratePreview(matchDetail);

    if (!preview) {
      return NextResponse.json(
        {
          error: "Preview unavailable",
          message: "Preview unavailable — check back soon",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(preview);
  } catch (err) {
    console.error(`[/api/match/${id}/preview]`, err);
    return NextResponse.json(
      {
        error: "Preview unavailable",
        message: "Preview unavailable — check back soon",
      },
      { status: 500 }
    );
  }
}
