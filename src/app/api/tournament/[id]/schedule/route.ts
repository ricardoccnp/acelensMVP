import { NextRequest, NextResponse } from "next/server";
import { cacheGet, CacheKeys } from "@/lib/cache/kv";
import { getMockSchedule, isMockMode } from "@/lib/api/mock";
import type { Match } from "@/types";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (isMockMode()) {
    return NextResponse.json({ matches: getMockSchedule(id), mock: true });
  }

  const matches = await cacheGet<Match[]>(CacheKeys.tournamentSchedule(id));
  return NextResponse.json({ matches: matches ?? [] });
}
