// Picks outfits for today from the weather, the occasion and recent wear.
import type { Item, Outfit, Units } from '@/data/types';
import { daysSince } from './dates';
import { formatTemp, type Weather } from './weather';

export type Recommendation = { outfit: Outfit; items: Item[]; reason: string; why: string; score: number };

export const OCCASIONS = ['Casual', 'Work', 'Date night'] as const;
export type Occasion = (typeof OCCASIONS)[number];

export function weatherTags(w: Weather): string[] {
  const t = w.temp;
  const tags = [t >= 27 ? 'hot' : t >= 20 ? 'warm' : t >= 14 ? 'mild' : t >= 7 ? 'cool' : 'cold'];
  if (w.rain) tags.push('rain');
  if (w.snow) tags.push('snow');
  if (w.wind >= 30) tags.push('wind');
  return tags;
}

export function seasonTag(date = new Date(), latitude = 45): string {
  const m = date.getMonth();
  const north = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter'][m];
  if (latitude >= 0) return north;
  return { winter: 'summer', summer: 'winter', spring: 'fall', fall: 'spring' }[north]!;
}

function lastWornText(o: Outfit) {
  if (!o.lastWorn) return 'not worn yet';
  const d = daysSince(o.lastWorn);
  if (d <= 0) return 'worn today';
  if (d === 1) return 'last worn yesterday';
  if (d >= 14) return `not worn in ${Math.floor(d / 7)} weeks`;
  return `last worn ${d} days ago`;
}

/** One-line reason for a specific outfit, e.g. "Olive rain jacket handles the rain". */
function pieceReason(items: Item[], wTags: string[], o: Outfit): string {
  const outer = items.find((x) => x.category === 'Outerwear');
  const top = items.find((x) => x.category === 'Tops');
  if (wTags.includes('rain') && outer?.tags.includes('rain')) return top ? `${outer.name} over the ${top.name.toLowerCase()}` : `${outer.name} handles the rain`;
  if (wTags.includes('rain') && outer) return `${outer.name} covers the commute`;
  if ((wTags.includes('cold') || wTags.includes('cool')) && items.some((x) => x.tags.includes('cozy'))) return `${items.find((x) => x.tags.includes('cozy'))!.name} keeps it warm`;
  if (wTags.includes('hot') || wTags.includes('warm')) return outer ? 'Layer comes off by noon' : 'Light pieces for a warm day';
  const d = o.lastWorn ? daysSince(o.lastWorn) : 99;
  return d >= 21 ? 'Not worn in a while' : `Different mix from ${d <= 7 ? 'this week' : 'last week'}`;
}

export function recommend(opts: {
  outfits: Outfit[];
  items: Map<string, Item>;
  weather: Weather | null;
  units: Units;
  occasion?: Occasion;
  skipRecentDays: number;
  exclude?: string[];
  latitude?: number;
}): Recommendation[] {
  const { weather, units, occasion, skipRecentDays } = opts;
  const wTags = weather ? weatherTags(weather) : [];
  const season = seasonTag(new Date(), weather?.latitude ?? opts.latitude);
  const occ = occasion?.toLowerCase();

  const scored = opts.outfits
    .filter((o) => !opts.exclude?.includes(o.id))
    .map((o) => {
      const items = o.itemIds.map((id) => opts.items.get(id)).filter((x): x is Item => !!x && !x.deletedAt);
      const tags = new Set([...o.tags, ...items.flatMap((x) => x.tags)]);
      let score = 0;
      for (const w of wTags) if (tags.has(w)) score += w === 'rain' || w === 'snow' ? 4 : 3;
      if (tags.has(season)) score += 2;
      if (occ) score += o.tags.includes(occ) ? 5 : tags.has(occ) ? 1 : -4;
      const since = o.lastWorn ? daysSince(o.lastWorn) : 60;
      score += Math.min(since, 30) / 6;
      if (since < skipRecentDays) score -= 10;
      if (!items.length) score -= 100;
      return { o, items, score, since };
    })
    .filter((x) => x.items.length)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ o, items, score }) => {
    const occasionText = (occ ?? (o.tags.find((x) => ['work', 'casual', 'date night'].includes(x)) ?? 'casual')) + ' day';
    const reason = weather
      ? `${weather.rain ? 'Rain' : weather.snow ? 'Snow' : weather.condition}, ${formatTemp(weather.temp, units)}${units}, ${occasionText} · ${lastWornText(o)}`
      : 'Weather unavailable, so this is based on the season and what you wore recently';
    return { outfit: o, items, score, reason, why: pieceReason(items, wTags, o) };
  });
}

/** Short subtitle for the small alternative cards on Home. */
export function shortWhy(r: Recommendation): string {
  const o = r.outfit;
  const parts: string[] = [];
  if (o.tags.includes('work')) parts.push('work-ready');
  else if (o.tags.includes('cozy')) parts.push('cozy');
  else if (o.tags[0]) parts.push(o.tags[0]);
  const d = o.lastWorn ? daysSince(o.lastWorn) : 99;
  parts.push(d >= 28 ? 'not worn this month' : d >= 7 ? 'not worn this week' : `worn ${d}d ago`);
  const s = parts.join(' · ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
