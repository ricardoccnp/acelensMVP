/**
 * GET /api/tournaments?circuit=ATP|WTA
 *
 * Returns current and next tournament for the given circuit.
 * Uses mock data when RAPIDAPI_KEY is not set (demo / initial deploy).
 */

import { NextRequest, NextResponse } from "next/server";
import type { Circuit, Tournament } from "@/types";
import { fetchTournaments } from "@/lib/api/tennis";
import { cacheGetOrFetch, CacheKeys, TTL } from "@/lib/cache/kv";
import { getMockTournaments, isMockMode } from "@/lib/api/mock";

export async function GET(request: NextRequest) {
  const circuit = (request.nextUrl.searchParams.get("circuit") ?? "ATP") as Circuit;

  if (circuit !== "ATP" && circuit !== "WTA") {
    return NextResponse.json({ error: "Invalid circuit" }, { status: 400 });
  }

  try {
    // Mock mode — no API key configured
    if (isMockMode()) {
      const { current, next } = getMockTournaments(circuit);
      return NextResponse.json({ circuit, current, next, mock: true, fetchedAt: new Date().toISOString() });
    }

    const tournaments = await cacheGetOrFetch<Tournament[]>(
      CacheKeys.tournaments(circuit),
      () => fetchTournaments(circuit),
      TTL.TOURNAMENTS
    );

    if (!tournaments) {
      return NextResponse.json({ error: "Failed to load tournaments" }, { status: 503 });
    }

    const inProgress = tournaments
      .filter((t) => t.status === "in_progress")
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    const upcoming = tournaments
      .filter((t) => t.status === "upcoming")
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const current = inProgress[0] ?? upcoming[0] ?? null;
    const next = current
      ? (inProgress.length > 0 ? upcoming[0] : upcoming[1]) ?? null
      : upcoming[1] ?? null;

    return NextResponse.json({ circuit, current, next, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[/api/tournaments]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
