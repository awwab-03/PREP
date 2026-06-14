import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes conditionally (shadcn convention). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Map a 0-100 score to a tailwind text color. */
export function scoreColor(score) {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-rose-400";
}
