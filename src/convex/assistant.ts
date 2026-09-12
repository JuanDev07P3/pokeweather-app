"use node";

/**
 * Asistente Pokéclima — responde preguntas de clima y Pokémon en español.
 *
 * Flujo:
 *  1. Extrae de la pregunta la ciudad y/o el Pokémon mencionado (LLM, JSON estricto).
 *  2. Descarga datos EN VIVO de Open-Meteo y/o PokéAPI (el servidor tiene red completa).
 *  3. Pide al LLM la respuesta final en español usando esos datos reales.
 */

import axios from "axios";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { vly } from "../lib/vly-integrations";

const MODEL = "gpt-4o-mini";

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const POKE_BASE = "https://pokeapi.co/api/v2";

const WMO: Record<number, string> = {
  0: "cielo despejado", 1: "mayormente despejado", 2: "parcialmente nublado",
  3: "nublado", 45: "niebla", 48: "niebla con escarcha", 51: "llovizna ligera",
  53: "llovizna moderada", 55: "llovizna intensa", 61: "lluvia ligera",
  63: "lluvia moderada", 65: "lluvia fuerte", 66: "lluvia helada",
  67: "lluvia helada fuerte", 71: "nieve ligera", 73: "nieve moderada",
  75: "nieve intensa", 77: "granos de nieve", 80: "chubascos ligeros",
  81: "chubascos moderados", 82: "chubascos violentos", 85: "chubascos de nieve",
  86: "chubascos de nieve fuertes", 95: "tormenta", 96: "tormenta con granizo",
  99: "tormenta con granizo fuerte",
};

interface Extracted {
  city?: string;
  pokemon?: string;
}

/** Llama al LLM y devuelve el texto de la primera elección (o ""). */
async function llmText(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: { temperature: number; maxTokens: number },
): Promise<string> {
  const res = await vly.ai.completion({
    model: MODEL,
    messages,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
  });
  if (!res.success || !res.data) return "";
  return String(res.data.choices?.[0]?.message?.content ?? "").trim();
}

async function extract(question: string): Promise<Extracted> {
  try {
    const raw = await llmText(
      [
        {
          role: "system",
          content:
            'Devuelve SOLO un JSON con claves opcionales "city" y "pokemon". ' +
            'Detecta la ciudad mencionada en la pregunta y la especie Pokémon ' +
            '(normaliza el nombre al identificador de PokéAPI en inglés, p. ej. "pikachu"). ' +
            "Si no hay ninguna, devuelve {}.",
        },
        { role: "user", content: question },
      ],
      { temperature: 0, maxTokens: 60 },
    );
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) return {};
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Extracted;
    return {
      city: typeof parsed.city === "string" ? parsed.city.slice(0, 80) : undefined,
      pokemon: typeof parsed.pokemon === "string" ? parsed.pokemon.slice(0, 40) : undefined,
    };
  } catch {
    return {};
  }
}

async function fetchWeather(city: string): Promise<string> {
  const geo = await axios.get(GEO_URL, {
    params: { name: city, count: 1, language: "es", format: "json" },
    timeout: 8000,
  });
  const place = geo.data?.results?.[0];
  if (!place) return `No encontré la ciudad «${city}».`;
  const wx = await axios.get(FORECAST_URL, {
    params: {
      latitude: place.latitude,
      longitude: place.longitude,
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      timezone: "auto",
      forecast_days: "3",
    },
    timeout: 8000,
  });
  const c = wx.data.current;
  const d = wx.data.daily;
  const days = d.time
    .map(
      (t: string, i: number) =>
        `${t}: ${WMO[d.weather_code[i]] ?? d.weather_code[i]}, max ${Math.round(
          d.temperature_2m_max[i],
        )}°C, min ${Math.round(d.temperature_2m_min[i])}°C, lluvia ${
          d.precipitation_probability_max[i] ?? 0
        }%`,
    )
    .join(" | ");
  return (
    `Clima actual en ${place.name}${place.country ? `, ${place.country}` : ""}: ` +
    `${WMO[c.weather_code] ?? c.weather_code}, ${Math.round(c.temperature_2m)}°C ` +
    `(sensación ${Math.round(c.apparent_temperature)}°C), humedad ${c.relative_humidity_2m}%, ` +
    `viento ${Math.round(c.wind_speed_10m)} km/h. Pronóstico: ${days}`
  );
}

async function fetchPokemon(name: string): Promise<string> {
  const p = await axios.get(`${POKE_BASE}/pokemon/${name.toLowerCase().trim()}`, {
    timeout: 8000,
  });
  const data = p.data;
  const species = await axios
    .get(`${POKE_BASE}/pokemon-species/${data.id}`, { timeout: 8000 })
    .then(
      (
        r: {
          data: {
            flavor_text_entries: { flavor_text: string; language: { name: string } }[];
          };
        },
      ) => {
        const f =
          r.data.flavor_text_entries.find((x) => x.language.name === "es") ??
          r.data.flavor_text_entries.find((x) => x.language.name === "en");
        return f ? f.flavor_text.replace(/\s+/g, " ") : "";
      },
    )
    .catch(() => "");
  const stats = data.stats
    .map((s: { base_stat: number; stat: { name: string } }) => `${s.stat.name} ${s.base_stat}`)
    .join(", ");
  return (
    `#${data.id} ${data.name}: tipos ${data.types
      .map((t: { type: { name: string } }) => t.type.name)
      .join("/")}; altura ${(data.height / 10).toFixed(1)} m; peso ${(data.weight / 10).toFixed(
      1,
    )} kg; stats base: ${stats}. ${species}`.trim()
  );
}

export const ask = action({
  args: { question: v.string() },
  handler: async (_ctx, { question }) => {
    const q = question.trim();
    if (!q) throw new Error("Escribe una pregunta.");
    if (q.length > 400)
      throw new Error("La pregunta es demasiado larga (máx. 400 caracteres).");

    const wantsWeather =
      /clima|tiempo|lluvia|temperatura|calor|fr[íi]o|pron[óo]stico|llover|nev|humedad|viento/i.test(q);
    const wantsPokemon =
      /pok[eé]mon|pok[eé]dex|pikachu|evoluci|habilidad|movimiento|stats|combate|ataque|mide|pesa|tipo de/i.test(q);

    const facts: string[] = [];
    const extracted = await extract(q);

    const jobs: Promise<void>[] = [];
    if (extracted.city) {
      jobs.push(
        fetchWeather(extracted.city)
          .then((s) => {
            facts.push(s);
          })
          .catch(() => {
            facts.push(`No pude obtener el clima de «${extracted.city}».`);
          }),
      );
    }
    if (extracted.pokemon) {
      jobs.push(
        fetchPokemon(extracted.pokemon)
          .then((s) => {
            facts.push(s);
          })
          .catch(() => {
            facts.push(`No encontré el Pokémon «${extracted.pokemon}» en PokéAPI.`);
          }),
      );
    }
    await Promise.all(jobs);

    // Preguntas explícitas de clima sin ciudad detectada → Madrid por defecto
    if (!extracted.city && wantsWeather && !extracted.pokemon) {
      await fetchWeather("Madrid")
        .then((s) => {
          facts.push(s);
        })
        .catch(() => {
          facts.push("No pude obtener el clima ahora mismo.");
        });
    }

    if (!facts.length && !wantsWeather && !wantsPokemon) {
      return (
        "Soy el asistente de Pokéclima 🌤️🐾. Pregúntame por el clima de cualquier " +
        "ciudad («¿Qué tiempo hace en Lima?») o por un Pokémon («¿Cuánto mide Charizard?»)."
      );
    }

    try {
      const answer = await llmText(
        [
          {
            role: "system",
            content:
              "Eres el asistente de Pokéclima. Responde SIEMPRE en español, en 2-4 frases " +
              "claras y útiles. Usa EXCLUSIVAMENTE los datos en vivo que se te dan; no inventes " +
              "cifras. Si hay datos de clima, incluye temperatura y condición. Si hay datos de " +
              "Pokémon, incluye al menos un dato del texto de Pokédex.",
          },
          {
            role: "user",
            content: `Pregunta: ${q}\n\nDatos en vivo:\n${facts
              .map((f) => `- ${f}`)
              .join("\n")}`,
          },
        ],
        { temperature: 0.4, maxTokens: 220 },
      );
      if (answer) return answer;
      throw new Error("respuesta vacía");
    } catch {
      // Fallback: datos crudos en vivo, sin LLM
      return facts.join("\n\n");
    }
  },
});
