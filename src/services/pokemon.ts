/**
 * Pokémon service — PokéAPI (https://pokeapi.co)
 *
 * Free, no key, CORS enabled. This file contains:
 *  1. `PokemonApi`         → tiny multi-endpoint client over pokeapi.co
 *  2. `PokemonConstructor` → fluent Builder that queries several Pokémon
 *                            endpoints, applies modifiers, and synthesizes
 *                            brand-new Pokémon (random, hybrid, custom).
 *
 * Port to Dart 1:1: PokemonApi → dio client; PokemonConstructor →
 * a Dart class with chainable methods returning `Future<PokemonData>`.
 */

import { getJson, ApiError } from "./http";

const BASE = "https://pokeapi.co/api/v2";
const SPRITES =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface NamedRef {
  name: string;
  url: string;
}

export interface PokemonData {
  id: number;
  name: string;
  height: number; // decimetres
  weight: number; // hectograms
  baseExp: number;
  types: string[];
  abilities: { name: string; hidden: boolean }[];
  stats: { name: string; base: number }[];
  sprite: string;
  artwork: string;
  cry?: string;
  isSynthetic?: boolean;
  sourceNote?: string;
  flavor?: string;
  genus?: string;
}

export interface PokemonMove {
  name: string;
  accuracy: number | null;
  power: number | null;
  pp: number | null;
  type: string;
  damageClass: "physical" | "special" | "status";
}

export type ConstructorSource =
  | "id"
  | "name"
  | "type"
  | "ability"
  | "generation"
  | "random"
  | "hybrid";

export interface ConstructedPokemon extends PokemonData {
  /** Chosen by the Constructor, not present on real API data. */
  nickname?: string;
  level: number;
  shiny: boolean;
  ivs: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  moves: PokemonMove[];
}

interface SpeciesInfo {
  flavor?: string;
  genus?: string;
}

/* ------------------------------------------------------------------ */
/* The API client                                                      */
/* ------------------------------------------------------------------ */

export class PokemonApi {
  private cache = new Map<string, unknown>();

  private async fetchEndpoint<T>(path: string): Promise<T> {
    if (this.cache.has(path)) return this.cache.get(path) as T;
    const data = await getJson<T>(`${BASE}${path}`);
    this.cache.set(path, data);
    return data;
  }

  /** GET /pokemon/{name|id} */
  async getPokemon(query: string | number): Promise<PokemonData> {
    const raw = await this.fetchEndpoint<Record<string, unknown>>(
      `/pokemon/${String(query).toLowerCase().trim()}`,
    );
    return this.mapPokemon(raw);
  }

  /** GET /type/{name} */
  async getByType(type: string): Promise<PokemonData[]> {
    const raw = await this.fetchEndpoint<{ pokemon: { pokemon: NamedRef }[] }>(
      `/type/${type.toLowerCase().trim()}`,
    );
    return Promise.all(raw.pokemon.slice(0, 24).map((e) => this.getPokemon(e.pokemon.name)));
  }

  /** GET /ability/{name} */
  async getByAbility(ability: string): Promise<PokemonData[]> {
    const raw = await this.fetchEndpoint<{ pokemon: { pokemon: NamedRef }[] }>(
      `/ability/${ability.toLowerCase().trim()}`,
    );
    return Promise.all(raw.pokemon.slice(0, 24).map((e) => this.getPokemon(e.pokemon.name)));
  }

  /** GET /generation/{id} */
  async getByGeneration(gen: number): Promise<PokemonData[]> {
    const raw = await this.fetchEndpoint<{ pokemon_species: NamedRef[] }>(
      `/generation/${gen}`,
    );
    const picks = raw.pokemon_species.slice(0, 24);
    return Promise.all(picks.map((s) => this.getPokemon(s.name)));
  }

  /** GET /pokemon-species/{id} — flavor text + genus, best-effort. */
  async getSpecies(idOrName: number | string): Promise<SpeciesInfo> {
    const raw = await this.fetchEndpoint<{
      flavor_text_entries: { flavor_text: string; language: { name: string } }[];
      genera: { genus: string; language: { name: string } }[];
    }>(`/pokemon-species/${idOrName}`);
    const flavor =
      raw.flavor_text_entries.find((f) => f.language.name === "es") ??
      raw.flavor_text_entries.find((f) => f.language.name === "en");
    const genus =
      raw.genera.find((g) => g.language.name === "es") ??
      raw.genera.find((g) => g.language.name === "en");
    return {
      flavor: flavor?.flavor_text.replace(/\s+/g, " ").replace(/\f/g, " "),
      genus: genus?.genus,
    };
  }

  /** GET /move/{name} — move details used by the Constructor. */
  async getMove(name: string): Promise<PokemonMove> {
    const raw = await this.fetchEndpoint<{
      name: string;
      type: { name: string };
      damage_class: { name: "physical" | "special" | "status" };
      power: number | null;
      accuracy: number | null;
      pp: number | null;
    }>(`/move/${name}`);
    return {
      name: raw.name,
      accuracy: raw.accuracy,
      power: raw.power,
      pp: raw.pp,
      type: raw.type.name,
      damageClass: raw.damage_class.name,
    };
  }

  /** GET /pokemon?limit=1025 — the full Pokédex index. */
  async getAllNames(limit = 1025): Promise<NamedRef[]> {
    const raw = await this.fetchEndpoint<{ results: NamedRef[] }>(
      `/pokemon?limit=${limit}`,
    );
    return raw.results;
  }

  /** GET /pokemon/{id} — moves section (learnset) used by the Constructor. */
  async getLearnset(
    idOrName: number | string,
  ): Promise<
    { move: NamedRef; version_group_details: { level_learned_at: number }[] }[]
  > {
    const raw = await this.fetchEndpoint<{
      moves: { move: NamedRef; version_group_details: { level_learned_at: number }[] }[];
    }>(`/pokemon/${idOrName}`);
    return raw.moves;
  }

  private mapPokemon(raw: Record<string, unknown>): PokemonData {
    const types = raw.types as { slot: number; type: NamedRef }[];
    const abilities = raw.abilities as { ability: NamedRef; is_hidden: boolean }[];
    const stats = raw.stats as { base_stat: number; stat: NamedRef }[];
    const sprites = raw.sprites as Record<string, unknown>;
    const cries = raw.cries as Record<string, string> | null;
    const id = raw.id as number;
    return {
      id,
      name: raw.name as string,
      height: raw.height as number,
      weight: raw.weight as number,
      baseExp: raw.base_experience as number,
      types: types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
      abilities: abilities.map((a) => ({ name: a.ability.name, hidden: a.is_hidden })),
      stats: stats.map((s) => ({ name: s.stat.name, base: s.base_stat })),
      sprite: (sprites.front_default as string) ?? "",
      artwork: `${SPRITES}/other/official-artwork/${id}.png`,
      cry: cries?.latest,
    };
  }
}

/* ------------------------------------------------------------------ */
/* The Constructor (Builder)                                           */
/* ------------------------------------------------------------------ */

/**
 * Fluent builder:
 *
 *   const poke = await new PokemonConstructor(api)
 *     .name("charizard").level(72).shiny()
 *     .withMoves(["flamethrower", "dragon-claw"])
 *     .build();
 *
 *   const raid = await new PokemonConstructor(api)
 *     .type("water").minStat("hp", 100).shiny().random()
 *     .build();
 *
 *   const fusion = await new PokemonConstructor(api)
 *     .hybrid("gengar", "alakazam")
 *     .withMoves(["shadow-ball", "psychic"])
 *     .build();
 */
export class PokemonConstructor {
  private api: PokemonApi;
  private _source: ConstructorSource = "name";
  private _query: string | number = "";
  private _secondary = "";
  private _type = "";
  private _ability = "";
  private _generation = 0;
  private _minStat?: { stat: string; value: number };
  private _level = 50;
  private _shiny = false;
  private _nickname?: string;
  private _moveNames: string[] = [];

  constructor(api: PokemonApi) {
    this.api = api;
  }

  /* ---- source selection ---- */
  name(n: string) { this._source = "name"; this._query = n; return this; }
  id(n: number) { this._source = "id"; this._query = n; return this; }
  type(t: string) { this._source = "type"; this._type = t; return this; }
  ability(a: string) { this._source = "ability"; this._ability = a; return this; }
  generation(g: number) { this._source = "generation"; this._generation = g; return this; }
  random() { this._source = "random"; return this; }
  hybrid(a: string, b: string) { this._source = "hybrid"; this._query = a; this._secondary = b; return this; }

  /* ---- modifiers ---- */
  level(l: number) { this._level = Math.min(100, Math.max(1, Math.round(l))); return this; }
  shiny() { this._shiny = true; return this; }
  nickname(n: string) { this._nickname = n.trim() || undefined; return this; }
  withMoves(names: string[]) {
    this._moveNames = names.map((m) => m.toLowerCase().trim()).filter(Boolean);
    return this;
  }
  minStat(stat: string, value: number) { this._minStat = { stat, value }; return this; }

  /* ---- execution ---- */

  async build(): Promise<ConstructedPokemon> {
    const base = await this.resolveBase();
    const moves = await this.resolveMoves(base);
    const species = await this.api
      .getSpecies(base.isSynthetic ? String(base.name) : base.id)
      .catch(() => ({}) as SpeciesInfo);

    const shiny = this._shiny;
    return {
      ...base,
      sprite: shiny && !base.isSynthetic
        ? `${SPRITES}/shiny/${base.id}.png`
        : base.sprite,
      artwork: shiny && !base.isSynthetic
        ? `${SPRITES}/other/official-artwork/shiny/${base.id}.png`
        : base.artwork,
      ivs: rollIvs(),
      level: this._level,
      shiny,
      nickname: this._nickname,
      moves,
      flavor: base.flavor ?? species.flavor,
      genus: base.genus ?? species.genus,
      sourceNote: base.sourceNote ?? this.describeSource(),
    };
  }

  private async resolveBase(): Promise<PokemonData> {
    switch (this._source) {
      case "id":
        return this.api.getPokemon(this._query as number);
      case "name":
        return this.api.getPokemon(this._query as string);
      case "random": {
        const list = await this.api.getAllNames();
        const pick = list[Math.floor(Math.random() * list.length)];
        return this.applyStatFilter(() => this.api.getPokemon(pick.name));
      }
      case "type":
        return this.applyStatFilter(async () => {
          const list = await this.api.getByType(this._type);
          if (!list.length)
            throw new ApiError(`Tipo «${this._type}» sin resultados`, 404, this._type);
          return list[Math.floor(Math.random() * list.length)];
        });
      case "ability":
        return this.applyStatFilter(async () => {
          const list = await this.api.getByAbility(this._ability);
          if (!list.length)
            throw new ApiError(`Habilidad «${this._ability}» sin resultados`, 404, this._ability);
          return list[Math.floor(Math.random() * list.length)];
        });
      case "generation":
        return this.applyStatFilter(async () => {
          const list = await this.api.getByGeneration(this._generation);
          if (!list.length)
            throw new ApiError(`Generación ${this._generation} sin resultados`, 404, String(this._generation));
          return list[Math.floor(Math.random() * list.length)];
        });
      case "hybrid":
        return this.buildHybrid();
    }
  }

  /** Re-rolls until minStat is satisfied (max 12 tries). */
  private async applyStatFilter(
    produce: () => Promise<PokemonData>,
  ): Promise<PokemonData> {
    if (!this._minStat) return produce();
    const min = this._minStat;
    for (let i = 0; i < 12; i++) {
      const p = await produce();
      const stat = p.stats.find((s) => s.name === min.stat);
      if (stat && stat.base >= min.value) return p;
    }
    throw new ApiError(
      `Ningún resultado alcanzó ${min.stat} ≥ ${min.value} en 12 intentos.`,
      422,
      "minStat",
    );
  }

  /** Merges two Pokémon into one synthetic creature. */
  private async buildHybrid(): Promise<PokemonData> {
    const a = await this.api.getPokemon(this._query as string);
    const b = await this.api.getPokemon(this._secondary);
    const pick = <T,>(x: T, y: T) => (Math.random() < 0.5 ? x : y);

    const statNames = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
    const mergedStats = statNames.map((name) => {
      const sa = a.stats.find((s) => s.name === name)?.base ?? 0;
      const sb = b.stats.find((s) => s.name === name)?.base ?? 0;
      // blend both bases, capped at 255 like the games
      return { name, base: Math.min(255, Math.round((sa + sb) / 2 + (Math.random() * 20 - 10))) };
    });

    const secondaryTypes = Math.random() < 0.5 ? a.types.slice(1) : b.types.slice(1);
    const types = Array.from(new Set([pick(a.types[0], b.types[0]), ...secondaryTypes])).slice(0, 2);
    const abilities = [pick(a.abilities[0], b.abilities[0])].filter(Boolean);
    const [speciesA, speciesB] = await Promise.all([
      this.api.getSpecies(a.id).catch(() => ({}) as SpeciesInfo),
      this.api.getSpecies(b.id).catch(() => ({}) as SpeciesInfo),
    ]);

    return {
      id: a.id * 10000 + b.id, // synthetic id namespace
      name: `${a.name.slice(0, Math.max(3, Math.ceil(a.name.length / 2)))}${b.name.slice(Math.floor(b.name.length / 2))}`,
      height: Math.round((a.height + b.height) / 2),
      weight: Math.round((a.weight + b.weight) / 2),
      baseExp: Math.round((a.baseExp + b.baseExp) / 2),
      types,
      abilities: abilities.map((x) => ({ name: x.name, hidden: false })),
      stats: mergedStats,
      sprite: b.sprite,
      artwork: b.artwork,
      cry: a.cry ?? b.cry,
      isSynthetic: true,
      sourceNote: `Híbrido ${a.name} + ${b.name}`,
      flavor: speciesA.flavor ?? speciesB.flavor,
      genus: pick(speciesA.genus ?? "Pokémon", speciesB.genus ?? "Pokémon"),
    };
  }

  /** Resolves requested move names through /move/{name}; falls back to the Pokémon's real learnset. */
  private async resolveMoves(base: PokemonData): Promise<PokemonMove[]> {
    if (this._moveNames.length) {
      const moves = await Promise.all(
        this._moveNames.map((m) => this.api.getMove(m).catch(() => null)),
      );
      const ok = moves.filter(Boolean) as PokemonMove[];
      if (ok.length) return ok.slice(0, 4);
    }
    return this.fallbackMoves(base);
  }

  private async fallbackMoves(base: PokemonData): Promise<PokemonMove[]> {
    const moves = await this.api.getLearnset(base.id).catch(() => []);
    if (!moves.length) return [];
    const ranked = [...moves].sort(
      (x, y) =>
        Math.max(...y.version_group_details.map((d) => d.level_learned_at)) -
        Math.max(...x.version_group_details.map((d) => d.level_learned_at)),
    );
    const picks = ranked
      .filter((m) => !["transform", "struggle"].includes(m.move.name))
      .slice(0, 4);
    return Promise.all(picks.map((m) => this.api.getMove(m.move.name)));
  }

  private describeSource(): string {
    switch (this._source) {
      case "name": return `Consultado por nombre: ${this._query}`;
      case "id": return `Consultado por ID #${this._query}`;
      case "type": return `Aleatorio de tipo ${this._type}`;
      case "ability": return `Aleatorio con habilidad ${this._ability}`;
      case "generation": return `Aleatorio de generación ${this._generation}`;
      case "random": return "Aleatorio de la Pokédex completa";
      case "hybrid": return `Híbrido ${this._query} + ${this._secondary}`;
    }
  }
}

function rollIvs() {
  const r = () => 1 + Math.floor(Math.random() * 31);
  return { hp: r(), atk: r(), def: r(), spa: r(), spd: r(), spe: r() };
}

/* ------------------------------------------------------------------ */
/* Helpers used by the UI                                              */
/* ------------------------------------------------------------------ */

export const TYPE_COLORS: Record<string, string> = {
  normal: "#9FA19F", fire: "#E62829", water: "#2980EF", electric: "#FAC000",
  grass: "#3FA129", ice: "#3DCEF3", fighting: "#FF8000", poison: "#9141CB",
  ground: "#915121", flying: "#81B9EF", psychic: "#EF4179", bug: "#91A119",
  rock: "#AFA981", ghost: "#704170", dragon: "#5060E1", dark: "#624D4E",
  steel: "#60A1B8", fairy: "#EF70EF", stellar: "#40B5A5", unknown: "#68A090",
};

export const TYPE_NAMES: Record<string, string> = {
  normal: "Normal", fire: "Fuego", water: "Agua", electric: "Eléctrico",
  grass: "Planta", ice: "Hielo", fighting: "Lucha", poison: "Veneno",
  ground: "Tierra", flying: "Volador", psychic: "Psíquico", bug: "Bicho",
  rock: "Roca", ghost: "Fantasma", dragon: "Dragón", dark: "Siniestro",
  steel: "Acero", fairy: "Hada", stellar: "Estelar", unknown: "Desconocido",
};

export const STAT_NAMES: Record<string, string> = {
  hp: "PS", attack: "Ataque", defense: "Defensa",
  "special-attack": "At. Esp.", "special-defense": "Def. Esp.", speed: "Velocidad",
};

export function typeColor(t: string): string {
  return TYPE_COLORS[t] ?? "#68A090";
}

export function typeLabel(t: string): string {
  return TYPE_NAMES[t] ?? t;
}
