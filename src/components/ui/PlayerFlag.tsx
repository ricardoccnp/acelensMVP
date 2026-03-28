import { cn } from "@/lib/utils";

interface PlayerFlagProps {
  flag: string;        // flag emoji e.g. "🇪🇸"
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "w-8 h-8 text-base",
  md: "w-10 h-10 text-lg",
  lg: "w-14 h-14 text-2xl",
};

export function PlayerFlag({ flag, size = "md", className }: PlayerFlagProps) {
  return (
    <div
      className={cn(
        "rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0",
        sizes[size],
        className
      )}
      aria-hidden="true"
    >
      {flag}
    </div>
  );
}
