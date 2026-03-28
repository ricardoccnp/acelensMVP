/**
 * AI Match Preview — claude-sonnet-4-6 with prompt caching
 *
 * Cost model:
 * - Cached prefix (system prompt): ~90% discount on repeat calls
 * - Dynamic suffix (match data): standard pricing
 * - Per-match cost: ~$0.004 uncached, ~$0.0006 after first call
 * - Full 128-draw Masters: < $0.60 total
 *
 * Generation:
 * - Lazy — triggered on first user visit to a match page
 * - Cached in Vercel KV until midnight UTC daily cron
 * - All users sharing the same match share the same cached preview
 */

import Anthropic from "@anthropic-ai/sdk";
import type { MatchDetail, MatchPreview } from "@/types";
import { cacheGet, cacheSet, CacheKeys } from "@/lib/cache/kv";
import { formatProb } from "@/lib/utils";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";

// ─── Static system prompt (cached prefix) ─────────────────────────────────────
// This is identical across all match previews — Anthropic caches it server-side
// giving ~90% token discount on repeat calls.

const SYSTEM_PROMPT = `You are AceLens, a tennis analysis assistant that writes match previews for casual fans.

Your tone is a knowledgeable friend explaining a match — conversational, clear, and direct. You are NOT a sports journalist.

Rules:
- Write exactly 3–4 sentences. No more, no less.
- No jargon. Explain any stat you reference in plain language.
- Name the favourite clearly in the first sentence.
- Focus on 1–2 decisive factors: surface dominance, fatigue, recent form, or head-to-head momentum.
- End with one sentence hinting at what could upset the prediction.
- Do not use phrases like "it's worth noting", "it's important to note", "interestingly", or any filler phrases.
- Output only the preview text. No headings, no bullet points, no markdown.`;

// ─── Dynamic match context builder ───────────────────────────────────────────

function buildMatchContext(detail: MatchDetail): string {
  const { prediction, h2h, player1Stats, player2Stats } = detail;
  // MatchDetail extends Match — so detail itself is the match
  const match = detail;
  const p1 = match.player1.player;
  const p2 = match.player2.player;
  const pred = prediction!;
  const surface = pred.surface;

  const p1Form = player1Stats?.recentForm?.join("") ?? "N/A";
  const p2Form = player2Stats?.recentForm?.join("") ?? "N/A";

  return `Match: ${p1.name} vs ${p2.name}
Tournament: (upcoming match)
Surface: ${surface}
Round: ${match.round}

Player 1 — ${p1.name}
- World ranking: #${p1.ranking}
- Surface Elo (${surface}): ${pred.player1SurfaceElo}
- Recent form (last 5): ${p1Form}
- Fatigue: ${pred.player1Fatigue.level} (${pred.player1Fatigue.matchesLast7Days} matches last 7 days, ${pred.player1Fatigue.matchesLast14Days} last 14 days)
- Win rate on ${surface}: ${player1Stats?.surfaceWinRate[surface === "carpet" ? "hard" : surface] ?? "N/A"}%

Player 2 — ${p2.name}
- World ranking: #${p2.ranking}
- Surface Elo (${surface}): ${pred.player2SurfaceElo}
- Recent form (last 5): ${p2Form}
- Fatigue: ${pred.player2Fatigue.level} (${pred.player2Fatigue.matchesLast7Days} matches last 7 days, ${pred.player2Fatigue.matchesLast14Days} last 14 days)
- Win rate on ${surface}: ${player2Stats?.surfaceWinRate[surface === "carpet" ? "hard" : surface] ?? "N/A"}%

Head to head: ${h2h.player1Wins}–${h2h.player2Wins} total matches in favour of ${h2h.player1Wins >= h2h.player2Wins ? p1.name : p2.name}
${h2h.lastMeeting ? `Last meeting: ${h2h.lastMeeting.tournament} on ${h2h.lastMeeting.surface} — won by ${h2h.lastMeeting.winner === "player1" ? p1.name : p2.name} (${h2h.lastMeeting.score})` : "No previous meetings"}

Model prediction: ${p1.name} ${formatProb(pred.player1WinProbability)} | ${p2.name} ${formatProb(pred.player2WinProbability)}
Market consensus: ${p1.name} ${formatProb(pred.marketImpliedProb1)} (from bookmakers)`;
}

// ─── Generation ───────────────────────────────────────────────────────────────

/**
 * Generate and cache a match preview.
 * Uses Anthropic's prompt caching on the system prompt (static prefix).
 */
export async function generatePreview(detail: MatchDetail): Promise<MatchPreview> {
  const userContent = buildMatchContext(detail);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        // Enable prompt caching on the static system prompt
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: userContent,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const preview: MatchPreview = {
    matchId: detail.id,
    text: text.trim(),
    generatedAt: new Date().toISOString(),
    cachedAt: new Date().toISOString(),
    model: MODEL,
    inputTokens: response.usage?.input_tokens,
    outputTokens: response.usage?.output_tokens,
  };

  return preview;
}

// ─── Get or generate (lazy, with KV cache) ────────────────────────────────────

/**
 * Returns a cached preview if available, otherwise generates one.
 * Stores the result in KV with no TTL (daily cron handles refresh).
 */
export async function getOrGeneratePreview(
  detail: MatchDetail
): Promise<MatchPreview | null> {
  const key = CacheKeys.matchPreview(detail.id);

  // Check cache first
  const cached = await cacheGet<MatchPreview>(key);
  if (cached) return cached;

  // Guard: only generate for upcoming matches
  if (detail.status !== "upcoming") return null;
  if (!detail.prediction) return null;

  try {
    const preview = await generatePreview(detail);
    await cacheSet(key, preview, null); // permanent — cron clears at midnight
    return preview;
  } catch (err) {
    console.error(`[AI] Preview generation failed for match ${detail.id}:`, err);
    return null;
  }
}
