import { NextRequest, NextResponse } from "next/server";
import { cacheGet, CacheKeys } from "@/lib/cache/kv";
import { getMockMatchDetail, isMockMode } from "@/lib/api/mock";
import type { MatchDetail } from "@/types";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (isMockMode()) {
    const detail = getMockMatchDetail(id);
    if (!detail) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    return NextResponse.json(detail);
  }

  const detail = await cacheGet<MatchDetail>(CacheKeys.match(id));
  if (!detail) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  return NextResponse.json(detail);
}
