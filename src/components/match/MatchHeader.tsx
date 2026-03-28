import type { Match } from "@/types";
import { PlayerFlag } from "@/components/ui/PlayerFlag";
import { FormDots } from "@/components/ui/FormDots";
import type { PlayerStats } from "@/types";

interface MatchHeaderProps {
  match: Match;
  player1Stats?: PlayerStats | null;
  player2Stats?: PlayerStats | null;
}

export function MatchHeader({ match, player1Stats, player2Stats }: MatchHeaderProps) {
  const p1 = match.player1.player;
  const p2 = match.player2.player;

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Player 1 */}
          <div className="flex flex-col items-center text-center gap-2">
            <PlayerFlag flag={p1.countryFlag} size="lg" />
            <div>
              <p className="font-bold text-gray-900 text-lg leading-tight">{p1.name}</p>
              <p className="text-sm text-gray-400">#{p1.ranking}</p>
              {match.player1.seed && (
                <p className="text-xs text-gray-400">Seed {match.player1.seed}</p>
              )}
            </div>
            {player1Stats?.recentForm && (
              <FormDots form={player1Stats.recentForm} />
            )}
          </div>

          {/* VS / score */}
          <div className="flex flex-col items-center gap-1">
            {match.status === "completed" ? (
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {match.player1.score}
                </p>
                <p className="text-xs text-gray-400 mt-1">Final</p>
                <p className="text-3xl font-bold text-gray-300 tracking-tight mt-1">
                  {match.player2.score}
                </p>
              </div>
            ) : (
              <>
                <span className="text-2xl font-light text-gray-300">vs</span>
                <div className="text-center">
                  <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
                    {match.round}
                  </span>
                </div>
                {match.court && (
                  <span className="text-xs text-gray-400">{match.court}</span>
                )}
                {match.status === "live" && (
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    LIVE
                  </span>
                )}
              </>
            )}
          </div>

          {/* Player 2 */}
          <div className="flex flex-col items-center text-center gap-2">
            <PlayerFlag flag={p2.countryFlag} size="lg" />
            <div>
              <p className="font-bold text-gray-900 text-lg leading-tight">{p2.name}</p>
              <p className="text-sm text-gray-400">#{p2.ranking}</p>
              {match.player2.seed && (
                <p className="text-xs text-gray-400">Seed {match.player2.seed}</p>
              )}
            </div>
            {player2Stats?.recentForm && (
              <FormDots form={player2Stats.recentForm} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
