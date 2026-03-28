import { notFound } from "next/navigation";
import type { Tournament, Match } from "@/types";
import { SurfaceBadge } from "@/components/ui/SurfaceBadge";
import { TournamentTabs } from "@/components/tournament/TournamentTabs";
import { cacheGet, CacheKeys } from "@/lib/cache/kv";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getTournamentBySlug(slug: string): Promise<Tournament | null> {
  // Check ATP then WTA tournaments cache
  for (const circuit of ["ATP", "WTA"] as const) {
    const tournaments = await cacheGet<Tournament[]>(
      CacheKeys.tournaments(circuit)
    );
    if (!tournaments) continue;
    const found = tournaments.find((t) => t.slug === slug);
    if (found) return found;
  }
  return null;
}

async function getTournamentSchedule(tournamentId: string): Promise<Match[]> {
  return (
    (await cacheGet<Match[]>(CacheKeys.tournamentSchedule(tournamentId))) ?? []
  );
}

async function getTournamentDraw(tournamentId: string): Promise<Match[]> {
  return (
    (await cacheGet<Match[]>(CacheKeys.tournamentDraw(tournamentId))) ?? []
  );
}

const statusStyles = {
  in_progress: "bg-green-100 text-green-700",
  upcoming: "bg-blue-50 text-blue-700",
  completed: "bg-gray-100 text-gray-500",
};

const statusLabels = {
  in_progress: "● Live",
  upcoming: "Upcoming",
  completed: "Completed",
};

export default async function TournamentPage({ params }: PageProps) {
  const { slug } = await params;

  const tournament = await getTournamentBySlug(slug);
  if (!tournament) {
    notFound();
  }

  const [schedule, draw] = await Promise.all([
    getTournamentSchedule(tournament.id),
    getTournamentDraw(tournament.id),
  ]);

  return (
    <div className="min-h-screen">
      {/* Tournament header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    statusStyles[tournament.status]
                  }`}
                >
                  {statusLabels[tournament.status]}
                </span>
                <span className="text-xs text-gray-400">{tournament.circuit}</span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {tournament.name}
              </h1>

              <p className="text-gray-500 mt-1 text-sm">
                {tournament.location} · {formatDate(tournament.startDate)} –{" "}
                {formatDate(tournament.endDate)}
              </p>

              <div className="flex items-center gap-3 mt-3">
                <SurfaceBadge surface={tournament.surface} />
                <span className="text-xs text-gray-400">{tournament.category}</span>
                {tournament.prizeMoney && (
                  <span className="text-xs font-semibold text-gray-600">
                    {tournament.prizeMoney}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs (schedule, draw, predictions) */}
      <div className="max-w-6xl mx-auto">
        <TournamentTabs
          tournament={tournament}
          schedule={schedule}
          draw={draw}
        />
      </div>
    </div>
  );
}
