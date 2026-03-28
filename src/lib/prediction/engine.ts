/**
 * AceLens Prediction Engine
 *
 * Steps:
 * 1. Surface-Adjusted Elo → base win probability
 * 2. Fatigue modifier → adjusted probability
 * 3. Market calibration (60% model, 40% market implied)
 * 4. Scoreline distribution (arithmetic, no AI)
 */

import type {
  Match,
  MatchPrediction,
  Surface,
  Circuit,
  MarketOdds,
  ScorelineDistribution,
  FatigueData,
  PlayerStats,
} from "@/types";
import { eloExpected, getSurfaceElo, getPlayerElo } from "./elo";
import { applyFatigueModifier } from "./fatigue";
import { clamp } from "@/lib/utils";

// ─── Market calibration weights ───────────────────────────────────────────────

const MODEL_WEIGHT = 0.6;
const MARKET_WEIGHT = 0.4;

// ─── Scoreline distribution ───────────────────────────────────────────────────

/**
 * Estimate scoreline probabilities for a best-of-3 match.
 *
 * Uses each player's set-win rate on the surface (derived from surface win %).
 * A rough but transparent arithmetic model — no AI.
 */
function scoreline(
  p1SetWinRate: number,  // 0–1
  p2SetWinRate: number
): ScorelineDistribution {
  // Normalise so p1 + p2 = 1 within set context
  const total = p1SetWinRate + p2SetWinRate;
  const p1 = p1SetWinRate / total;
  const p2 = 1 - p1;

  // 2–0: p1 wins both sets
  const p20 = p1 * p1;
  // 2–1: p1 wins 2nd and 3rd set (after losing 1st)
  const p21 = p2 * p1 * p1;
  // 1–2: p2 wins 2nd and 3rd set
  const p12 = p1 * p2 * p2;
  // 0–2: p2 wins both sets
  const p02 = p2 * p2;

  const sum = p20 + p21 + p12 + p02;

  return {
    "2-0": Math.round((p20 / sum) * 100),
    "2-1": Math.round((p21 / sum) * 100),
    "1-2": Math.round((p12 / sum) * 100),
    "0-2": Math.round((p02 / sum) * 100),
  };
}

// ─── Main prediction function ─────────────────────────────────────────────────

export interface PredictionInput {
  match: Match;
  surface: Surface;
  circuit: Circuit;
  player1Fatigue: FatigueData;
  player2Fatigue: FatigueData;
  player1Stats: PlayerStats | null;
  player2Stats: PlayerStats | null;
  marketOdds: MarketOdds[];
}

export async function calculatePrediction(
  input: PredictionInput
): Promise<MatchPrediction> {
  const { match, surface, circuit, player1Fatigue, player2Fatigue, player1Stats, player2Stats, marketOdds } = input;

  const p1Id = match.player1.player.id;
  const p2Id = match.player2.player.id;

  // ── Step 1: Surface Elo ────────────────────────────────────────────────────
  const [p1SurfaceElo, p2SurfaceElo] = await Promise.all([
    getSurfaceElo(p1Id, surface, circuit),
    getSurfaceElo(p2Id, surface, circuit),
  ]);

  const baseProb1 = eloExpected(p1SurfaceElo, p2SurfaceElo) * 100;

  // ── Step 2: Fatigue modifier ───────────────────────────────────────────────
  const fatigueAdjustedProb1 = applyFatigueModifier(
    baseProb1,
    player1Fatigue,
    player2Fatigue
  );

  // ── Step 3: Market calibration ─────────────────────────────────────────────
  let marketProb1 = 50; // fallback if no odds
  if (marketOdds.length > 0) {
    const sum = marketOdds.reduce((acc, o) => acc + o.impliedProb1, 0);
    marketProb1 = sum / marketOdds.length;
  }

  const blendedProb1 = clamp(
    MODEL_WEIGHT * fatigueAdjustedProb1 + MARKET_WEIGHT * marketProb1,
    5,
    95
  );

  const finalProb1 = Math.round(blendedProb1);
  const finalProb2 = 100 - finalProb1;

  // ── Step 4: Scoreline distribution ────────────────────────────────────────
  const surfaceKey = surface === "carpet" ? "hard" : surface;
  const p1SetWinRate = player1Stats?.surfaceWinRate[surfaceKey] ?? 50;
  const p2SetWinRate = player2Stats?.surfaceWinRate[surfaceKey] ?? 50;
  const scores = scoreline(p1SetWinRate / 100, p2SetWinRate / 100);

  return {
    matchId: match.id,
    player1WinProbability: finalProb1,
    player2WinProbability: finalProb2,
    modelProbability1: Math.round(fatigueAdjustedProb1),
    marketImpliedProb1: Math.round(marketProb1),
    scorelineDistribution: scores,
    surface,
    player1SurfaceElo: p1SurfaceElo,
    player2SurfaceElo: p2SurfaceElo,
    player1Fatigue,
    player2Fatigue,
    marketOdds,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Update match objects in a draw with their win probabilities.
 * Used when rendering schedule / draw tabs.
 */
export function attachProbabilities(
  matches: Match[],
  predictions: Map<string, MatchPrediction>
): Match[] {
  return matches.map((match) => {
    const pred = predictions.get(match.id);
    if (!pred) return match;
    return {
      ...match,
      player1: {
        ...match.player1,
        winProbability: pred.player1WinProbability,
      },
      player2: {
        ...match.player2,
        winProbability: pred.player2WinProbability,
      },
      prediction: pred,
    };
  });
}
