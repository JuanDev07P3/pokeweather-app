import { Card, CardContent } from "@/components/ui/card";
import { TypeBadge } from "./TypeBadge";
import { STAT_NAMES, type ConstructedPokemon, typeColor } from "@/services/pokemon";
import { capitalize, heightM, prettyName, weightKg } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

function StatBar({ name, base, color }: { name: string; base: number; color: string }) {
  const pct = Math.min(100, (base / 200) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs text-muted-foreground">{name}</span>
      <span className="w-8 shrink-0 text-xs font-semibold tabular-nums">{base}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function PokemonCard({
  data,
  className,
}: {
  data: ConstructedPokemon;
  className?: string;
}) {
  const accent = typeColor(data.types[0] ?? "unknown");
  const displayName = data.nickname ?? prettyName(data.name);

  return (
    <Card className={cn("overflow-hidden border-border/80 py-0", className)}>
      <div
        className="relative flex items-center justify-center py-6"
        style={{ background: `linear-gradient(160deg, ${accent}26 0%, transparent 70%)` }}
      >
        <img
          src={data.artwork}
          alt={displayName}
          loading="lazy"
          className="h-40 w-40 object-contain"
        />
        <span className="absolute top-3 right-4 text-xs font-medium text-muted-foreground">
          #{data.id > 9999 ? `★${Math.floor(data.id / 10000)}·${data.id % 10000}` : data.id}
        </span>
        {data.shiny && (
          <span className="absolute top-3 left-4 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            <Sparkles className="size-3" /> Variocolor
          </span>
        )}
        {data.isSynthetic && (
          <span className="absolute bottom-3 left-4 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            Fusión creada
          </span>
        )}
      </div>

      <CardContent className="space-y-5 px-6 pb-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl font-bold tracking-tight">{displayName}</h3>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
              Nv. {data.level}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
          {data.genus && <p className="text-xs text-muted-foreground">{capitalize(data.genus)}</p>}
        </div>

        {data.flavor && (
          <p className="text-sm leading-6 text-muted-foreground italic">“{data.flavor}”</p>
        )}

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <span><strong className="text-foreground">{heightM(data.height)}</strong> altura</span>
          <span><strong className="text-foreground">{weightKg(data.weight)}</strong> peso</span>
          {data.abilities.length > 0 && (
            <span>
              Habilidad:{" "}
              <strong className="text-foreground">{capitalize(data.abilities[0].name)}</strong>
              {data.abilities[0].hidden ? " (oculta)" : ""}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {data.stats.map((s) => (
            <StatBar key={s.name} name={STAT_NAMES[s.name] ?? s.name} base={s.base} color={accent} />
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            IVs aleatorios
          </p>
          <div className="grid grid-cols-6 gap-1.5 text-center text-[11px]">
            {(
              [
                ["PS", data.ivs.hp],
                ["Ata", data.ivs.atk],
                ["Def", data.ivs.def],
                ["AtE", data.ivs.spa],
                ["DfE", data.ivs.spd],
                ["Vel", data.ivs.spe],
              ] as const
            ).map(([label, v]) => (
              <div key={label} className="rounded-md bg-secondary px-1 py-1.5">
                <div className="font-semibold tabular-nums">{v}</div>
                <div className="text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {data.moves.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Movimientos
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.moves.map((m) => (
                <span
                  key={m.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/80 px-2.5 py-1 text-xs"
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: typeColor(m.type) }} />
                  {capitalize(m.name)}
                  {m.power != null && <span className="text-muted-foreground">· {m.power}P</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.sourceNote && (
          <p className="border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
            {data.sourceNote} · datos de PokéAPI
          </p>
        )}
      </CardContent>
    </Card>
  );
}
