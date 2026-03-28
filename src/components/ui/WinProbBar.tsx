import { cn } from "@/lib/utils";

interface WinProbBarProps {
  player1Name: string;
  player2Name: string;
  player1Prob: number;  // 0–100
  player2Prob: number;
  className?: string;
}

export function WinProbBar({
  player1Name,
  player2Name,
  player1Prob,
  player2Prob,
  className,
}: WinProbBarProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-xs text-gray-500 font-medium">
        <span className="truncate max-w-[45%]">{player1Name}</span>
        <span className="truncate max-w-[45%] text-right">{player2Name}</span>
      </div>

      {/* Segmented probability bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
        <div
          className="bg-green-500 transition-all duration-500"
          style={{ width: `${player1Prob}%` }}
        />
        <div
          className="bg-gray-300 transition-all duration-500"
          style={{ width: `${player2Prob}%` }}
        />
      </div>

      <div className="flex justify-between text-sm font-semibold">
        <span className="text-green-700">{player1Prob}%</span>
        <span className="text-gray-500">{player2Prob}%</span>
      </div>
    </div>
  );
}
