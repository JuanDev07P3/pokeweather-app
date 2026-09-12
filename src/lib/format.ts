export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");
}

export function celsius(v: number): string {
  return `${Math.round(v)}°`;
}

export function windKmh(v: number): string {
  return `${Math.round(v)} km/h`;
}

export function heightM(dm: number): string {
  return `${(dm / 10).toFixed(1)} m`;
}

export function weightKg(hg: number): string {
  return `${(hg / 10).toFixed(1)} kg`;
}

/** "2025-11-12" → "mié 12 nov" */
export function dayLabel(iso: string, index: number): string {
  if (index === 0) return "Hoy";
  const d = new Date(`${iso}T12:00:00`);
  const wd = new Intl.DateTimeFormat("es", { weekday: "short" }).format(d);
  return wd.charAt(0).toUpperCase() + wd.slice(1);
}

export function shortHour(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(d);
}

/** Nombres con forma amable: "mr-mime" → "Mr mime" */
export function prettyName(s: string): string {
  return capitalize(s);
}
