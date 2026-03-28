import { notFound } from "next/navigation";
import type { MatchDetail } from "@/types";
import { getMockMatchDetail, isMockMode } from "@/lib/api/mock";
import { cacheGet, CacheKeys } from "@/lib/cache/kv";
import { MatchHeader } from "@/components/match/MatchHeader";
import { AIPreviewCard } from "@/components/match/AIPreviewCard";
import {
  WinProbCard,
  MarketOddsCard,
  SurfaceEloCard,
  FatigueCard,
  H2HCard,
  KeyStatsCard,
} from "@/components/match/PredictionCards";
import { SurfaceBadge } from "@/components/ui/SurfaceBadge";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getMatchDetail(id: string): Promise<MatchDetail | null> {
  if (isMockMode()) return getMockMatchDetail(id);
  return await cacheGet<MatchDetail>(CacheKeys.match(id));
}

export default async function MatchPage({ params }: PageProps) {
  const { id } = await params;

  const detail = await getMatchDetail(id);
  if (!detail) notFound();

  // MatchDetail extends Match — detail itself contains match fields
  const match = detail;
  const { prediction, h2h, player1Stats, player2Stats, preview } = detail;
  const p1 = match.player1.player;
  const p2 = match.player2.player;

  return (
    <div className="min-h-screen">
      <MatchHeader match={match} player1Stats={player1Stats} player2Stats={player2Stats} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6 text-sm text-gray-500">
          {prediction && <SurfaceBadge surface={prediction.surface} />}
          <span>{match.round}</span>
          {match.court && <span>· {match.court}</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AI Preview — full width */}
          <AIPreviewCard matchId={id} initialPreview={preview} />

          {prediction && (
            <WinProbCard prediction={prediction} player1Name={p1.name} player2Name={p2.name} />
          )}

          {prediction && prediction.marketOdds.length > 0 && (
            <MarketOddsCard prediction={prediction} player1Name={p1.name} player2Name={p2.name} />
          )}

          {prediction && (
            <SurfaceEloCard prediction={prediction} player1Name={p1.name} player2Name={p2.name} />
          )}

          {prediction && (
            <FatigueCard prediction={prediction} player1Name={p1.name} player2Name={p2.name} />
          )}

          {h2h && (
            <H2HCard h2h={h2h} player1Name={p1.name} player2Name={p2.name} />
          )}

          {player1Stats && player2Stats && (
            <KeyStatsCard
              player1Stats={player1Stats}
              player2Stats={player2Stats}
              player1Name={p1.name}
              player2Name={p2.name}
            />
          )}
        </div>
      </div>
    </div>
  );
}
