import Link from "next/link";
import type { Match, Surface } from "@/types";
import { PlayerFlag } from "@/components/ui/PlayerFlag";
import { cn } from "@/lib/utils";

interface DrawTabProps {
  matches: Match[];
  surface: Surface;
}

const BRACKET_ROUNDS = ["QF", "SF", "F"] as const;
type BracketRound = (typeof BRACKET_ROUNDS)[number];

const ROUND_LABELS: Record<BracketRound, string> = {
  QF: "Quarter-finals",
  SF: "Semi-finals",
  F: "Final",
};

export function DrawTab({ matches }: DrawTabProps) {
  // Group by round — only show QF onwards
  const byRound = new Map<BracketRound, Match[]>();
  for (const m of matches) {
    if (BRACKET_ROUNDS.includes(m.round as BracketRound)) {
      const r = m.round as BracketRound;
      if (!byRound.has(r)) byRound.set(r, []);
      byRound.get(r)!.push(m);
    }
  }

  const hasData = BRACKET_ROUNDS.some((r) => byRound.has(r));

  if (!hasData) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm">
        Draw available from Quarter-finals onwards
      </div>
    );
  }

  return (
    <div className="overflow-x-auto px-4 py-6">
      {/* Note */}
      <p className="text-xs text-gray-400 mb-6 italic">
        Dashed border = predicted round. Earlier rounds visible in Schedule tab.
      </p>

      {/* Horizontal bracket */}
      <div className="flex gap-0 min-w-[640px]">
        {BRACKET_ROUNDS.map((round, colIdx) => {
          const roundMatches = byRound.get(round) ?? [];
          const isLast = colIdx === BRACKET_ROUNDS.length - 1;

          return (
            <div
              key={round}
              className={cn("flex flex-col flex-1", colIdx > 0 && "ml-4")}
            >
              {/* Round label */}
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
                {ROUND_LABELS[round]}
              </div>

              {/* Match cards — vertically spaced to align with bracket */}
              <div
                className={cn(
                  "flex flex-col gap-4",
                  round === "QF" && "justify-around",
                  round === "SF" && "justify-around mt-10",
                  round === "F" && "justify-center mt-20"
                )}
              >
                {roundMatches.length > 0 ? (
                  roundMatches.map((match) => (
                    <DrawMatchCard key={match.id} match={match} showConnector={!isLast} />
                  ))
                ) : (
                  // Predicted placeholder
                  <DrawMatchCard match={null} showConnector={!isLast} />
                )}
              </div>

              {/* Champion chip */}
              {round === "F" && (() => {
                const final = roundMatches[0];
                const winner = final?.player1.isWinner
                  ? final.player1
                  : final?.player2.isWinner
                  ? final.player2
                  : null;
                if (!winner) return null;
                return (
                  <div className="mt-4 flex justify-center">
                    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5">
                      <span>🏆</span>
                      <span className="text-xs font-bold text-yellow-800">
                        {winner.player.name}
                      </span>
                      {winner.winProbability && (
                        <span className="text-xs text-yellow-600">
                          {winner.winProbability}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DrawMatchCard({
  match,
  showConnector,
}: {
  match: Match | null;
  showConnector: boolean;
}) {
  const isLive = match?.status === "live";
  const isDone = match?.status === "completed";
  const isPredicted = !isDone && !isLive;

  const borderClass = isLive
    ? "border-green-400 shadow-sm shadow-green-100"
    : isPredicted
    ? "border-dashed border-purple-300"
    : "border-gray-200";

  if (!match) {
    return (
      <div
        className={cn(
          "relative rounded-xl border bg-white p-3 min-w-[180px]",
          "border-dashed border-gray-200"
        )}
      >
        <div className="h-8 bg-gray-50 rounded animate-pulse mb-1.5" />
        <div className="h-8 bg-gray-50 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative">
      <Link href={`/match/${match.id}`}>
        <div
          className={cn(
            "rounded-xl border-2 bg-white p-3 min-w-[180px] hover:bg-gray-50 transition-colors",
            borderClass
          )}
        >
          <DrawPlayerRow mp={match.player1} isDone={isDone ?? false} />
          <div className="my-1 border-t border-gray-50" />
          <DrawPlayerRow mp={match.player2} isDone={isDone ?? false} />
        </div>
      </Link>

      {/* Horizontal connector line to next round */}
      {showConnector && (
        <div className="absolute right-0 top-1/2 -translate-y-px w-4 h-px bg-gray-200" />
      )}
    </div>
  );
}

function DrawPlayerRow({
  mp,
  isDone,
}: {
  mp: Match["player1"];
  isDone: boolean;
}) {
  const isEliminated = isDone && !mp.isWinner;
  return (
    <div className="flex items-center gap-2">
      <PlayerFlag flag={mp.player.countryFlag} size="sm" />
      <span
        className={cn(
          "flex-1 text-xs font-semibold truncate",
          isEliminated ? "text-gray-300 line-through" : "text-gray-800"
        )}
      >
        {mp.player.name}
        {mp.seed && (
          <span className="ml-1 font-normal text-gray-400">[{mp.seed}]</span>
        )}
      </span>
      {mp.winProbability !== undefined && !isDone && (
        <span className="text-[10px] text-gray-400">{mp.winProbability}%</span>
      )}
    </div>
  );
}
