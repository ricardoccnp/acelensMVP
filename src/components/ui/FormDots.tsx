import { cn } from "@/lib/utils";

interface FormDotsProps {
  form: ("W" | "L")[];  // most recent first
  className?: string;
}

export function FormDots({ form, className }: FormDotsProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      {form.slice(0, 5).map((result, i) => (
        <span
          key={i}
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
            result === "W"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          )}
        >
          {result}
        </span>
      ))}
    </div>
  );
}
