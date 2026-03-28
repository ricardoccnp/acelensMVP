"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Tournament, Match } from "@/types";
import { ScheduleTab } from "./ScheduleTab";
import { DrawTab } from "./DrawTab";
import { PredictionsTab } from "./PredictionsTab";

interface TournamentTabsProps {
  tournament: Tournament;
  schedule: Match[];
  draw: Match[];
}

type Tab = "schedule" | "draw" | "predictions";

const tabs: { id: Tab; label: string }[] = [
  { id: "schedule", label: "Schedule" },
  { id: "draw", label: "Draw" },
  { id: "predictions", label: "Predictions" },
];

export function TournamentTabs({ tournament, schedule, draw }: TournamentTabsProps) {
  const [active, setActive] = useState<Tab>("schedule");

  // Upcoming matches for predictions tab
  const upcoming = schedule.filter((m) => m.status === "upcoming");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-white sticky top-14 z-40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "px-6 py-3.5 text-sm font-semibold transition-all border-b-2 -mb-px",
              active === tab.id
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="tab-content-enter">
        {active === "schedule" && (
          <ScheduleTab matches={schedule} />
        )}
        {active === "draw" && (
          <DrawTab matches={draw} surface={tournament.surface} />
        )}
        {active === "predictions" && (
          <PredictionsTab matches={upcoming} />
        )}
      </div>
    </div>
  );
}
