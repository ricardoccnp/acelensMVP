"use client";

import { useEffect, useState } from "react";
import type { MatchPreview } from "@/types";

interface AIPreviewCardProps {
  matchId: string;
  initialPreview?: MatchPreview | null;
}

export function AIPreviewCard({ matchId, initialPreview }: AIPreviewCardProps) {
  const [preview, setPreview] = useState<MatchPreview | null>(
    initialPreview ?? null
  );
  const [loading, setLoading] = useState(!initialPreview);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initialPreview) return;

    fetch(`/api/match/${matchId}/preview`)
      .then((r) => r.json())
      .then((data) => {
        if (data.text) {
          setPreview(data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [matchId, initialPreview]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3 md:col-span-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">AI Match Preview</h3>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          claude-sonnet-4-6
        </div>
      </div>

      {loading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-4 bg-gray-100 rounded w-4/5" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      )}

      {error && (
        <p className="text-sm text-gray-400 italic">
          Preview unavailable — check back soon.
        </p>
      )}

      {preview && (
        <>
          <p className="text-gray-700 text-sm leading-relaxed">{preview.text}</p>
          <p className="text-xs text-gray-300">
            Generated {new Date(preview.generatedAt).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </>
      )}
    </div>
  );
}
