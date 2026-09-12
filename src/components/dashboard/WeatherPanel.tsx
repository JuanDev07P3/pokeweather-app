import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Button,
} from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WeatherIcon } from "@/components/weather/WeatherIcon";
import {
  QUICK_CITIES,
  describeCode,
  fetchWeather,
  formatPlace,
  searchPlaces,
  type GeoPlace,
  type WeatherBundle,
} from "@/services/weather";
import { celsius, dayLabel, shortHour, windKmh } from "@/lib/format";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  Droplets,
  Heart,
  Loader2,
  MapPin,
  Search,
  Sunrise,
  Sunset,
  Wind,
} from "lucide-react";

export function WeatherPanel({ className }: { className?: string }) {
  const [weather, setWeather] = useState<WeatherBundle | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<number | null>(null);
  const cities = useQuery(api.pokeclima.listCities, {});
  const saveCity = useMutation(api.pokeclima.saveCity);
  const deleteCity = useMutation(api.pokeclima.deleteCity);

  const loadWeather = useCallback(async (place: GeoPlace) => {
    setLoading(true);
    setWeather(null);
    try {
      const data = await fetchWeather(place);
      setWeather(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error de red";
      toast.error("No se pudo cargar el clima", { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  // initial city
  useEffect(() => {
    void loadWeather(QUICK_CITIES[0]);
  }, [loadWeather]);

  // debounced geocoding search
  const onQueryChange = (q: string) => {
    setQuery(q);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const r = await searchPlaces(term, 6);
        setResults(r);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const isSaved = useMemo(
    () => (weather ? (cities ?? []).some((c) => c.placeId === weather.place.id) : false),
    [cities, weather],
  );

  const toggleSave = async () => {
    if (!weather) return;
    const p = weather.place;
    if (isSaved) {
      const existing = (cities ?? []).find((c) => c.placeId === p.id);
      if (existing) {
        await deleteCity({ id: existing._id });
        toast("Ciudad eliminada", { description: `${p.name} ya no está guardada.` });
      }
      return;
    }
    await saveCity({
      placeId: p.id,
      name: p.name,
      country: p.country,
      admin1: p.admin1,
      latitude: p.latitude,
      longitude: p.longitude,
    });
    toast.success("Ciudad guardada", { description: `${p.name} se añadió a tus ciudades.` });
  };

  const selectResult = (p: GeoPlace) => {
    setResults([]);
    setQuery("");
    void loadWeather(p);
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Busca una ciudad… (ej. Lima, Valencia)"
            className="pl-9"
          />
          {searching && (
            <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          variant="outline"
          onClick={toggleSave}
          disabled={!weather}
          className="cursor-pointer gap-2"
        >
          <Heart className={isSaved ? "fill-current" : undefined} />
          {isSaved ? "Guardada" : "Guardar ciudad"}
        </Button>
      </div>

      {(results.length > 0 || query.trim().length >= 2) && (
        <div className="mt-2 overflow-hidden rounded-lg border border-border/70 bg-popover">
          {results.length === 0 && searching && (
            <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Buscando…
            </div>
          )}
          {results.length === 0 && !searching && (
            <div className="px-3 py-2.5 text-sm text-muted-foreground">Sin resultados.</div>
          )}
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectResult(p)}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent"
            >
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <span className="font-medium">{p.name}</span>
              <span className="truncate text-muted-foreground">{formatPlace(p)}</span>
            </button>
          ))}
        </div>
      )}

      {cities && cities.length > 0 && (
        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {cities.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() =>
                void loadWeather({
                  id: c.placeId,
                  name: c.name,
                  latitude: c.latitude,
                  longitude: c.longitude,
                  country: c.country,
                  admin1: c.admin1,
                })
              }
              className="shrink-0 cursor-pointer rounded-full border border-border/80 px-3 py-1 text-xs font-medium hover:bg-accent"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3">
        {loading && (
          <Card className="py-0">
            <CardContent className="flex h-56 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        )}

        {!loading && weather && (
          <Card className="overflow-hidden py-0">
            <div className="bg-gradient-to-br from-primary/12 via-primary/5 to-transparent p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {weather.place.name}
                    <span className="opacity-60">{formatPlace(weather.place)}</span>
                  </p>
                  <div className="mt-1 flex items-end gap-3">
                    <span className="font-display text-6xl font-extrabold tracking-tighter">
                      {celsius(weather.current.temp)}
                    </span>
                    <div className="pb-2">
                      <p className="text-sm font-semibold">{weather.current.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Sensación {celsius(weather.current.feelsLike)} · {weather.timezone}
                      </p>
                    </div>
                  </div>
                </div>
                <WeatherIcon name={weather.current.icon} className="size-16 text-primary" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric icon={Wind} label="Viento" value={windKmh(weather.current.wind)} />
                <Metric icon={Droplets} label="Humedad" value={`${weather.current.humidity}%`} />
                <Metric icon={Sunrise} label="Amanecer" value={shortHour(weather.sunrise)} />
                <Metric icon={Sunset} label="Atardecer" value={shortHour(weather.sunset)} />
              </div>
            </div>

            <CardContent className="pt-0">
              <p className="pt-5 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Próximos 7 días
              </p>
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {weather.daily.map((d, i) => {
                  const meta = describeCode(d.code);
                  return (
                    <div
                      key={d.date}
                      className="flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-xl border border-border/60 px-2 py-3"
                    >
                      <span className="text-xs font-semibold">{dayLabel(d.date, i)}</span>
                      <WeatherIcon name={meta.icon} className="size-7 text-foreground/70" />
                      <span className="text-xs text-muted-foreground" title={meta.label}>
                        {meta.emoji} {d.rainProb}%
                      </span>
                      <span className="text-xs tabular-nums">
                        <strong>{celsius(d.max)}</strong> {celsius(d.min)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wind;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card/70 px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

// Skeleton is re-exported intentionally for consumers that want the loading shape.
export { Skeleton };
