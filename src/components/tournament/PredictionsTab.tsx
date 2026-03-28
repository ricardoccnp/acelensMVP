import Link from "next/link";
import type { Match } from "@/types";
import { PlayerFlag } from "@/components/ui/PlayerFlag";
import { WinProbBar } from "@/components/ui/WinProbBar";
import { formatMatchTime } from "@/lib/utils";

interface PredictionsTabProps {
  matches: Match[];
}

export function PredictionsTab({ matches }: PredictionsTabProps) {
  if (matches.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm">
        No upcoming matches with predictions yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {matches.map((match) => (
        <PredictionCard key={match.id} match={match} />
      ))}
    </div>
  );
}

function PredictionCard({ match }: { match: Match }) {
  const p1 = match.player1;
  const p2 = match.player2;
  const hasPrediction = p1.winProbability !== undefined;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
      {/* Players */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <PlayerFlag flag={p1.player.countryFlag} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {p1.player.name}
            </p>
            <p className="text-xs text-gray-400">#{p1.player.ranking}</p>
          </div>
        </div>

        <span className="text-xs font-bold text-gray-300">vs</span>

        <div className="flex-1 flex items-center gap-2 min-w-0 flex-row-reverse">
          <PlayerFlag flag={p2.player.countryFlag} size="sm" />
          <div className="min-w-0 text-right">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {p2.player.name}
            </p>
            <p className="text-xs text-gray-400">#{p2.player.ranking}</p>
          </div>
        </div>
      </div>

      {/* Win probability bar */}
      {hasPrediction && (
        <WinProbBar
          player1Name={p1.player.name.split(" ").pop() ?? p1.player.name}
          player2Name={p2.player.name.split(" ").pop() ?? p2.player.name}
          player1Prob={p1.winProbability!}
          player2Prob={p2.winProbability!}
        />
      )}

      {/* Metadata + CTA */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-xs text-gray-400">
          <span>{match.round}</span>
          {match.scheduledTime && (
            <span>· {formatMatchTime(match.scheduledTime)}</span>
          )}
        </div>
        <Link
          href={`/match/${match.id}`}
          className="text-xs font-semibold text-green-600 hover:text-green-700"
        >
          Full preview →
        </Link>
      </div>
    </div>
  );
}
