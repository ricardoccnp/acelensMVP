/**
 * The Odds API client
 *
 * Free tier: 500 requests / month
 * Only fetched for matches in the next 48 hours — cached 30 minutes.
 *
 * Docs: https://the-odds-api.com/liveodds-api/
 */

import type { MarketOdds } from "@/types";

const BASE_URL = "https://api.the-odds-api.com/v4";
const API_KEY = process.env.ODDS_API_KEY ?? "";

// The sport keys for tennis on The Odds API
const SPORT_KEYS = {
  ATP: "tennis_atp",
  WTA: "tennis_wta",
} as const;

// Target bookmakers — maps to The Odds API bookmaker IDs
const TARGET_BOOKMAKERS = ["bet365", "betfair_ex_eu", "williamhill", "unibet"];
const TARGET_BOOKMAKER_LABELS: Record<string, string> = {
  bet365: "Bet365",
  betfair_ex_eu: "Betfair",
  williamhill: "William Hill",
  unibet: "Unibet",
};

interface RawOddsEvent {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    markets: {
      key: string;
      outcomes: {
        name: string;
        price: number;
      }[];
    }[];
  }[];
}

/**
 * Fetch match odds from The Odds API for upcoming matches.
 * Returns a map of matchKey → MarketOdds[].
 *
 * matchKey is "{player1Name}:{player2Name}" normalised to lower case.
 */
export async function fetchMatchOdds(
  circuit: "ATP" | "WTA"
): Promise<Map<string, MarketOdds[]>> {
  const sportKey = SPORT_KEYS[circuit];
  const url = new URL(`${BASE_URL}/sports/${sportKey}/odds`);
  url.searchParams.set("apiKey", API_KEY);
  url.searchParams.set("regions", "eu");
  url.searchParams.set("markets", "h2h");
  url.searchParams.set("bookmakers", TARGET_BOOKMAKERS.join(","));
  url.searchParams.set("dateFormat", "iso");
  url.searchParams.set("oddsFormat", "decimal");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Odds API error ${res.status}`);
  }

  const events: RawOddsEvent[] = await res.json();
  const result = new Map<string, MarketOdds[]>();

  for (const event of events) {
    const matchKey = `${normalise(event.home_team)}:${normalise(event.away_team)}`;
    const odds: MarketOdds[] = [];

    for (const bookmaker of event.bookmakers) {
      if (!TARGET_BOOKMAKERS.includes(bookmaker.key)) continue;
      const h2h = bookmaker.markets.find((m) => m.key === "h2h");
      if (!h2h) continue;

      const home = h2h.outcomes.find((o) => o.name === event.home_team);
      const away = h2h.outcomes.find((o) => o.name === event.away_team);
      if (!home || !away) continue;

      const p1Odds = home.price;
      const p2Odds = away.price;
      // Remove vig by normalising implied probabilities
      const rawProb1 = 1 / p1Odds;
      const rawProb2 = 1 / p2Odds;
      const total = rawProb1 + rawProb2;

      odds.push({
        bookmaker: TARGET_BOOKMAKER_LABELS[bookmaker.key] ?? bookmaker.title,
        player1Odds: p1Odds,
        player2Odds: p2Odds,
        impliedProb1: Math.round((rawProb1 / total) * 100),
        impliedProb2: Math.round((rawProb2 / total) * 100),
      });
    }

    if (odds.length > 0) {
      result.set(matchKey, odds);
    }
  }

  return result;
}

/**
 * Get the average market implied probability for player 1 across bookmakers.
 * Returns 50 if no odds are available.
 */
export function averageMarketProb(odds: MarketOdds[]): number {
  if (odds.length === 0) return 50;
  const sum = odds.reduce((acc, o) => acc + o.impliedProb1, 0);
  return Math.round(sum / odds.length);
}

function normalise(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}
