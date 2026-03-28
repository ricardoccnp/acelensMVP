import type { MatchPrediction, H2HRecord, PlayerStats } from "@/types";
import { WinProbBar } from "@/components/ui/WinProbBar";
import { StatBar } from "@/components/ui/StatBar";
import { cn, fatigueColors, surfaceLabels } from "@/lib/utils";

// ─── Win Probability Card ────────────────────────────────────────────────────

export function WinProbCard({
  prediction,
  player1Name,
  player2Name,
}: {
  prediction: MatchPrediction;
  player1Name: string;
  player2Name: string;
}) {
  const { scorelineDistribution: sd } = prediction;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-bold text-gray-900">Win Probability</h3>

      <WinProbBar
        player1Name={player1Name}
        player2Name={player2Name}
        player1Prob={prediction.player1WinProbability}
        player2Prob={prediction.player2WinProbability}
      />

      {/* Scoreline chips */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Most likely scorelines</p>
        <div className="flex gap-2 flex-wrap">
          {(["2-0", "2-1", "1-2", "0-2"] as const).map((score) => (
            <div
              key={score}
              className="flex flex-col items-center bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"
            >
              <span className="text-sm font-bold text-gray-800">{score}</span>
              <span className="text-xs text-gray-400">{sd[score]}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Model vs market */}
      <div className="flex gap-4 pt-1 border-t border-gray-50">
        <div>
          <p className="text-xs text-gray-400">Model</p>
          <p className="text-sm font-semibold text-gray-700">
            {prediction.modelProbability1}% / {100 - prediction.modelProbability1}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Market consensus</p>
          <p className="text-sm font-semibold text-gray-700">
            {prediction.marketImpliedProb1}% / {100 - prediction.marketImpliedProb1}%
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Market Odds Card ─────────────────────────────────────────────────────────

export function MarketOddsCard({
  prediction,
  player1Name,
  player2Name,
}: {
  prediction: MatchPrediction;
  player1Name: string;
  player2Name: string;
}) {
  if (prediction.marketOdds.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
      <h3 className="text-sm font-bold text-gray-900">Market Odds</h3>

      <div className="grid grid-cols-3 text-xs text-gray-400 font-medium border-b border-gray-50 pb-1.5">
        <span>Bookmaker</span>
        <span className="text-center">{player1Name.split(" ").pop()}</span>
        <span className="text-center">{player2Name.split(" ").pop()}</span>
      </div>

      {prediction.marketOdds.map((odds, i) => (
        <div key={i} className="grid grid-cols-3 text-sm items-center">
          <span className="text-gray-500 text-xs">{odds.bookmaker}</span>
          <div className="text-center">
            <span className="font-semibold text-gray-800">{odds.player1Odds.toFixed(2)}</span>
            <span className="text-xs text-gray-400 ml-1">({odds.impliedProb1}%)</span>
          </div>
          <div className="text-center">
            <span className="font-semibold text-gray-800">{odds.player2Odds.toFixed(2)}</span>
            <span className="text-xs text-gray-400 ml-1">({odds.impliedProb2}%)</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Surface Elo Card ─────────────────────────────────────────────────────────

export function SurfaceEloCard({
  prediction,
  player1Name,
  player2Name,
}: {
  prediction: MatchPrediction;
  player1Name: string;
  player2Name: string;
}) {
  const p1Advantage = prediction.player1SurfaceElo > prediction.player2SurfaceElo;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
      <h3 className="text-sm font-bold text-gray-900">
        Surface Elo — {surfaceLabels[prediction.surface]}
      </h3>

      <div className="flex items-center gap-3">
        <div className={cn("flex-1 text-center p-3 rounded-lg", p1Advantage ? "bg-green-50" : "bg-gray-50")}>
          <p className="text-xs text-gray-400 mb-1 truncate">{player1Name}</p>
          <p className={cn("text-2xl font-bold", p1Advantage ? "text-green-700" : "text-gray-600")}>
            {prediction.player1SurfaceElo}
          </p>
        </div>

        <span className="text-gray-300 font-light text-lg">vs</span>

        <div className={cn("flex-1 text-center p-3 rounded-lg", !p1Advantage ? "bg-green-50" : "bg-gray-50")}>
          <p className="text-xs text-gray-400 mb-1 truncate">{player2Name}</p>
          <p className={cn("text-2xl font-bold", !p1Advantage ? "text-green-700" : "text-gray-600")}>
            {prediction.player2SurfaceElo}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        {p1Advantage ? player1Name : player2Name} has the {surfaceLabels[prediction.surface].toLowerCase()} advantage
        (+{Math.abs(prediction.player1SurfaceElo - prediction.player2SurfaceElo)} Elo pts)
      </p>
    </div>
  );
}

// ─── Fatigue Card ─────────────────────────────────────────────────────────────

export function FatigueCard({
  prediction,
  player1Name,
  player2Name,
}: {
  prediction: MatchPrediction;
  player1Name: string;
  player2Name: string;
}) {
  const f1 = prediction.player1Fatigue;
  const f2 = prediction.player2Fatigue;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-bold text-gray-900">Fatigue Index</h3>

      <div className="grid grid-cols-2 gap-4">
        <FatiguePlayer name={player1Name} fatigue={f1} />
        <FatiguePlayer name={player2Name} fatigue={f2} />
      </div>

      <p className="text-xs text-gray-400">
        High fatigue (6+ matches in 7 days) reduces a player's predicted win probability by up to 8 points.
      </p>
    </div>
  );
}

function FatiguePlayer({
  name,
  fatigue,
}: {
  name: string;
  fatigue: MatchPrediction["player1Fatigue"];
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gray-400 truncate">{name}</p>

      {/* Bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-2 rounded-full",
            fatigue.level === "low"
              ? "bg-green-400"
              : fatigue.level === "moderate"
              ? "bg-yellow-400"
              : "bg-red-400"
          )}
          style={{ width: `${Math.round(fatigue.score * 100)}%` }}
        />
      </div>

      <div className="flex justify-between text-xs">
        <span className={fatigueColors[fatigue.level] + " font-semibold capitalize"}>
          {fatigue.level}
        </span>
        <span className="text-gray-400">
          {fatigue.matchesLast7Days}m / 7d
        </span>
      </div>
    </div>
  );
}

// ─── H2H Card ─────────────────────────────────────────────────────────────────

export function H2HCard({
  h2h,
  player1Name,
  player2Name,
}: {
  h2h: H2HRecord;
  player1Name: string;
  player2Name: string;
}) {
  const total = h2h.player1Wins + h2h.player2Wins || 1;
  const w1 = Math.round((h2h.player1Wins / total) * 100);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-bold text-gray-900">Head to Head</h3>

      <div className="flex items-center gap-3 text-center">
        <div className="flex-1">
          <p className="text-3xl font-bold text-gray-900">{h2h.player1Wins}</p>
          <p className="text-xs text-gray-400 truncate">{player1Name}</p>
        </div>
        <div className="text-xs text-gray-400">{h2h.totalMatches} matches</div>
        <div className="flex-1">
          <p className="text-3xl font-bold text-gray-300">{h2h.player2Wins}</p>
          <p className="text-xs text-gray-400 truncate">{player2Name}</p>
        </div>
      </div>

      {/* Visual bar */}
      <div className="flex h-2 rounded-full overflow-hidden">
        <div className="bg-green-500" style={{ width: `${w1}%` }} />
        <div className="bg-gray-200" style={{ width: `${100 - w1}%` }} />
      </div>

      {h2h.lastMeeting && (
        <div className="text-xs text-gray-400 pt-1 border-t border-gray-50">
          Last meeting: {h2h.lastMeeting.tournament} on {h2h.lastMeeting.surface} —{" "}
          <span className="font-medium text-gray-600">
            {h2h.lastMeeting.winner === "player1" ? player1Name : player2Name} won {h2h.lastMeeting.score}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Key Stats Card ───────────────────────────────────────────────────────────

export function KeyStatsCard({
  player1Stats,
  player2Stats,
  player1Name,
  player2Name,
}: {
  player1Stats: PlayerStats;
  player2Stats: PlayerStats;
  player1Name: string;
  player2Name: string;
}) {
  const stats = [
    {
      label: "1st Serve %",
      v1: player1Stats.serveStats.firstServePercentage,
      v2: player2Stats.serveStats.firstServePercentage,
    },
    {
      label: "1st Serve Points Won",
      v1: player1Stats.serveStats.firstServePointsWon,
      v2: player2Stats.serveStats.firstServePointsWon,
    },
    {
      label: "Return Points Won",
      v1: player1Stats.serveStats.returnPointsWon,
      v2: player2Stats.serveStats.returnPointsWon,
    },
    {
      label: "Winners / Match",
      v1: player1Stats.serveStats.winnersPerMatch,
      v2: player2Stats.serveStats.winnersPerMatch,
      suffix: "",
    },
    {
      label: "Errors / Match",
      v1: player1Stats.serveStats.unforcedErrorsPerMatch,
      v2: player2Stats.serveStats.unforcedErrorsPerMatch,
      suffix: "",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex justify-between text-xs text-gray-400 font-medium">
        <span className="text-green-700 font-semibold">{player1Name}</span>
        <span>Key Stats</span>
        <span>{player2Name}</span>
      </div>

      <div className="space-y-3">
        {stats.map((s) => (
          <StatBar
            key={s.label}
            label={s.label}
            value1={s.v1}
            value2={s.v2}
            suffix={s.suffix ?? "%"}
          />
        ))}
      </div>
    </div>
  );
}
