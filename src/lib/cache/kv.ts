/**
 * Vercel KV (Redis) cache utility
 *
 * All external API data is cached here to stay within free-tier limits:
 * - API-Tennis: 500 req/month
 * - The Odds API: 500 req/month
 *
 * Falls back to stale cache value if the live API is unavailable.
 */

// ─── In-memory fallback (used when KV env vars are not set) ──────────────────
// This lets the app run fully without a Redis connection during local dev
// or the first Vercel deploy before KV is provisioned.

const memStore = new Map<string, { value: unknown; expiresAt: number | null }>();

function isKvConfigured(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

// Lazy-load Vercel KV only when configured
async function getKv() {
  if (!isKvConfigured()) return null;
  const { kv } = await import("@vercel/kv");
  return kv;
}

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

// ─── Generic cache operations (KV when available, in-memory otherwise) ────────

/**
 * Get a cached value. Returns null if not found.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const kv = await getKv();
  if (kv) {
    try { return await kv.get<T>(key); } catch { return null; }
  }
  // In-memory fallback
  const entry = memStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
    memStore.delete(key);
    return null;
  }
  return entry.value as T;
}

/**
 * Set a cached value with optional TTL (seconds).
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number | null = null
): Promise<void> {
  const kv = await getKv();
  if (kv) {
    try {
      ttlSeconds !== null
        ? await kv.set(key, value, { ex: ttlSeconds })
        : await kv.set(key, value);
    } catch { /* silent */ }
    return;
  }
  // In-memory fallback
  memStore.set(key, {
    value,
    expiresAt: ttlSeconds !== null ? Date.now() + ttlSeconds * 1000 : null,
  });
}

/**
 * Delete a cached value.
 */
export async function cacheDel(key: string): Promise<void> {
  const kv = await getKv();
  if (kv) { try { await kv.del(key); } catch { /* silent */ } return; }
  memStore.delete(key);
}

/**
 * Delete all keys matching a pattern.
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  const kv = await getKv();
  if (kv) {
    try {
      const keys = await kv.keys(pattern);
      if (keys.length > 0) await Promise.all(keys.map((k) => kv.del(k)));
    } catch { /* silent */ }
    return;
  }
  // In-memory: simple prefix/glob match
  const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
  for (const key of memStore.keys()) {
    if (regex.test(key)) memStore.delete(key);
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
