import Link from "next/link";
import type { Tournament } from "@/types";
import { SurfaceBadge } from "@/components/ui/SurfaceBadge";
import { PlayerFlag } from "@/components/ui/PlayerFlag";
import { formatDate } from "@/lib/utils";

interface TournamentCardProps {
  tournament: Tournament;
  label: "Current" | "Next";
  topContenders?: {
    player: { name: string; countryFlag: string };
    titleProbability: number;
  }[];
}

const statusStyles = {
  in_progress: "bg-green-100 text-green-700 border-green-200",
  upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-gray-100 text-gray-500 border-gray-200",
};

const statusLabels = {
  in_progress: "Live",
  upcoming: "Upcoming",
  completed: "Completed",
};

export function TournamentCard({
  tournament,
  label,
  topContenders = [],
}: TournamentCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Header strip */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              {label} Tournament
            </p>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">
              {tournament.name}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {tournament.location} · {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
            </p>
          </div>
          <span
            className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 shrink-0 mt-0.5 ${
              statusStyles[tournament.status]
            }`}
          >
            {statusLabels[tournament.status]}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <SurfaceBadge surface={tournament.surface} />
          <span className="text-xs text-gray-400">{tournament.category}</span>
          {tournament.prizeMoney && (
            <span className="text-xs text-gray-400 ml-auto">{tournament.prizeMoney}</span>
          )}
        </div>
      </div>

      {/* Contenders */}
      {topContenders.length > 0 && (
        <div className="px-5 py-4 flex-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Predicted Contenders
          </p>
          <div className="space-y-2">
            {topContenders.slice(0, 2).map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <PlayerFlag flag={c.player.countryFlag} size="sm" />
                <span className="flex-1 text-sm font-medium text-gray-800">
                  {c.player.name}
                </span>
                <span className="text-sm font-bold text-green-600">
                  {c.titleProbability}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="px-5 pb-5 mt-auto">
        <Link
          href={`/tournament/${tournament.slug}`}
          className="block w-full text-center bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          View Tournament →
        </Link>
      </div>
    </div>
  );
}
