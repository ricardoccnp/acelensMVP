/**
 * Surface-Adjusted Elo Engine
 *
 * Each active player maintains three separate Elo ratings: clay, hard, grass.
 * ATP and WTA are in entirely separate pools.
 *
 * K-factor: 32
 * Starting rating: 1500
 */

import type { Circuit, Surface, EloRating } from "@/types";
import { cacheGet, cacheSet, CacheKeys } from "@/lib/cache/kv";

const K_FACTOR = 32;
const DEFAULT_ELO = 1500;

// ─── Core Elo formula ─────────────────────────────────────────────────────────

/**
 * Expected win probability for player A given their Elo ratings.
 * Returns a value 0–1.
 */
export function eloExpected(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new Elo rating after a match result.
 * score: 1 = win, 0 = loss
 */
export function eloUpdate(
  currentRating: number,
  expected: number,
  score: 0 | 1
): number {
  return Math.round(currentRating + K_FACTOR * (score - expected));
}

// ─── Rating storage ───────────────────────────────────────────────────────────

/**
 * Get the Elo rating for a player. Initialises to default if not found.
 */
export async function getPlayerElo(
  playerId: string,
  circuit: Circuit
): Promise<EloRating> {
  const key = CacheKeys.playerElo(playerId, circuit);
  const cached = await cacheGet<EloRating>(key);

  if (cached) return cached;

  // Initialise with default ratings
  const initial: EloRating = {
    playerId,
    circuit,
    clay: DEFAULT_ELO,
    hard: DEFAULT_ELO,
    grass: DEFAULT_ELO,
    updatedAt: new Date().toISOString(),
  };

  await cacheSet(key, initial, null); // permanent
  return initial;
}

/**
 * Update Elo ratings for both players after a match result.
 * winnerId: the ID of the player who won.
 */
export async function recordMatchResult(
  winnerId: string,
  loserId: string,
  surface: Surface,
  circuit: Circuit
): Promise<void> {
  const [winnerElo, loserElo] = await Promise.all([
    getPlayerElo(winnerId, circuit),
    getPlayerElo(loserId, circuit),
  ]);

  const winnerRating = winnerElo[surface === "carpet" ? "hard" : surface];
  const loserRating = loserElo[surface === "carpet" ? "hard" : surface];

  const expectedWinner = eloExpected(winnerRating, loserRating);
  const expectedLoser = 1 - expectedWinner;

  const newWinnerRating = eloUpdate(winnerRating, expectedWinner, 1);
  const newLoserRating = eloUpdate(loserRating, expectedLoser, 0);

  const now = new Date().toISOString();
  const surfaceKey = surface === "carpet" ? "hard" : surface;

  const updatedWinner: EloRating = {
    ...winnerElo,
    [surfaceKey]: newWinnerRating,
    updatedAt: now,
  };

  const updatedLoser: EloRating = {
    ...loserElo,
    [surfaceKey]: newLoserRating,
    updatedAt: now,
  };

  await Promise.all([
    cacheSet(CacheKeys.playerElo(winnerId, circuit), updatedWinner, null),
    cacheSet(CacheKeys.playerElo(loserId, circuit), updatedLoser, null),
  ]);
}

/**
 * Get the surface-specific Elo rating for a player.
 */
export async function getSurfaceElo(
  playerId: string,
  surface: Surface,
  circuit: Circuit
): Promise<number> {
  const elo = await getPlayerElo(playerId, circuit);
  const key = surface === "carpet" ? "hard" : surface;
  return elo[key];
}
