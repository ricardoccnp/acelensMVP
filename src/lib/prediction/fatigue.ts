/**
 * Fatigue Calculator
 *
 * Counts matches played in last 7 days (weight 0.6) and last 14 days (weight 0.4).
 * Normalises to a 0–1 fatigue score.
 * Applied as a downward Elo modifier: −3 to −8 percentage points on win probability.
 */

import type { FatigueData, FatigueLevel, Match } from "@/types";
import { cacheGet, cacheSet, CacheKeys, TTL } from "@/lib/cache/kv";

const WEIGHT_7D = 0.6;
const WEIGHT_14D = 0.4;

// Max realistic matches in 7 / 14 days (normalisation ceiling)
const MAX_7D = 7;
const MAX_14D = 12;

// ─── Score calculation ────────────────────────────────────────────────────────

/**
 * Calculate fatigue score from match counts.
 * Returns a normalised score 0–1 and a level label.
 */
export function calculateFatigueScore(
  matchesLast7Days: number,
  matchesLast14Days: number
): { score: number; level: FatigueLevel } {
  const norm7 = Math.min(matchesLast7Days / MAX_7D, 1);
  const norm14 = Math.min(matchesLast14Days / MAX_14D, 1);
  const score = WEIGHT_7D * norm7 + WEIGHT_14D * norm14;

  const level: FatigueLevel =
    score < 0.3 ? "low" : score < 0.6 ? "moderate" : "high";

  return { score: Math.round(score * 100) / 100, level };
}

/**
 * Apply fatigue modifier to a raw win probability.
 * Returns adjusted probability (0–100).
 *
 * Logic: a fatigued player loses a fraction of their probability advantage.
 * The shift is proportional to the absolute fatigue score differential.
 */
export function applyFatigueModifier(
  baseProb1: number,  // raw probability for player 1 (0–100)
  fatigue1: FatigueData,
  fatigue2: FatigueData
): number {
  // Difference in fatigue — positive means player 1 is more fatigued
  const delta = fatigue1.score - fatigue2.score;

  // Max adjustment is ±8 percentage points
  const MAX_SHIFT = 8;
  const shift = delta * MAX_SHIFT;

  return Math.max(5, Math.min(95, baseProb1 - shift));
}

// ─── Fatigue from match history ───────────────────────────────────────────────

/**
 * Calculate fatigue for a player from their recent match history.
 */
export function fatigueFromMatches(
  playerId: string,
  completedMatches: Match[]
): FatigueData {
  const now = new Date();
  const ago7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ago14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  let matchesLast7Days = 0;
  let matchesLast14Days = 0;

  for (const match of completedMatches) {
    if (match.status !== "completed") continue;
    if (!match.scheduledTime) continue;

    const involved =
      match.player1.player.id === playerId ||
      match.player2.player.id === playerId;

    if (!involved) continue;

    const matchDate = new Date(match.scheduledTime);
    if (matchDate >= ago7) matchesLast7Days++;
    if (matchDate >= ago14) matchesLast14Days++;
  }

  const { score, level } = calculateFatigueScore(
    matchesLast7Days,
    matchesLast14Days
  );

  return {
    playerId,
    matchesLast7Days,
    matchesLast14Days,
    score,
    level,
    updatedAt: now.toISOString(),
  };
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

export async function getPlayerFatigue(
  playerId: string
): Promise<FatigueData | null> {
  return await cacheGet<FatigueData>(CacheKeys.playerFatigue(playerId));
}

export async function savePlayerFatigue(fatigue: FatigueData): Promise<void> {
  await cacheSet(
    CacheKeys.playerFatigue(fatigue.playerId),
    fatigue,
    TTL.FATIGUE
  );
}
