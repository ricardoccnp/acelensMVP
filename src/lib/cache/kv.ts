/**
 * Vercel KV (Redis) cache utility
 *
 * All external API data is cached here to stay within free-tier limits:
 * - API-Tennis: 500 req/month
 * - The Odds API: 500 req/month
 *
 * Falls back to stale cache value if the live API is unavailable.
 */

import { kv } from "@vercel/kv";

// ─── TTL constants (seconds) ─────────────────────────────────────────────────

export const TTL = {
  TOURNAMENTS: 6 * 60 * 60,       // 6 hours
  SCHEDULE: 60 * 60,              // 1 hour
  LIVE_SCORE: 5 * 60,             // 5 minutes
  ODDS: 30 * 60,                  // 30 minutes
  ELO: null,                      // permanent (only updated post-match)
  FATIGUE: 60 * 60,               // 1 hour
  PREVIEW: null,                  // until daily cron clears at midnight
  PLAYER_STATS: 24 * 60 * 60,     // 24 hours
  H2H: 24 * 60 * 60,              // 24 hours
} as const;

// ─── Cache key helpers ────────────────────────────────────────────────────────

export const CacheKeys = {
  tournaments: (circuit: string) => `tournaments:${circuit.toLowerCase()}`,
  tournament: (id: string) => `tournament:${id}`,
  tournamentSchedule: (id: string) => `tournament:${id}:schedule`,
  tournamentDraw: (id: string) => `tournament:${id}:draw`,
  match: (id: string) => `match:${id}`,
  matchStats: (id: string) => `match:${id}:stats`,
  matchOdds: (id: string) => `match:${id}:odds`,
  matchPreview: (id: string) => `match:${id}:preview`,
  matchPrediction: (id: string) => `match:${id}:prediction`,
  playerElo: (playerId: string, circuit: string) =>
    `elo:${circuit.toLowerCase()}:${playerId}`,
  playerFatigue: (playerId: string) => `fatigue:${playerId}`,
  playerStats: (playerId: string, season: number) =>
    `stats:${playerId}:${season}`,
  h2h: (p1Id: string, p2Id: string) =>
    `h2h:${[p1Id, p2Id].sort().join(":")}`,
};

// ─── Generic get with fallback ────────────────────────────────────────────────

/**
 * Get a cached value. Returns null if not found.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    return await kv.get<T>(key);
  } catch {
    console.error(`[KV] get failed for key: ${key}`);
    return null;
  }
}

/**
 * Set a cached value with optional TTL (seconds).
 * Pass null TTL for permanent storage (updated explicitly).
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number | null = null
): Promise<void> {
  try {
    if (ttlSeconds !== null) {
      await kv.set(key, value, { ex: ttlSeconds });
    } else {
      await kv.set(key, value);
    }
  } catch {
    console.error(`[KV] set failed for key: ${key}`);
  }
}

/**
 * Delete a cached value.
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    await kv.del(key);
  } catch {
    console.error(`[KV] del failed for key: ${key}`);
  }
}

/**
 * Delete all keys matching a pattern (uses KEYS — use sparingly).
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const keys = await kv.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map((k) => kv.del(k)));
    }
  } catch {
    console.error(`[KV] delPattern failed for pattern: ${pattern}`);
  }
}

/**
 * Fetch-or-set pattern:
 * Returns cached value if present, otherwise calls fetcher(), caches result,
 * and returns it.
 *
 * On fetcher failure, returns stale cache value if available.
 */
export async function cacheGetOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number | null = null
): Promise<T | null> {
  // Check cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  // Fetch fresh data
  try {
    const fresh = await fetcher();
    await cacheSet(key, fresh, ttlSeconds);
    return fresh;
  } catch (err) {
    console.error(`[KV] fetcher failed for key ${key}:`, err);
    return null;
  }
}
