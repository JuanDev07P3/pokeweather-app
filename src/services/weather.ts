/**
 * Weather service — Open-Meteo (https://open-meteo.com)
 *
 * Free, no API key, CORS enabled. Two endpoints:
 *  1. Geocoding  → https://geocoding-api.open-meteo.com/v1/search?name=Madrid
 *  2. Forecast   → https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..
 *
 * This maps 1:1 to a Flutter WeatherApi service (dio + json_serializable).
 */

import { getJson } from "./http";

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export interface GeoPlace {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  countryCode?: string;
  admin1?: string;
  timezone?: string;
  population?: number;
}

interface GeoResponse {
  results?: GeoPlace[];
}

interface ForecastResponse {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
  };
}

export interface DailyForecast {
  date: string;
  code: number;
  max: number;
  min: number;
  rainProb: number;
}

export interface CurrentWeather {
  time: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  isDay: boolean;
  code: number;
  description: string;
  icon: string;
  emoji: string;
}

export interface WeatherBundle {
  place: GeoPlace;
  timezone: string;
  sunrise: string;
  sunset: string;
  current: CurrentWeather;
  daily: DailyForecast[];
}

/** WMO weather interpretation codes (WW) used by Open-Meteo. */
export const WMO: Record<number, { label: string; icon: string; emoji: string }> = {
  0: { label: "Cielo despejado", icon: "sun", emoji: "☀️" },
  1: { label: "Mayormente despejado", icon: "sun", emoji: "🌤️" },
  2: { label: "Parcialmente nublado", icon: "cloud-sun", emoji: "⛅" },
  3: { label: "Nublado", icon: "cloud", emoji: "☁️" },
  45: { label: "Niebla", icon: "cloud-fog", emoji: "🌫️" },
  48: { label: "Niebla con escarcha", icon: "cloud-fog", emoji: "🌫️" },
  51: { label: "Llovizna ligera", icon: "cloud-drizzle", emoji: "🌦️" },
  53: { label: "Llovizna moderada", icon: "cloud-drizzle", emoji: "🌦️" },
  55: { label: "Llovizna intensa", icon: "cloud-drizzle", emoji: "🌧️" },
  56: { label: "Llovizna helada", icon: "cloud-drizzle", emoji: "🌧️" },
  57: { label: "Llovizna helada intensa", icon: "cloud-drizzle", emoji: "🌧️" },
  61: { label: "Lluvia ligera", icon: "cloud-rain", emoji: "🌦️" },
  63: { label: "Lluvia moderada", icon: "cloud-rain", emoji: "🌧️" },
  65: { label: "Lluvia fuerte", icon: "cloud-rain", emoji: "🌧️" },
  66: { label: "Lluvia helada", icon: "cloud-rain", emoji: "🌧️" },
  67: { label: "Lluvia helada fuerte", icon: "cloud-rain", emoji: "🌧️" },
  71: { label: "Nieve ligera", icon: "cloud-snow", emoji: "🌨️" },
  73: { label: "Nieve moderada", icon: "cloud-snow", emoji: "❄️" },
  75: { label: "Nieve intensa", icon: "cloud-snow", emoji: "❄️" },
  77: { label: "Granos de nieve", icon: "cloud-snow", emoji: "🌨️" },
  80: { label: "Chubascos ligeros", icon: "cloud-rain", emoji: "🌦️" },
  81: { label: "Chubascos moderados", icon: "cloud-rain", emoji: "🌧️" },
  82: { label: "Chubascos violentos", icon: "cloud-rain", emoji: "⛈️" },
  85: { label: "Chubascos de nieve", icon: "cloud-snow", emoji: "🌨️" },
  86: { label: "Chubascos de nieve fuertes", icon: "cloud-snow", emoji: "❄️" },
  95: { label: "Tormenta", icon: "cloud-lightning", emoji: "⛈️" },
  96: { label: "Tormenta con granizo", icon: "cloud-lightning", emoji: "⛈️" },
  99: { label: "Tormenta con granizo fuerte", icon: "cloud-lightning", emoji: "⛈️" },
};

export function describeCode(code: number) {
  return WMO[code] ?? { label: `Código ${code}`, icon: "cloud", emoji: "☁️" };
}

/** Search cities by name. Returns up to `count` results (defaults to 6). */
export async function searchPlaces(name: string, count = 6): Promise<GeoPlace[]> {
  const q = name.trim();
  if (!q) return [];
  const url = `${GEO_URL}?name=${encodeURIComponent(q)}&count=${count}&language=es&format=json`;
  const data = await getJson<GeoResponse>(url);
  return data.results ?? [];
}

/** Geocoding + forecast in one call. */
export async function fetchWeather(place: GeoPlace): Promise<WeatherBundle> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
    timezone: "auto",
    forecast_days: "7",
  });
  const data = await getJson<ForecastResponse>(`${FORECAST_URL}?${params}`);
  const c = data.current;
  const meta = describeCode(c.weather_code);
  return {
    place,
    timezone: data.timezone,
    sunrise: data.daily.sunrise?.[0] ?? "",
    sunset: data.daily.sunset?.[0] ?? "",
    current: {
      time: c.time,
      temp: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      wind: c.wind_speed_10m,
      isDay: c.is_day === 1,
      code: c.weather_code,
      description: meta.label,
      icon: meta.icon,
      emoji: meta.emoji,
    },
    daily: data.daily.time.map((date, i) => ({
      date,
      code: data.daily.weather_code[i],
      max: data.daily.temperature_2m_max[i],
      min: data.daily.temperature_2m_min[i],
      rainProb: data.daily.precipitation_probability_max[i] ?? 0,
    })),
  };
}

export const QUICK_CITIES: GeoPlace[] = [
  { id: 3117735, name: "Madrid", latitude: 40.4165, longitude: -3.70256, country: "España", countryCode: "ES" },
  { id: 2643743, name: "London", latitude: 51.5085, longitude: -0.1257, country: "Reino Unido", countryCode: "GB" },
  { id: 5128581, name: "New York", latitude: 40.7143, longitude: -74.006, country: "Estados Unidos", countryCode: "US" },
  { id: 1850147, name: "Tokyo", latitude: 35.6895, longitude: 139.6917, country: "Japón", countryCode: "JP" },
  { id: 117661, name: "Ciudad de México", latitude: 19.4326, longitude: -99.1332, country: "México", countryCode: "MX" },
  { id: 3451190, name: "Buenos Aires", latitude: -34.6132, longitude: -58.3772, country: "Argentina", countryCode: "AR" },
  { id: 3688689, name: "Bogotá", latitude: 4.6097, longitude: -74.0817, country: "Colombia", countryCode: "CO" },
  { id: 3871336, name: "Santiago", latitude: -33.4569, longitude: -70.6483, country: "Chile", countryCode: "CL" },
];

export function formatPlace(p: GeoPlace): string {
  return [p.admin1, p.country].filter(Boolean).join(", ") || "";
}
