import { cn } from "@/lib/utils";

interface StatBarProps {
  label: string;
  value1: number;    // player 1 value (e.g. 65 for %)
  value2: number;    // player 2 value
  suffix?: string;   // e.g. "%"
  className?: string;
}

/**
 * Dual-sided stat bar for comparing two players on a single metric.
 */
export function StatBar({ label, value1, value2, suffix = "%", className }: StatBarProps) {
  const max = Math.max(value1, value2, 1);
  const w1 = Math.round((value1 / max) * 100);
  const w2 = Math.round((value2 / max) * 100);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="text-xs text-gray-500 text-center font-medium">{label}</div>
      <div className="flex items-center gap-2">
        {/* Player 1 bar (right-aligned) */}
        <div className="flex-1 flex justify-end">
          <div className="w-full bg-gray-100 rounded-full h-2 flex justify-end overflow-hidden">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${w1}%` }}
            />
          </div>
        </div>

        {/* Values */}
        <div className="text-xs font-semibold text-gray-700 w-24 text-center shrink-0">
          <span className="text-green-700">{value1}{suffix}</span>
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-gray-600">{value2}{suffix}</span>
        </div>

        {/* Player 2 bar (left-aligned) */}
        <div className="flex-1 flex justify-start">
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gray-400 h-2 rounded-full transition-all"
              style={{ width: `${w2}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
