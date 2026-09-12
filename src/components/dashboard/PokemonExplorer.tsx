import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PokemonCard } from "@/components/pokemon/PokemonCard";
import {
  TYPE_NAMES,
  PokemonApi,
  PokemonConstructor,
  type ConstructedPokemon,
} from "@/services/pokemon";
import { Loader2, Search } from "lucide-react";

const api = new PokemonApi();

const ABILITIES = [
  "intimidate", "levitate", "speed-boost", "drizzle", "drought", "multiscale",
  "prankster", "regenerator", "huge-power", "magic-bounce", "gale-wings",
];

export function PokemonExplorer() {
  const [name, setName] = useState("");
  const [result, setResult] = useState<ConstructedPokemon | null>(null);
  const [loading, setLoading] = useState(false);

  const build = async (fn: () => Promise<ConstructedPokemon>) => {
    setLoading(true);
    setResult(null);
    try {
      const data = await fn();
      setResult(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error de red";
      toast.error("PokéAPI no respondió", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const doSearch = (raw: string) => {
    const q = raw.trim().toLowerCase();
    if (!q) return;
    const ctor = new PokemonConstructor(api).level(50);
    if (/^\d+$/.test(q)) {
      const n = Number.parseInt(q, 10);
      void build(() => ctor.id(n).build());
    } else {
      void build(() => ctor.name(q).build());
    }
  };

  const randomByType = (t: string) => {
    void build(() => new PokemonConstructor(api).type(t).level(50).build());
  };

  const randomByAbility = (a: string) => {
    void build(() => new PokemonConstructor(api).ability(a).level(50).build());
  };

  const randomByGen = (g: string) => {
    void build(() => new PokemonConstructor(api).generation(Number(g)).level(50).build());
  };

  const fullyRandom = () => {
    void build(() => new PokemonConstructor(api).random().level(50).build());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
                doSearch(name);
              }
            }}
            placeholder="Nombre o número (pikachu, 25, gengar…)"
            className="pl-9"
          />
        </div>
        <Button
          className="cursor-pointer gap-2"
          disabled={loading || !name.trim()}
          onClick={() => doSearch(name)}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Consultar
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Aleatorio por tipo</p>
          <Select onValueChange={randomByType}>
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Elige tipo" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_NAMES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Por habilidad</p>
          <Select onValueChange={randomByAbility}>
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Elige habilidad" />
            </SelectTrigger>
            <SelectContent>
              {ABILITIES.map((a) => (
                <SelectItem key={a} value={a}>
                  {a.replace(/-/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Por generación</p>
          <Select onValueChange={randomByGen}>
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Elige generación" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((g) => (
                <SelectItem key={g} value={String(g)}>Generación {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full cursor-pointer"
        disabled={loading}
        onClick={fullyRandom}
      >
        🎲 Sorpréndeme — Pokémon aleatorio
      </Button>

      {loading && (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border/70 text-muted-foreground">
          <span className="flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" /> Consultando PokéAPI…
          </span>
        </div>
      )}

      {result && (
        <div className="grid gap-4 lg:grid-cols-2">
          <PokemonCard data={result} />
        </div>
      )}
    </div>
  );
}
