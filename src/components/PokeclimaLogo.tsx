import { cn } from "@/lib/utils";

/** Pokéclima mark: a Pokéball tilted into a weather-sun. */
export function PokeclimaLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
        <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M3.8 12h5.4M14.8 12h5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="0.9" fill="currentColor" />
        <path d="M12 3.8a8.2 8.2 0 0 1 8 6.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.45" />
      </svg>
    </span>
  );
}
