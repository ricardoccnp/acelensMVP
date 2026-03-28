"use client";

import { useEffect, useState } from "react";
import type { Tournament, Match } from "@/types";
import { TournamentTabs } from "./TournamentTabs";

interface TournamentClientProps {
  tournamentId: string;
  tournament: Tournament;
}

export function TournamentClient({ tournamentId, tournament }: TournamentClientProps) {
  const [schedule, setSchedule] = useState<Match[]>([]);
  const [draw, setDraw] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tournament/${tournamentId}/schedule`).then((r) => r.json()),
      fetch(`/api/tournament/${tournamentId}/draw`).then((r) => r.json()),
    ])
      .then(([s, d]) => {
        setSchedule(s.matches ?? []);
        setDraw(d.matches ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="p-8 space-y-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-white rounded-xl border border-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <TournamentTabs tournament={tournament} schedule={schedule} draw={draw} />
  );
}
