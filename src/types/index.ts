// ─── Circuit ────────────────────────────────────────────────────────────────

export type Circuit = "ATP" | "WTA";

export type Surface = "clay" | "hard" | "grass" | "carpet";

export type TournamentCategory =
  | "Grand Slam"
  | "Masters 1000"
  | "WTA 1000"
  | "ATP 500"
  | "WTA 500"
  | "ATP 250"
  | "WTA 250";

// ─── Player ─────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  country: string;       // ISO 3166-1 alpha-2 country code (e.g. "ES")
  countryFlag: string;   // flag emoji (e.g. "🇪🇸")
  ranking: number;
  circuit: Circuit;
  // Elo ratings per surface
  elo: {
    clay: number;
    hard: number;
    grass: number;
  };
}

// ─── Elo ────────────────────────────────────────────────────────────────────

export interface EloRating {
  playerId: string;
  circuit: Circuit;
  clay: number;
  hard: number;
  grass: number;
  updatedAt: string; // ISO date
}

// ─── Fatigue ─────────────────────────────────────────────────────────────────

export type FatigueLevel = "low" | "moderate" | "high";

export interface FatigueData {
  playerId: string;
  matchesLast7Days: number;
  matchesLast14Days: number;
  score: number;        // 0–1 normalised
  level: FatigueLevel;
  updatedAt: string;
}

// ─── Tournament ──────────────────────────────────────────────────────────────

export type TournamentStatus = "upcoming" | "in_progress" | "completed";

export interface Tournament {
  id: string;
  slug: string;
  name: string;
  circuit: Circuit;
  category: TournamentCategory;
  surface: Surface;
  location: string;
  country: string;
  startDate: string;   // ISO date
  endDate: string;     // ISO date
  prizeMoney: string;  // formatted string e.g. "$6,250,000"
  status: TournamentStatus;
  currentRound?: string;
  draws?: Draw;
}

// ─── Match / Draw ────────────────────────────────────────────────────────────

export type MatchStatus = "upcoming" | "live" | "completed";

export type Round =
  | "R128"
  | "R64"
  | "R32"
  | "R16"
  | "QF"
  | "SF"
  | "F";

export interface MatchPlayer {
  player: Player;
  seed?: number;
  score?: string;  // e.g. "6-3 7-5"
  isWinner?: boolean;
  winProbability?: number; // 0–100
}

export interface Match {
  id: string;
  tournamentId: string;
  round: Round;
  scheduledTime?: string;  // ISO datetime
  court?: string;
  status: MatchStatus;
  player1: MatchPlayer;
  player2: MatchPlayer;
  prediction?: MatchPrediction;
}

export interface Draw {
  [round: string]: Match[];
}

// ─── Prediction ──────────────────────────────────────────────────────────────

export interface ScorelineDistribution {
  "2-0": number;  // e.g. 42 (%)
  "2-1": number;
  "1-2": number;
  "0-2": number;
}

export interface MarketOdds {
  bookmaker: string;
  player1Odds: number;  // decimal odds e.g. 1.45
  player2Odds: number;
  impliedProb1: number; // 0–100
  impliedProb2: number;
}

export interface MatchPrediction {
  matchId: string;
  player1WinProbability: number;  // 0–100 (final blended)
  player2WinProbability: number;
  modelProbability1: number;      // raw model (pre-market blend)
  marketImpliedProb1: number;     // from odds API
  scorelineDistribution: ScorelineDistribution;
  surface: Surface;
  // Elo inputs
  player1SurfaceElo: number;
  player2SurfaceElo: number;
  // Fatigue inputs
  player1Fatigue: FatigueData;
  player2Fatigue: FatigueData;
  // Market odds
  marketOdds: MarketOdds[];
  calculatedAt: string; // ISO datetime
}

// ─── H2H ────────────────────────────────────────────────────────────────────

export interface H2HRecord {
  player1Wins: number;
  player2Wins: number;
  totalMatches: number;
  surfaceRecord?: {
    clay: { p1: number; p2: number };
    hard: { p1: number; p2: number };
    grass: { p1: number; p2: number };
  };
  lastMeeting?: {
    date: string;
    tournament: string;
    surface: Surface;
    winner: "player1" | "player2";
    score: string;
  };
}

// ─── Player Stats ─────────────────────────────────────────────────────────────

export interface PlayerStats {
  playerId: string;
  season: number;
  surfaceWinRate: {
    clay: number;
    hard: number;
    grass: number;
  };
  surfaceRecord: {
    clay: { wins: number; losses: number };
    hard: { wins: number; losses: number };
    grass: { wins: number; losses: number };
  };
  serveStats: {
    firstServePercentage: number;
    firstServePointsWon: number;
    returnPointsWon: number;
    acesPerMatch: number;
    unforcedErrorsPerMatch: number;
    winnersPerMatch: number;
  };
  recentForm: ("W" | "L")[]; // last 5 results, most recent first
}

// ─── AI Preview ──────────────────────────────────────────────────────────────

export interface MatchPreview {
  matchId: string;
  text: string;
  generatedAt: string;  // ISO datetime
  cachedAt: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

// ─── Full Match Detail (used on Match page) ──────────────────────────────────

export interface MatchDetail extends Match {
  h2h: H2HRecord;
  player1Stats: PlayerStats;
  player2Stats: PlayerStats;
  preview?: MatchPreview;
}

// ─── Home Page ───────────────────────────────────────────────────────────────

export interface TournamentCard {
  tournament: Tournament;
  topContenders: {
    player: Player;
    titleProbability: number;
  }[];
  nextMatch?: Match;
}
