// Weather and city search via Open-Meteo (no API key needed).
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';

import { useStore } from '@/data/store';
import type { Place, Units } from '@/data/types';

export type Weather = {
  /** Celsius */
  temp: number;
  high: number;
  low: number;
  code: number;
  wind: number;
  condition: string;
  icon: string;
  rain: boolean;
  snow: boolean;
  /** e.g. "Rain until 3 PM" / "Dry all day" */
  outlook: string;
  latitude: number;
  fetchedAt: number;
};

export type WeatherStatus = 'idle' | 'loading' | 'ok' | 'offline';

function describe(code: number): { condition: string; icon: string; rain: boolean; snow: boolean } {
  if (code === 0) return { condition: 'Sunny', icon: 'sunny', rain: false, snow: false };
  if (code <= 2) return { condition: 'Partly cloudy', icon: 'partly_cloudy_day', rain: false, snow: false };
  if (code === 3) return { condition: 'Cloudy', icon: 'cloud', rain: false, snow: false };
  if (code === 45 || code === 48) return { condition: 'Fog', icon: 'foggy', rain: false, snow: false };
  if (code >= 51 && code <= 57) return { condition: 'Light rain', icon: 'rainy', rain: true, snow: false };
  if (code >= 61 && code <= 67) return { condition: code === 61 ? 'Light rain' : 'Rain', icon: 'rainy', rain: true, snow: false };
  if (code >= 71 && code <= 77) return { condition: 'Snow', icon: 'ac_unit', rain: false, snow: true };
  if (code >= 80 && code <= 82) return { condition: 'Showers', icon: 'rainy', rain: true, snow: false };
  if (code >= 85 && code <= 86) return { condition: 'Snow showers', icon: 'ac_unit', rain: false, snow: true };
  return { condition: 'Thunderstorms', icon: 'thunderstorm', rain: true, snow: false };
}

function hourLabel(iso: string) {
  const h = new Date(iso).getHours();
  const suffix = h < 12 ? 'AM' : 'PM';
  return `${h % 12 || 12} ${suffix}`;
}

export async function fetchWeather(lat: number, lon: number): Promise<Weather> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&current=temperature_2m,weather_code,wind_speed_10m&hourly=precipitation&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather ${res.status}`);
  const j = await res.json();
  const d = describe(j.current.weather_code);

  // Find when the current wet spell ends today.
  const now = Date.now();
  const times: string[] = j.hourly.time;
  const precip: number[] = j.hourly.precipitation;
  const from = Math.max(0, times.findIndex((x) => new Date(x).getTime() >= now - 3600000));
  let outlook = 'Dry all day';
  if (precip.slice(from).some((p) => p > 0.05)) {
    let end = from;
    while (end < precip.length && precip[end] > 0.05) end++;
    outlook = precip[from] > 0.05 ? (end >= precip.length ? 'Rain all day' : `Rain until ${hourLabel(times[end])}`) : `Rain from ${hourLabel(times[precip.findIndex((p, i) => i >= from && p > 0.05)])}`;
  } else if (d.snow) outlook = 'Snow today';

  return {
    temp: j.current.temperature_2m,
    high: j.daily.temperature_2m_max[0],
    low: j.daily.temperature_2m_min[0],
    code: j.current.weather_code,
    wind: j.current.wind_speed_10m,
    ...d,
    outlook,
    latitude: lat,
    fetchedAt: Date.now(),
  };
}

export async function searchCities(q: string): Promise<Place[]> {
  if (q.trim().length < 2) return [];
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=6&language=en&format=json`);
  if (!res.ok) throw new Error(`Geocoding ${res.status}`);
  const j = await res.json();
  return (j.results ?? []).map((r: { name: string; admin1?: string; country?: string; latitude: number; longitude: number }) => ({
    name: r.name,
    region: [r.admin1, r.country].filter(Boolean).join(', '),
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

/** Resolves the device's position into a Place (asks for permission first). */
export async function placeFromDevice(): Promise<Place | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
  const { latitude, longitude } = pos.coords;
  let name = 'Current location';
  let region = '';
  try {
    const [g] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (g) {
      name = g.city ?? g.subregion ?? name;
      region = [g.region, g.country].filter(Boolean).join(', ');
    }
  } catch {
    // Reverse geocoding is best-effort.
  }
  return { name, region, latitude, longitude };
}

export function formatTemp(c: number, units: Units) {
  return `${Math.round(units === 'F' ? (c * 9) / 5 + 32 : c)}°`;
}

// Shared across screens so Home and Recommendations don't fetch twice.
const useWeatherCache = create<{ weather: Weather | null; status: WeatherStatus; key: string }>(() => ({ weather: null, status: 'idle', key: '' }));

const STALE_MS = 30 * 60 * 1000;

export function useWeather() {
  const place = useStore((s) => s.settings.place);
  const { weather, status, key } = useWeatherCache();
  const placeKey = place ? `${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}` : '';

  const load = useCallback(async () => {
    if (!place) return;
    useWeatherCache.setState({ status: 'loading' });
    try {
      const w = await fetchWeather(place.latitude, place.longitude);
      useWeatherCache.setState({ weather: w, status: 'ok', key: placeKey });
    } catch {
      useWeatherCache.setState({ status: 'offline' });
    }
  }, [place, placeKey]);

  useEffect(() => {
    const fresh = weather && key === placeKey && Date.now() - weather.fetchedAt < STALE_MS;
    if (place && !fresh && status !== 'loading') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeKey]);

  const usable = weather && key === placeKey ? weather : null;
  return { weather: status === 'offline' ? null : usable, status: place ? status : 'offline', retry: load, place } as const;
}

export function useCitySearch(q: string) {
  const [results, setResults] = useState<Place[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    const id = setTimeout(() => {
      searchCities(q)
        .then((r) => live && (setResults(r), setError(false)))
        .catch(() => live && setError(true));
    }, 250);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [q]);
  return { results, error };
}
