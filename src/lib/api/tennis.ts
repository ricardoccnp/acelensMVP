/**
 * API-Tennis client (via RapidAPI)
 *
 * Free tier: 500 requests / month
 * All responses are cached in Vercel KV — live API only called when TTL expires.
 *
 * Docs: https://api-tennis.com/documentation
 */

import type {
  Tournament,
  Match,
  Player,
  H2HRecord,
  PlayerStats,
  Circuit,
  Surface,
  Round,
} from "@/types";
import { countryCodeToFlag } from "@/lib/utils";

const BASE_URL = "https://api-tennis.p.rapidapi.com";

const headers = {
  "X-RapidAPI-Key": process.env.RAPIDAPI_KEY ?? "",
  "X-RapidAPI-Host": process.env.RAPIDAPI_HOST ?? "api-tennis.p.rapidapi.com",
};

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    throw new Error(`API-Tennis error ${res.status}: ${path}`);
  }

  const json = await res.json();
  // API-Tennis wraps results in { result: [...] }
  return json.result ?? json;
}

// ─── Surface mapping ──────────────────────────────────────────────────────────

function mapSurface(raw: string): Surface {
  const lower = raw?.toLowerCase() ?? "";
  if (lower.includes("clay")) return "clay";
  if (lower.includes("hard")) return "hard";
  if (lower.includes("grass")) return "grass";
  return "hard"; // default
}

// ─── Round mapping ────────────────────────────────────────────────────────────

function mapRound(raw: string): Round {
  const r = raw?.toUpperCase() ?? "";
  if (r.includes("FINAL") && !r.includes("SEMI") && !r.includes("QUARTER")) return "F";
  if (r.includes("SEMI")) return "SF";
  if (r.includes("QUARTER")) return "QF";
  if (r.includes("16")) return "R16";
  if (r.includes("32")) return "R32";
  if (r.includes("64")) return "R64";
  return "R128";
}

// ─── Player mapping ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPlayer(raw: any, circuit: Circuit): Player {
  const country = raw.country ?? raw.nationality ?? "XX";
  const name: string = raw.player_name ?? raw.name ?? "Unknown";
  const parts = name.split(" ");
  return {
    id: String(raw.player_key ?? raw.id ?? raw.player_id),
    name,
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
    country,
    countryFlag: countryCodeToFlag(country),
    ranking: Number(raw.player_rank ?? raw.ranking ?? 0),
    circuit,
    elo: { clay: 1500, hard: 1500, grass: 1500 }, // placeholder; overwritten from KV
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch current + upcoming tournaments for a circuit.
 * Returns a flat list; caller filters for current / next.
 */
export async function fetchTournaments(circuit: Circuit): Promise<Tournament[]> {
  const type = circuit === "ATP" ? "atp" : "wta";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any[] = await apiFetch("/", { method: "get_tournaments", type });

  return raw.map((t) => ({
    id: String(t.tournament_key ?? t.id),
    slug: slugify(t.tournament_name ?? t.name),
    name: t.tournament_name ?? t.name,
    circuit,
    category: t.category ?? "ATP 250",
    surface: mapSurface(t.surface ?? ""),
    location: t.city ?? t.location ?? "",
    country: t.country ?? "",
    startDate: t.date_start ?? t.start_date ?? "",
    endDate: t.date_end ?? t.end_date ?? "",
    prizeMoney: t.prize_money ?? "",
    status: deriveTournamentStatus(t.date_start, t.date_end),
    currentRound: t.round ?? undefined,
  }));
}

/**
 * Fetch the draw (matches by round) for a tournament.
 */
export async function fetchTournamentDraw(
  tournamentId: string
): Promise<Match[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any[] = await apiFetch("/", {
    method: "get_H2H",
    tournament_key: tournamentId,
  });

  return raw.map(mapRawMatch);
}

/**
 * Fetch the schedule (upcoming + completed matches) for a tournament.
 */
export async function fetchTournamentSchedule(
  tournamentId: string
): Promise<Match[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any[] = await apiFetch("/", {
    method: "get_events",
    tournament_key: tournamentId,
  });

  return raw.map(mapRawMatch);
}

/**
 * Fetch head-to-head record between two players.
 */
export async function fetchH2H(
  player1Id: string,
  player2Id: string
): Promise<H2HRecord> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any = await apiFetch("/", {
    method: "get_H2H",
    player_key_1: player1Id,
    player_key_2: player2Id,
  });

  const p1Wins = Number(raw.player_1_wins ?? 0);
  const p2Wins = Number(raw.player_2_wins ?? 0);
  return {
    player1Wins: p1Wins,
    player2Wins: p2Wins,
    totalMatches: p1Wins + p2Wins,
    lastMeeting: raw.last_match
      ? {
          date: raw.last_match.match_date,
          tournament: raw.last_match.tournament_name,
          surface: mapSurface(raw.last_match.surface),
          winner: raw.last_match.winner === "player_1" ? "player1" : "player2",
          score: raw.last_match.score,
        }
      : undefined,
  };
}

/**
 * Fetch basic player statistics for the current season.
 */
export async function fetchPlayerStats(
  playerId: string
): Promise<PlayerStats | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await apiFetch("/", {
      method: "get_player",
      player_key: playerId,
    });

    return {
      playerId,
      season: new Date().getFullYear(),
      surfaceWinRate: {
        clay: Number(raw.clay_win_percentage ?? 50),
        hard: Number(raw.hard_win_percentage ?? 50),
        grass: Number(raw.grass_win_percentage ?? 50),
      },
      surfaceRecord: {
        clay: {
          wins: Number(raw.clay_wins ?? 0),
          losses: Number(raw.clay_losses ?? 0),
        },
        hard: {
          wins: Number(raw.hard_wins ?? 0),
          losses: Number(raw.hard_losses ?? 0),
        },
        grass: {
          wins: Number(raw.grass_wins ?? 0),
          losses: Number(raw.grass_losses ?? 0),
        },
      },
      serveStats: {
        firstServePercentage: Number(raw.first_serve_percentage ?? 60),
        firstServePointsWon: Number(raw.first_serve_points_won ?? 70),
        returnPointsWon: Number(raw.return_points_won ?? 40),
        acesPerMatch: Number(raw.aces_per_match ?? 5),
        unforcedErrorsPerMatch: Number(raw.unforced_errors_per_match ?? 25),
        winnersPerMatch: Number(raw.winners_per_match ?? 30),
      },
      recentForm: parseRecentForm(raw.recent_form),
    };
  } catch {
    return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function deriveTournamentStatus(
  startDate: string,
  endDate: string
): "upcoming" | "in_progress" | "completed" {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (now < start) return "upcoming";
  if (now > end) return "completed";
  return "in_progress";
}

function parseRecentForm(raw: string | string[] | undefined): ("W" | "L")[] {
  if (!raw) return [];
  const str = Array.isArray(raw) ? raw.join("") : raw;
  return str
    .split("")
    .filter((c) => c === "W" || c === "L")
    .slice(0, 5) as ("W" | "L")[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRawMatch(raw: any): Match {
  const circuit: Circuit = raw.type === "wta" ? "WTA" : "ATP";
  return {
    id: String(raw.event_key ?? raw.match_id ?? raw.id),
    tournamentId: String(raw.tournament_key ?? raw.tournament_id ?? ""),
    round: mapRound(raw.round ?? raw.event_round ?? ""),
    scheduledTime: raw.event_date ?? raw.match_date ?? undefined,
    court: raw.event_court ?? raw.court ?? undefined,
    status: raw.event_status === "Finished"
      ? "completed"
      : raw.event_status === "In Progress"
      ? "live"
      : "upcoming",
    player1: {
      player: mapPlayer(
        { ...raw, player_name: raw.event_home_team ?? raw.player_1_name, country: raw.home_team_country ?? raw.player_1_country, ranking: raw.home_team_ranking ?? raw.player_1_rank, player_key: raw.event_home_team_id ?? raw.player_1_key },
        circuit
      ),
      seed: raw.home_team_seed ?? raw.player_1_seed ?? undefined,
      score: raw.event_home_final_result ?? undefined,
      isWinner: raw.event_winner === "home",
    },
    player2: {
      player: mapPlayer(
        { ...raw, player_name: raw.event_away_team ?? raw.player_2_name, country: raw.away_team_country ?? raw.player_2_country, ranking: raw.away_team_ranking ?? raw.player_2_rank, player_key: raw.event_away_team_id ?? raw.player_2_key },
        circuit
      ),
      seed: raw.away_team_seed ?? raw.player_2_seed ?? undefined,
      score: raw.event_away_final_result ?? undefined,
      isWinner: raw.event_winner === "away",
    },
  };
}
