import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Surface, FatigueLevel } from "@/types";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert ISO 3166-1 alpha-2 country code to flag emoji */
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "🏳️";
  const codePoints = [...code.toUpperCase()].map(
    (c) => 0x1f1e6 + c.charCodeAt(0) - 65
  );
  return String.fromCodePoint(...codePoints);
}

/** Format decimal odds to implied probability (%) */
export function oddsToImpliedProb(decimalOdds: number): number {
  if (decimalOdds <= 0) return 0;
  return Math.round((1 / decimalOdds) * 100);
}

/** Format a date string to a readable label */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format a datetime string to "Mar 28, 14:00" */
export function formatMatchTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Surface display labels */
export const surfaceLabels: Record<Surface, string> = {
  clay: "Clay",
  hard: "Hard",
  grass: "Grass",
  carpet: "Carpet",
};

/** Surface colour tokens */
export const surfaceColors: Record<Surface, string> = {
  clay: "bg-orange-100 text-orange-800 border-orange-200",
  hard: "bg-blue-100 text-blue-800 border-blue-200",
  grass: "bg-green-100 text-green-800 border-green-200",
  carpet: "bg-purple-100 text-purple-800 border-purple-200",
};

/** Fatigue level colour tokens */
export const fatigueColors: Record<FatigueLevel, string> = {
  low: "text-green-600",
  moderate: "text-yellow-600",
  high: "text-red-600",
};

/** Clamp a number to [min, max] */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Format a probability as "72%" */
export function formatProb(prob: number): string {
  return `${Math.round(prob)}%`;
}

/** Truncate string to max chars with ellipsis */
export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + "…" : str;
}
