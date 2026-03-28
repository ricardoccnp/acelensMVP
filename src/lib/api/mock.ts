/**
 * Mock data layer — realistic 2026 ATP & WTA data
 *
 * Used when RAPIDAPI_KEY is not set (local dev, initial deploy).
 * Swap this out by setting RAPIDAPI_KEY in Vercel env vars.
 *
 * Current tournament: Miami Open 2026 (Hard, Masters 1000 / WTA 1000)
 * Next tournament:    Monte-Carlo Masters (ATP) / Porsche Grand Prix (WTA)
 */

import type {
  Tournament,
  Match,
  Player,
  MatchDetail,
  MatchPrediction,
  H2HRecord,
  PlayerStats,
  FatigueData,
  Circuit,
} from "@/types";
import { countryCodeToFlag } from "@/lib/utils";

// ─── Helper ───────────────────────────────────────────────────────────────────

function player(
  id: string,
  name: string,
  country: string,
  ranking: number,
  circuit: Circuit,
  elo: { clay: number; hard: number; grass: number }
): Player {
  const parts = name.split(" ");
  return {
    id,
    name,
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
    country,
    countryFlag: countryCodeToFlag(country),
    ranking,
    circuit,
    elo,
  };
}

function fatigue(
  playerId: string,
  matches7: number,
  matches14: number
): FatigueData {
  const score = Math.min(matches7 / 7, 1) * 0.6 + Math.min(matches14 / 12, 1) * 0.4;
  return {
    playerId,
    matchesLast7Days: matches7,
    matchesLast14Days: matches14,
    score: Math.round(score * 100) / 100,
    level: score < 0.3 ? "low" : score < 0.6 ? "moderate" : "high",
    updatedAt: new Date().toISOString(),
  };
}

function stats(playerId: string): PlayerStats {
  return {
    playerId,
    season: 2026,
    surfaceWinRate: { clay: 62, hard: 71, grass: 68 },
    surfaceRecord: {
      clay: { wins: 8, losses: 5 },
      hard: { wins: 19, losses: 7 },
      grass: { wins: 5, losses: 2 },
    },
    serveStats: {
      firstServePercentage: 63,
      firstServePointsWon: 76,
      returnPointsWon: 42,
      acesPerMatch: 7,
      unforcedErrorsPerMatch: 22,
      winnersPerMatch: 34,
    },
    recentForm: ["W", "W", "W", "L", "W"],
  };
}

// ─── ATP Players ──────────────────────────────────────────────────────────────

export const ATP_PLAYERS: Record<string, Player> = {
  sinner: player("atp-sinner",   "Jannik Sinner",     "IT", 1, "ATP", { clay: 2180, hard: 2310, grass: 2090 }),
  alcaraz: player("atp-alcaraz", "Carlos Alcaraz",    "ES", 2, "ATP", { clay: 2260, hard: 2240, grass: 2290 }),
  djokovic: player("atp-djoko",  "Novak Djokovic",    "RS", 3, "ATP", { clay: 2180, hard: 2220, grass: 2250 }),
  zverev: player("atp-zverev",   "Alexander Zverev",  "DE", 4, "ATP", { clay: 2070, hard: 2130, grass: 1980 }),
  medvedev: player("atp-medved", "Daniil Medvedev",   "RU", 5, "ATP", { clay: 1930, hard: 2190, grass: 1960 }),
  ruud: player("atp-ruud",       "Casper Ruud",       "NO", 6, "ATP", { clay: 2080, hard: 1970, grass: 1870 }),
  rublev: player("atp-rublev",   "Andrey Rublev",     "RU", 7, "ATP", { clay: 2010, hard: 2030, grass: 1890 }),
  fritz: player("atp-fritz",     "Taylor Fritz",      "US", 8, "ATP", { clay: 1860, hard: 2020, grass: 1950 }),
  paul: player("atp-paul",       "Tommy Paul",        "US", 9, "ATP", { clay: 1820, hard: 1990, grass: 1880 }),
  shelton: player("atp-shelt",   "Ben Shelton",       "US", 10, "ATP", { clay: 1750, hard: 1980, grass: 1870 }),
};

// ─── WTA Players ─────────────────────────────────────────────────────────────

export const WTA_PLAYERS: Record<string, Player> = {
  sabalenka: player("wta-saba",   "Aryna Sabalenka",  "BY", 1, "WTA", { clay: 2090, hard: 2260, grass: 2010 }),
  swiatek: player("wta-swia",     "Iga Swiatek",      "PL", 2, "WTA", { clay: 2310, hard: 2140, grass: 1980 }),
  gauff: player("wta-gauff",      "Coco Gauff",       "US", 3, "WTA", { clay: 2020, hard: 2080, grass: 1980 }),
  rybakina: player("wta-ryba",    "Elena Rybakina",   "KZ", 4, "WTA", { clay: 1960, hard: 2100, grass: 2150 }),
  pegula: player("wta-pegu",      "Jessica Pegula",   "US", 5, "WTA", { clay: 1880, hard: 2030, grass: 1870 }),
  andreeva: player("wta-andr",    "Mirra Andreeva",   "RU", 6, "WTA", { clay: 1950, hard: 1980, grass: 1850 }),
  keys: player("wta-keys",        "Madison Keys",     "US", 7, "WTA", { clay: 1890, hard: 2010, grass: 1860 }),
  paolini: player("wta-paol",     "Jasmine Paolini",  "IT", 8, "WTA", { clay: 2010, hard: 1940, grass: 1960 }),
  navarro: player("wta-nava",     "Emma Navarro",     "US", 9, "WTA", { clay: 1870, hard: 1950, grass: 1890 }),
  vekic: player("wta-veki",       "Donna Vekic",      "HR", 10, "WTA", { clay: 1830, hard: 1960, grass: 1930 }),
};

// ─── Tournaments ─────────────────────────────────────────────────────────────

export const MOCK_TOURNAMENTS: Record<Circuit, { current: Tournament; next: Tournament }> = {
  ATP: {
    current: {
      id: "atp-miami-2026",
      slug: "miami-open-2026",
      name: "Miami Open",
      circuit: "ATP",
      category: "Masters 1000",
      surface: "hard",
      location: "Miami Gardens",
      country: "US",
      startDate: "2026-03-18",
      endDate: "2026-03-30",
      prizeMoney: "$8,995,555",
      status: "in_progress",
      currentRound: "QF",
    },
    next: {
      id: "atp-montecarlo-2026",
      slug: "monte-carlo-masters-2026",
      name: "Monte-Carlo Masters",
      circuit: "ATP",
      category: "Masters 1000",
      surface: "clay",
      location: "Monte Carlo",
      country: "MC",
      startDate: "2026-04-06",
      endDate: "2026-04-13",
      prizeMoney: "$6,117,070",
      status: "upcoming",
    },
  },
  WTA: {
    current: {
      id: "wta-miami-2026",
      slug: "miami-open-wta-2026",
      name: "Miami Open",
      circuit: "WTA",
      category: "WTA 1000",
      surface: "hard",
      location: "Miami Gardens",
      country: "US",
      startDate: "2026-03-18",
      endDate: "2026-03-29",
      prizeMoney: "$8,995,555",
      status: "in_progress",
      currentRound: "QF",
    },
    next: {
      id: "wta-stuttgart-2026",
      slug: "porsche-tennis-grand-prix-2026",
      name: "Porsche Tennis Grand Prix",
      circuit: "WTA",
      category: "WTA 500",
      surface: "clay",
      location: "Stuttgart",
      country: "DE",
      startDate: "2026-04-14",
      endDate: "2026-04-20",
      prizeMoney: "$780,637",
      status: "upcoming",
    },
  },
};

// ─── ATP Miami QF Matches ─────────────────────────────────────────────────────

const atpQF: Match[] = [
  {
    id: "atp-miami-qf-1",
    tournamentId: "atp-miami-2026",
    round: "QF",
    scheduledTime: "2026-03-27T19:00:00Z",
    court: "Stadium Court",
    status: "upcoming",
    player1: { player: ATP_PLAYERS.sinner,   seed: 1,  winProbability: 68 },
    player2: { player: ATP_PLAYERS.medvedev, seed: 4,  winProbability: 32 },
  },
  {
    id: "atp-miami-qf-2",
    tournamentId: "atp-miami-2026",
    round: "QF",
    scheduledTime: "2026-03-27T22:00:00Z",
    court: "Stadium Court",
    status: "upcoming",
    player1: { player: ATP_PLAYERS.alcaraz, seed: 2,  winProbability: 55 },
    player2: { player: ATP_PLAYERS.zverev,  seed: 3,  winProbability: 45 },
  },
  {
    id: "atp-miami-qf-3",
    tournamentId: "atp-miami-2026",
    round: "QF",
    scheduledTime: "2026-03-28T18:00:00Z",
    court: "Grandstand",
    status: "upcoming",
    player1: { player: ATP_PLAYERS.fritz,   seed: 8,  winProbability: 52 },
    player2: { player: ATP_PLAYERS.paul,    seed: 9,  winProbability: 48 },
  },
  {
    id: "atp-miami-qf-4",
    tournamentId: "atp-miami-2026",
    round: "QF",
    scheduledTime: "2026-03-28T21:00:00Z",
    court: "Grandstand",
    status: "upcoming",
    player1: { player: ATP_PLAYERS.ruud,    seed: 6,  winProbability: 59 },
    player2: { player: ATP_PLAYERS.shelton, seed: 10, winProbability: 41 },
  },
];

// Predicted SF/F (with dashed bracket styling)
const atpSF: Match[] = [
  {
    id: "atp-miami-sf-1",
    tournamentId: "atp-miami-2026",
    round: "SF",
    status: "upcoming",
    player1: { player: ATP_PLAYERS.sinner,  seed: 1, winProbability: 62 },
    player2: { player: ATP_PLAYERS.alcaraz, seed: 2, winProbability: 38 },
  },
  {
    id: "atp-miami-sf-2",
    tournamentId: "atp-miami-2026",
    round: "SF",
    status: "upcoming",
    player1: { player: ATP_PLAYERS.fritz, seed: 8, winProbability: 45 },
    player2: { player: ATP_PLAYERS.ruud,  seed: 6, winProbability: 55 },
  },
];

const atpF: Match[] = [
  {
    id: "atp-miami-f-1",
    tournamentId: "atp-miami-2026",
    round: "F",
    status: "upcoming",
    player1: { player: ATP_PLAYERS.sinner, seed: 1, winProbability: 58 },
    player2: { player: ATP_PLAYERS.ruud,   seed: 6, winProbability: 42 },
  },
];

export const ATP_MIAMI_DRAW: Match[] = [...atpQF, ...atpSF, ...atpF];

// ─── WTA Miami QF Matches ─────────────────────────────────────────────────────

const wtaQF: Match[] = [
  {
    id: "wta-miami-qf-1",
    tournamentId: "wta-miami-2026",
    round: "QF",
    scheduledTime: "2026-03-27T17:00:00Z",
    court: "Stadium Court",
    status: "upcoming",
    player1: { player: WTA_PLAYERS.sabalenka, seed: 1, winProbability: 65 },
    player2: { player: WTA_PLAYERS.keys,      seed: 7, winProbability: 35 },
  },
  {
    id: "wta-miami-qf-2",
    tournamentId: "wta-miami-2026",
    round: "QF",
    scheduledTime: "2026-03-27T20:00:00Z",
    court: "Stadium Court",
    status: "upcoming",
    player1: { player: WTA_PLAYERS.swiatek, seed: 2, winProbability: 57 },
    player2: { player: WTA_PLAYERS.gauff,   seed: 3, winProbability: 43 },
  },
  {
    id: "wta-miami-qf-3",
    tournamentId: "wta-miami-2026",
    round: "QF",
    scheduledTime: "2026-03-28T17:00:00Z",
    court: "Grandstand",
    status: "upcoming",
    player1: { player: WTA_PLAYERS.rybakina,  seed: 4, winProbability: 54 },
    player2: { player: WTA_PLAYERS.andreeva,  seed: 6, winProbability: 46 },
  },
  {
    id: "wta-miami-qf-4",
    tournamentId: "wta-miami-2026",
    round: "QF",
    scheduledTime: "2026-03-28T20:00:00Z",
    court: "Grandstand",
    status: "upcoming",
    player1: { player: WTA_PLAYERS.pegula,  seed: 5, winProbability: 55 },
    player2: { player: WTA_PLAYERS.navarro, seed: 9, winProbability: 45 },
  },
];

const wtaSF: Match[] = [
  {
    id: "wta-miami-sf-1",
    tournamentId: "wta-miami-2026",
    round: "SF",
    status: "upcoming",
    player1: { player: WTA_PLAYERS.sabalenka, seed: 1, winProbability: 60 },
    player2: { player: WTA_PLAYERS.swiatek,   seed: 2, winProbability: 40 },
  },
  {
    id: "wta-miami-sf-2",
    tournamentId: "wta-miami-2026",
    round: "SF",
    status: "upcoming",
    player1: { player: WTA_PLAYERS.rybakina, seed: 4, winProbability: 52 },
    player2: { player: WTA_PLAYERS.pegula,   seed: 5, winProbability: 48 },
  },
];

const wtaF: Match[] = [
  {
    id: "wta-miami-f-1",
    tournamentId: "wta-miami-2026",
    round: "F",
    status: "upcoming",
    player1: { player: WTA_PLAYERS.sabalenka, seed: 1, winProbability: 56 },
    player2: { player: WTA_PLAYERS.rybakina,  seed: 4, winProbability: 44 },
  },
];

export const WTA_MIAMI_DRAW: Match[] = [...wtaQF, ...wtaSF, ...wtaF];

// ─── Full schedule (QF only for brevity — easily extensible) ─────────────────

export const ATP_MIAMI_SCHEDULE: Match[] = [...atpQF];
export const WTA_MIAMI_SCHEDULE: Match[] = [...wtaQF];

// ─── Match details (full data for match page) ─────────────────────────────────

function makeH2H(p1Wins: number, p2Wins: number, surface: "hard" | "clay" | "grass", p1Name: string, p2Name: string, score: string): H2HRecord {
  return {
    player1Wins: p1Wins,
    player2Wins: p2Wins,
    totalMatches: p1Wins + p2Wins,
    lastMeeting: {
      date: "2025-11-08",
      tournament: "ATP Finals",
      surface,
      winner: p1Wins >= p2Wins ? "player1" : "player2",
      score,
    },
  };
}

function makePrediction(matchId: string, p1: Player, p2: Player, p1Prob: number): MatchPrediction {
  const p2Prob = 100 - p1Prob;
  return {
    matchId,
    player1WinProbability: p1Prob,
    player2WinProbability: p2Prob,
    modelProbability1: p1Prob + 2,
    marketImpliedProb1: p1Prob - 3,
    scorelineDistribution: {
      "2-0": Math.round(p1Prob * 0.55),
      "2-1": Math.round(p1Prob * 0.45),
      "1-2": Math.round(p2Prob * 0.45),
      "0-2": Math.round(p2Prob * 0.55),
    },
    surface: "hard",
    player1SurfaceElo: p1.elo.hard,
    player2SurfaceElo: p2.elo.hard,
    player1Fatigue: fatigue(p1.id, 4, 7),
    player2Fatigue: fatigue(p2.id, 4, 8),
    marketOdds: [
      { bookmaker: "Bet365",     player1Odds: parseFloat((100 / (p1Prob + 2)).toFixed(2)), player2Odds: parseFloat((100 / (p2Prob + 2)).toFixed(2)), impliedProb1: p1Prob + 2, impliedProb2: p2Prob + 2 },
      { bookmaker: "Betfair",    player1Odds: parseFloat((100 / (p1Prob + 1)).toFixed(2)), player2Odds: parseFloat((100 / (p2Prob + 1)).toFixed(2)), impliedProb1: p1Prob + 1, impliedProb2: p2Prob + 1 },
      { bookmaker: "William Hill", player1Odds: parseFloat((100 / p1Prob).toFixed(2)), player2Odds: parseFloat((100 / p2Prob).toFixed(2)), impliedProb1: p1Prob, impliedProb2: p2Prob },
    ],
    calculatedAt: new Date().toISOString(),
  };
}

function makeStats(playerId: string, hardWin: number, clayWin: number, grassWin: number, form: ("W"|"L")[]): PlayerStats {
  return {
    ...stats(playerId),
    surfaceWinRate: { hard: hardWin, clay: clayWin, grass: grassWin },
    recentForm: form,
  };
}

export const MOCK_MATCH_DETAILS: Record<string, MatchDetail> = {
  // ── ATP QF 1: Sinner vs Medvedev ──────────────────────────────────────────
  "atp-miami-qf-1": {
    ...atpQF[0],
    prediction: makePrediction("atp-miami-qf-1", ATP_PLAYERS.sinner, ATP_PLAYERS.medvedev, 68),
    h2h: makeH2H(7, 5, "hard", "Sinner", "Medvedev", "7-6(4) 6-4"),
    player1Stats: makeStats("atp-sinner", 81, 71, 74, ["W","W","W","W","L"]),
    player2Stats: makeStats("atp-medved", 72, 58, 64, ["W","L","W","W","L"]),
  },

  // ── ATP QF 2: Alcaraz vs Zverev ───────────────────────────────────────────
  "atp-miami-qf-2": {
    ...atpQF[1],
    prediction: makePrediction("atp-miami-qf-2", ATP_PLAYERS.alcaraz, ATP_PLAYERS.zverev, 55),
    h2h: makeH2H(5, 4, "hard", "Alcaraz", "Zverev", "6-3 5-7 6-4"),
    player1Stats: makeStats("atp-alcaraz", 76, 84, 88, ["W","W","L","W","W"]),
    player2Stats: makeStats("atp-zverev",  71, 74, 67, ["W","L","W","W","W"]),
  },

  // ── ATP QF 3: Fritz vs Paul ───────────────────────────────────────────────
  "atp-miami-qf-3": {
    ...atpQF[2],
    prediction: makePrediction("atp-miami-qf-3", ATP_PLAYERS.fritz, ATP_PLAYERS.paul, 52),
    h2h: makeH2H(3, 4, "hard", "Fritz", "Paul", "6-4 3-6 6-3"),
    player1Stats: makeStats("atp-fritz", 73, 62, 71, ["W","W","W","L","W"]),
    player2Stats: makeStats("atp-paul",  70, 60, 65, ["W","L","W","W","W"]),
  },

  // ── ATP QF 4: Ruud vs Shelton ─────────────────────────────────────────────
  "atp-miami-qf-4": {
    ...atpQF[3],
    prediction: makePrediction("atp-miami-qf-4", ATP_PLAYERS.ruud, ATP_PLAYERS.shelton, 59),
    h2h: makeH2H(2, 1, "hard", "Ruud", "Shelton", "6-4 7-6(3)"),
    player1Stats: makeStats("atp-ruud",   68, 79, 63, ["W","W","L","W","W"]),
    player2Stats: makeStats("atp-shelt",  69, 55, 66, ["L","W","W","L","W"]),
  },

  // ── WTA QF 1: Sabalenka vs Keys ───────────────────────────────────────────
  "wta-miami-qf-1": {
    ...wtaQF[0],
    prediction: makePrediction("wta-miami-qf-1", WTA_PLAYERS.sabalenka, WTA_PLAYERS.keys, 65),
    h2h: makeH2H(6, 2, "hard", "Sabalenka", "Keys", "6-2 6-4"),
    player1Stats: makeStats("wta-saba", 79, 68, 72, ["W","W","W","W","W"]),
    player2Stats: makeStats("wta-keys", 72, 65, 67, ["W","L","W","W","L"]),
  },

  // ── WTA QF 2: Swiatek vs Gauff ────────────────────────────────────────────
  "wta-miami-qf-2": {
    ...wtaQF[1],
    prediction: makePrediction("wta-miami-qf-2", WTA_PLAYERS.swiatek, WTA_PLAYERS.gauff, 57),
    h2h: makeH2H(8, 5, "hard", "Swiatek", "Gauff", "7-5 6-3"),
    player1Stats: makeStats("wta-swia", 74, 91, 72, ["W","W","W","L","W"]),
    player2Stats: makeStats("wta-gauff", 73, 68, 70, ["W","W","L","W","W"]),
  },

  // ── WTA QF 3: Rybakina vs Andreeva ────────────────────────────────────────
  "wta-miami-qf-3": {
    ...wtaQF[2],
    prediction: makePrediction("wta-miami-qf-3", WTA_PLAYERS.rybakina, WTA_PLAYERS.andreeva, 54),
    h2h: makeH2H(3, 1, "hard", "Rybakina", "Andreeva", "6-3 6-4"),
    player1Stats: makeStats("wta-ryba", 76, 69, 82, ["W","L","W","W","W"]),
    player2Stats: makeStats("wta-andr", 68, 73, 62, ["L","W","W","L","W"]),
  },

  // ── WTA QF 4: Pegula vs Navarro ───────────────────────────────────────────
  "wta-miami-qf-4": {
    ...wtaQF[3],
    prediction: makePrediction("wta-miami-qf-4", WTA_PLAYERS.pegula, WTA_PLAYERS.navarro, 55),
    h2h: makeH2H(4, 2, "hard", "Pegula", "Navarro", "6-3 6-2"),
    player1Stats: makeStats("wta-pegu", 72, 64, 68, ["W","W","W","L","W"]),
    player2Stats: makeStats("wta-nava", 70, 66, 69, ["W","L","W","W","L"]),
  },
};

// ─── Accessors ────────────────────────────────────────────────────────────────

export function getMockTournaments(circuit: Circuit) {
  return MOCK_TOURNAMENTS[circuit];
}

export function getMockSchedule(tournamentId: string): Match[] {
  if (tournamentId.startsWith("atp-miami")) return ATP_MIAMI_SCHEDULE;
  if (tournamentId.startsWith("wta-miami")) return WTA_MIAMI_SCHEDULE;
  return [];
}

export function getMockDraw(tournamentId: string): Match[] {
  if (tournamentId.startsWith("atp-miami")) return ATP_MIAMI_DRAW;
  if (tournamentId.startsWith("wta-miami")) return WTA_MIAMI_DRAW;
  return [];
}

export function getMockMatchDetail(matchId: string): MatchDetail | null {
  return MOCK_MATCH_DETAILS[matchId] ?? null;
}

export function isMockMode(): boolean {
  return !process.env.RAPIDAPI_KEY;
}
