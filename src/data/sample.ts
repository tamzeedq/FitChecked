// Sample closet from the design reference (`IT`, `OUT`, `ITAGS`, `LOG`), with dates made
// relative to today. Loaded by "Explore a sample closet" during onboarding.
import { daysAgoKey } from '@/lib/dates';
import type { Item, Outfit, TagGroup, WearLog } from './types';

export const DEFAULT_TAG_GROUPS: TagGroup[] = [
  { name: 'Occasion', hue: 255, tags: ['work', 'casual', 'date night', 'formal', 'workout', 'travel', 'party'] },
  { name: 'Mood', hue: 340, tags: ['confident', 'cozy', 'relaxed', 'bold', 'minimal', 'playful'] },
  { name: 'Weather', hue: 220, tags: ['hot', 'warm', 'mild', 'cool', 'cold', 'rain', 'snow', 'wind'] },
  { name: 'Season', hue: 70, tags: ['spring', 'summer', 'fall', 'winter'] },
];

type S = Omit<Item, 'id' | 'favorite' | 'lastWorn' | 'createdAt'> & { last: number; added: number };

const ITEMS: Record<string, S> = {
  sweater: { name: 'Cream knit sweater', category: 'Tops', color: 'Cream', silhouette: { shape: 'sweater', l: 0.94, c: 0.035, h: 85 }, bgHue: 30, tileDelta: -0.05, tags: ['cozy', 'casual', 'cool', 'fall', 'winter'], wearCount: 14, last: 9, added: 69 },
  jeans: { name: 'Dark wash straight jeans', category: 'Bottoms', color: 'Navy', silhouette: { shape: 'jeans', l: 0.4, c: 0.07, h: 258 }, bgHue: 80, tileDelta: 0.02, tags: ['casual', 'work', 'mild', 'cool'], wearCount: 31, last: 2, added: 231 },
  jacket: { name: 'Olive rain jacket', category: 'Outerwear', color: 'Olive', silhouette: { shape: 'jacket', l: 0.55, c: 0.07, h: 125 }, bgHue: 220, tileDelta: 0, tags: ['casual', 'rain', 'wind', 'fall'], wearCount: 9, last: 9, added: 22 },
  sneakers: { name: 'White leather sneakers', category: 'Shoes', color: 'White', silhouette: { shape: 'sneakers', l: 0.98, c: 0.006, h: 95 }, bgHue: 250, tileDelta: -0.07, tags: ['casual', 'travel', 'mild', 'warm'], wearCount: 40, last: 1, added: 274 },
  tee: { name: 'Navy breton tee', category: 'Tops', color: 'Navy', silhouette: { shape: 'tee', l: 0.38, c: 0.09, h: 262 }, bgHue: 90, tileDelta: 0.02, tags: ['casual', 'minimal', 'mild', 'spring'], wearCount: 12, last: 3, added: 166 },
  boots: { name: 'Black chelsea boots', category: 'Shoes', color: 'Black', silhouette: { shape: 'boots', l: 0.26, c: 0.01, h: 40 }, bgHue: 60, tileDelta: 0.03, tags: ['work', 'date night', 'cold', 'fall', 'winter'], wearCount: 18, last: 6, added: 352 },
  coat: { name: 'Camel wool coat', category: 'Outerwear', color: 'Camel', silhouette: { shape: 'coat', l: 0.68, c: 0.09, h: 65 }, bgHue: 200, tileDelta: 0.01, tags: ['work', 'minimal', 'cold', 'winter'], wearCount: 7, last: 4, added: 19 },
  skirt: { name: 'Rust pleated midi skirt', category: 'Bottoms', color: 'Rust', silhouette: { shape: 'skirt', l: 0.56, c: 0.12, h: 40 }, bgHue: 150, tileDelta: 0.01, tags: ['date night', 'relaxed', 'cool', 'fall'], wearCount: 5, last: 6, added: 41 },
  scarf: { name: 'Grey wool scarf', category: 'Accessories', color: 'Grey', silhouette: { shape: 'scarf', l: 0.66, c: 0.012, h: 250 }, bgHue: 40, tileDelta: 0.02, tags: ['cozy', 'cold', 'wind', 'winter'], wearCount: 11, last: 7, added: 310 },
};

const OUTFITS: Record<string, { name: string; tags: string[]; items: string[]; worn: number; last: number }> = {
  o1: { name: 'Rainy-day layers', tags: ['casual', 'rain', 'cozy'], items: ['jacket', 'sweater', 'sneakers', 'jeans'], worn: 6, last: 1 },
  o2: { name: 'Camel & stripes', tags: ['work', 'cool'], items: ['coat', 'tee', 'boots', 'jeans'], worn: 4, last: 2 },
  o3: { name: 'Soft rust', tags: ['casual', 'relaxed', 'cool'], items: ['scarf', 'sweater', 'boots', 'skirt'], worn: 5, last: 3 },
  o4: { name: 'Office layers', tags: ['work', 'rain', 'minimal', 'cool'], items: ['coat', 'sweater', 'boots', 'jeans'], worn: 4, last: 6 },
  o5: { name: 'Dinner at Ava’s', tags: ['date night', 'relaxed'], items: ['scarf', 'tee', 'boots', 'skirt'], worn: 1, last: 6 },
  o6: { name: 'Weekend errands', tags: ['casual', 'mild'], items: ['tee', 'jeans', 'sneakers', 'scarf'], worn: 3, last: 11 },
  o7: { name: 'Gallery Sunday', tags: ['casual', 'date night', 'minimal', 'cool'], items: ['coat', 'tee', 'boots', 'skirt'], worn: 2, last: 25 },
};

/** Days ago → outfits worn (from the reference's October log, with "today" = Oct 22). */
const LOG: Record<number, string[]> = {
  21: ['o1'], 20: ['o2'], 19: ['o3'], 17: ['o4'], 16: ['o1'], 15: ['o2'], 14: ['o3'], 13: ['o4'], 12: ['o3'],
  10: ['o2'], 9: ['o1'], 8: ['o4'], 7: ['o3'], 6: ['o4', 'o5'], 4: ['o1'], 3: ['o3'], 2: ['o2'], 1: ['o1'],
};

export function buildSampleCloset(): { items: Item[]; outfits: Outfit[]; log: WearLog; name: string } {
  const items: Item[] = Object.entries(ITEMS).map(([id, { last, added, ...rest }]) => ({
    ...rest,
    id: `sample-${id}`,
    favorite: false,
    lastWorn: daysAgoKey(last),
    createdAt: daysAgoKey(added),
  }));
  const outfits: Outfit[] = Object.entries(OUTFITS).map(([id, o], i) => ({
    id: `sample-${id}`,
    name: o.name,
    tags: o.tags,
    itemIds: o.items.map((x) => `sample-${x}`),
    wearCount: o.worn,
    lastWorn: daysAgoKey(o.last),
    createdAt: daysAgoKey(60 - i),
  }));
  const log: WearLog = {};
  for (const [ago, ids] of Object.entries(LOG)) log[daysAgoKey(Number(ago))] = ids.map((x) => `sample-${x}`);
  return { items, outfits, log, name: 'Maya' };
}
