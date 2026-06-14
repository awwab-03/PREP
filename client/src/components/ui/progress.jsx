import { cn } from "@/lib/utils";

/** Simple deterministic progress bar (0-100). */
export function Progress({ value = 0, className, barClassName }) {
  return (
    <div
      className={cn(
        "h-2.5 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-all duration-700",
          barClassName
        )}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}
