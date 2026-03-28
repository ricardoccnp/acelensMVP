"use client";

import { useEffect, useState } from "react";
import { useCircuit } from "@/components/layout/CircuitProvider";
import { TournamentCard } from "./TournamentCard";
import type { Tournament } from "@/types";

interface TournamentsData {
  current: Tournament | null;
  next: Tournament | null;
}

export function HomeClient() {
  const { circuit } = useCircuit();
  const [data, setData] = useState<TournamentsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tournaments?circuit=${circuit}`)
      .then((r) => r.json())
      .then((d) => {
        setData({ current: d.current, next: d.next });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [circuit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TournamentCardSkeleton />
        <TournamentCardSkeleton />
      </div>
    );
  }

  if (!data?.current && !data?.next) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg font-medium">No tournaments available</p>
        <p className="text-sm mt-1">Check back soon for upcoming {circuit} events.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {data.current && (
        <TournamentCard
          tournament={data.current}
          label="Current"
          topContenders={[]}
        />
      )}
      {data.next && (
        <TournamentCard
          tournament={data.next}
          label="Next"
          topContenders={[]}
        />
      )}
    </div>
  );
}

function TournamentCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-28 mb-3" />
      <div className="h-6 bg-gray-100 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
      <div className="flex gap-2 mb-6">
        <div className="h-5 bg-gray-100 rounded w-14" />
        <div className="h-5 bg-gray-100 rounded w-20" />
      </div>
      <div className="h-10 bg-gray-100 rounded-xl w-full" />
    </div>
  );
}
