import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PokemonCard } from "@/components/pokemon/PokemonCard";
import { TypeBadge } from "@/components/pokemon/TypeBadge";
import {
  TYPE_NAMES,
  PokemonApi,
  PokemonConstructor,
  type ConstructedPokemon,
} from "@/services/pokemon";
import { prettyName } from "@/lib/format";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  FlaskConical,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";

const pokeApi = new PokemonApi();

const SOURCES = [
  { value: "name", label: "Por nombre" },
  { value: "id", label: "Por número" },
  { value: "type", label: "Aleatorio de tipo" },
  { value: "ability", label: "Aleatorio por habilidad" },
  { value: "generation", label: "Aleatorio por generación" },
  { value: "random", label: "Totalmente aleatorio" },
  { value: "hybrid", label: "Fusión de dos especies" },
] as const;

type Source = (typeof SOURCES)[number]["value"];

const ABILITIES = [
  "intimidate", "levitate", "speed-boost", "drizzle", "drought", "multiscale",
  "prankster", "regenerator", "huge-power", "magic-bounce", "gale-wings",
];

export function PokemonLab() {
  const [source, setSource] = useState<Source>("name");
  const [nameValue, setNameValue] = useState("");
  const [idValue, setIdValue] = useState("25");
  const [typeValue, setTypeValue] = useState("fire");
  const [abilityValue, setAbilityValue] = useState("intimidate");
  const [genValue, setGenValue] = useState("1");
  const [hybridA, setHybridA] = useState("gengar");
  const [hybridB, setHybridB] = useState("alakazam");
  const [level, setLevel] = useState(50);
  const [shiny, setShiny] = useState(false);
  const [nickname, setNickname] = useState("");
  const [movesText, setMovesText] = useState("");

  const [current, setCurrent] = useState<ConstructedPokemon | null>(null);
  const [building, setBuilding] = useState(false);

  const creations = useQuery(api.pokeclima.listCreations, {});
  const saveCreation = useMutation(api.pokeclima.saveCreation);
  const deleteCreation = useMutation(api.pokeclima.deleteCreation);

  const generate = async () => {
    if (source === "name" && !nameValue.trim()) {
      toast.error("Escribe un nombre (p. ej. pikachu).");
      return;
    }
    if (source === "id" && !/^\d+$/.test(idValue.trim())) {
      toast.error("Escribe un número de Pokédex válido.");
      return;
    }
    if (source === "hybrid" && (!hybridA.trim() || !hybridB.trim())) {
      toast.error("Escribe las dos especies a fusionar.");
      return;
    }

    setBuilding(true);
    setCurrent(null);
    try {
      let c = new PokemonConstructor(pokeApi).level(level);
      if (shiny) c = c.shiny();
      if (nickname.trim()) c = c.nickname(nickname);
      const moves = movesText
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (moves.length) c = c.withMoves(moves);

      switch (source) {
        case "name": c = c.name(nameValue.trim().toLowerCase()); break;
        case "id": c = c.id(Number.parseInt(idValue.trim(), 10)); break;
        case "type": c = c.type(typeValue); break;
        case "ability": c = c.ability(abilityValue); break;
        case "generation": c = c.generation(Number.parseInt(genValue, 10)); break;
        case "random": c = c.random(); break;
        case "hybrid": c = c.hybrid(hybridA.trim().toLowerCase(), hybridB.trim().toLowerCase()); break;
      }

      const data = await c.build();
      setCurrent(data);
      toast.success("¡Pokémon construido!", { description: prettyName(data.name) });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error de red";
      toast.error("No se pudo construir", { description: msg });
    } finally {
      setBuilding(false);
    }
  };

  const save = async () => {
    if (!current) return;
    try {
      await saveCreation({
        name: current.name,
        displayName: current.nickname ?? prettyName(current.name),
        artwork: current.artwork,
        sprite: current.sprite,
        types: current.types,
        level: current.level,
        shiny: current.shiny,
        isSynthetic: !!current.isSynthetic,
        sourceNote: current.sourceNote ?? "",
        payload: current,
      });
      toast.success("Guardado en tu Pokédex", {
        description: current.nickname ?? prettyName(current.name),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      toast.error("No se pudo guardar", { description: msg });
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteCreation({ id: id as never });
      toast("Eliminado de tu Pokédex");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      {/* -------- Builder -------- */}
      <div className="space-y-5">
        <div className="rounded-xl border border-border/70 bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wand2 className="size-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold">Constructor de Pokémon</h3>
              <p className="text-xs text-muted-foreground">
                Elige un origen, ajusta los modificadores y construye.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Origen de consulta</label>
              <Select value={source} onValueChange={(v) => setSource(v as Source)}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {source === "name" && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Nombre de la especie</label>
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  placeholder="pikachu, charizard, mewtwo…"
                />
              </div>
            )}
            {source === "id" && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Número de Pokédex</label>
                <Input
                  value={idValue}
                  inputMode="numeric"
                  onChange={(e) => setIdValue(e.target.value)}
                  placeholder="25"
                />
              </div>
            )}
            {source === "type" && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                <Select value={typeValue} onValueChange={setTypeValue}>
                  <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_NAMES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {source === "ability" && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Habilidad</label>
                <Select value={abilityValue} onValueChange={setAbilityValue}>
                  <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ABILITIES.map((a) => (
                      <SelectItem key={a} value={a}>{a.replace(/-/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {source === "generation" && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Generación</label>
                <Select value={genValue} onValueChange={setGenValue}>
                  <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 9 }, (_, i) => i + 1).map((g) => (
                      <SelectItem key={g} value={String(g)}>Generación {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {source === "hybrid" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Especie A</label>
                  <Input value={hybridA} onChange={(e) => setHybridA(e.target.value)} placeholder="gengar" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Especie B</label>
                  <Input value={hybridB} onChange={(e) => setHybridB(e.target.value)} placeholder="alakazam" />
                </div>
              </>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Nivel</label>
                <span className="text-xs font-bold tabular-nums text-primary">{level}</span>
              </div>
              <Slider
                value={[level]}
                onValueChange={(v) => setLevel(v[0] ?? 50)}
                min={1}
                max={100}
                step={1}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                <span className="text-xs font-medium">Variocolor (shiny)</span>
              </div>
              <Switch checked={shiny} onCheckedChange={setShiny} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Apodo (opcional)</label>
              <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Chispita…" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Movimientos (opcional)</label>
              <Input
                value={movesText}
                onChange={(e) => setMovesText(e.target.value)}
                placeholder="flamethrower, earthquake…"
              />
            </div>
          </div>

          <Button
            className="mt-5 w-full cursor-pointer gap-2"
            onClick={() => void generate()}
            disabled={building}
          >
            {building ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FlaskConical className="size-4" />
            )}
            {building ? "Construyendo…" : "Construir Pokémon"}
          </Button>
        </div>

        {/* -------- Result -------- */}
        {building && (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border/70 text-muted-foreground">
            <span className="flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" /> Consultando varias APIs de Pokémon…
            </span>
          </div>
        )}
        {current && !building && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <PokemonCard data={current} />
            <Button className="w-full cursor-pointer gap-2" onClick={() => void save()}>
              <Save className="size-4" /> Guardar en mi Pokédex
            </Button>
          </motion.div>
        )}
      </div>

      {/* -------- Saved dex -------- */}
      <aside className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold">Mi Pokédex</h3>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
            {creations?.length ?? 0}
          </span>
        </div>

        {creations === undefined && (
          <div className="flex items-center gap-2 rounded-xl border border-border/70 p-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Cargando…
          </div>
        )}

        {creations?.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
            Aún no guardas Pokémon.
            <br />
            Construye uno y guárdalo aquí.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {(creations ?? []).map((c) => {
            const p = c.payload as ConstructedPokemon | undefined;
            return (
              <div
                key={c._id}
                className="group relative overflow-hidden rounded-xl border border-border/70 bg-card p-3 text-left"
              >
                <button
                  type="button"
                  className="w-full cursor-pointer"
                  onClick={() => p && setCurrent(p)}
                  title="Ver ficha completa"
                >
                  <img
                    src={c.sprite || c.artwork}
                    alt={c.displayName}
                    loading="lazy"
                    className="mx-auto h-16 w-16 object-contain"
                  />
                  <p className="mt-1 truncate text-sm font-semibold">{c.displayName}</p>
                  <p className="text-[11px] text-muted-foreground">Nv. {c.level}</p>
                  <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                    {c.types.map((t) => (
                      <TypeBadge key={t} type={t} className="px-1.5 py-0 text-[9px]" />
                    ))}
                  </div>
                  {c.shiny && (
                    <Sparkles className="absolute top-2 left-2 size-3.5 text-amber-500" />
                  )}
                  {c.isSynthetic && (
                    <span className="absolute top-1.5 right-2 rounded bg-primary/10 px-1 text-[9px] font-bold text-primary">
                      FUSIÓN
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  aria-label="Eliminar"
                  className="absolute right-1.5 bottom-1.5 cursor-pointer rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  onClick={() => void remove(c._id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
