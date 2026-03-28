import Link from "next/link";
import type { Match, Round } from "@/types";
import { PlayerFlag } from "@/components/ui/PlayerFlag";
import { formatMatchTime } from "@/lib/utils";

interface ScheduleTabProps {
  matches: Match[];
}

const ROUND_ORDER: Round[] = ["F", "SF", "QF", "R16", "R32", "R64", "R128"];
const ROUND_LABELS: Record<Round, string> = {
  F: "Final",
  SF: "Semi-finals",
  QF: "Quarter-finals",
  R16: "Round of 16",
  R32: "Round of 32",
  R64: "Round of 64",
  R128: "Round of 128",
};

export function ScheduleTab({ matches }: ScheduleTabProps) {
  // Group by round
  const byRound = new Map<Round, Match[]>();
  for (const m of matches) {
    if (!byRound.has(m.round)) byRound.set(m.round, []);
    byRound.get(m.round)!.push(m);
  }

  const rounds = ROUND_ORDER.filter((r) => byRound.has(r));

  if (rounds.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm">
        Schedule not yet available
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {rounds.map((round) => (
        <section key={round} className="py-4">
          <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            {ROUND_LABELS[round]}
          </h3>
          <div className="space-y-0.5">
            {byRound.get(round)!.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MatchRow({ match }: { match: Match }) {
  const p1 = match.player1;
  const p2 = match.player2;
  const isLive = match.status === "live";
  const isDone = match.status === "completed";

  return (
    <Link
      href={`/match/${match.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
    >
      {/* Time / status */}
      <div className="w-16 shrink-0 text-center">
        {isLive ? (
          <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
            LIVE
          </span>
        ) : isDone ? (
          <span className="text-xs text-gray-300">Done</span>
        ) : match.scheduledTime ? (
          <span className="text-xs text-gray-400">
            {formatMatchTime(match.scheduledTime).split(",")[1]?.trim() ?? "TBC"}
          </span>
        ) : (
          <span className="text-xs text-gray-300">TBC</span>
        )}
      </div>

      {/* Players */}
      <div className="flex-1 min-w-0">
        <PlayerLine
          flag={p1.player.countryFlag}
          name={p1.player.name}
          seed={p1.seed}
          score={p1.score}
          isWinner={p1.isWinner}
          winProb={p1.winProbability}
          isDone={isDone}
        />
        <div className="my-0.5" />
        <PlayerLine
          flag={p2.player.countryFlag}
          name={p2.player.name}
          seed={p2.seed}
          score={p2.score}
          isWinner={p2.isWinner}
          winProb={p2.winProbability}
          isDone={isDone}
        />
      </div>

      {/* Arrow */}
      <span className="text-gray-300 group-hover:text-gray-500 transition-colors text-sm">
        →
      </span>
    </Link>
  );
}

function PlayerLine({
  flag,
  name,
  seed,
  score,
  isWinner,
  winProb,
  isDone,
}: {
  flag: string;
  name: string;
  seed?: number;
  score?: string;
  isWinner?: boolean;
  winProb?: number;
  isDone: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <PlayerFlag flag={flag} size="sm" />
      <span
        className={`flex-1 text-sm truncate ${
          isWinner ? "font-bold text-gray-900" : "font-medium text-gray-600"
        }`}
      >
        {name}
        {seed && (
          <span className="ml-1.5 text-xs text-gray-400 font-normal">
            [{seed}]
          </span>
        )}
      </span>

      {/* Show win prob for upcoming, score for completed */}
      {!isDone && winProb !== undefined && (
        <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded shrink-0">
          ⭐ {winProb}%
        </span>
      )}
      {isDone && score && (
        <span
          className={`text-sm font-medium shrink-0 ${
            isWinner ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {score}
        </span>
      )}
    </div>
  );
}
