import type { Surface } from "@/types";
import { cn, surfaceColors, surfaceLabels } from "@/lib/utils";

interface SurfaceBadgeProps {
  surface: Surface;
  className?: string;
}

export function SurfaceBadge({ surface, className }: SurfaceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        surfaceColors[surface],
        className
      )}
    >
      {surfaceLabels[surface]}
    </span>
  );
}
