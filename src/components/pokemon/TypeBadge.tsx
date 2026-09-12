import { typeColor, typeLabel } from "@/services/pokemon";
import { cn } from "@/lib/utils";

export function TypeBadge({ type, className }: { type: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white",
        className,
      )}
      style={{ backgroundColor: typeColor(type) }}
    >
      {typeLabel(type)}
    </span>
  );
}
