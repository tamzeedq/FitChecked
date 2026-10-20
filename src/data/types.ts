export const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'] as const;
export type Category = (typeof CATEGORIES)[number];

export const COLORS = [
  ['Black', '#1d1c1a'],
  ['White', '#f7f5f0'],
  ['Cream', '#ece3cf'],
  ['Grey', '#9a9a98'],
  ['Navy', '#2c3a5c'],
  ['Olive', '#6b7048'],
  ['Camel', '#b8895a'],
  ['Rust', '#a5502f'],
] as const;
export type ColorName = (typeof COLORS)[number][0];

export type ShapeKey = 'jacket' | 'sweater' | 'tee' | 'coat' | 'jeans' | 'skirt' | 'sneakers' | 'boots' | 'scarf';

/** Flat placeholder silhouette, used by the sample closet in place of a photo. */
export type Silhouette = { shape: ShapeKey; l: number; c: number; h: number };

export type Item = {
  id: string;
  name: string;
  category: Category;
  color: ColorName;
  tags: string[];
  /** Background-removed photo, when processing succeeded. */
  photoUri?: string;
  /** Original photo, always kept on the device. */
  originalUri?: string;
  silhouette?: Silhouette;
  /** Hue of the tinted tile behind the garment. */
  bgHue: number;
  /** Small per-item lightness offset for the tile. */
  tileDelta?: number;
  wearCount: number;
  /** YYYY-MM-DD */
  lastWorn?: string;
  favorite: boolean;
  createdAt: string;
  /** Set during the undo window of a soft delete. */
  deletedAt?: number;
};

export type Outfit = {
  id: string;
  name: string;
  tags: string[];
  itemIds: string[];
  note?: string;
  wearCount: number;
  lastWorn?: string;
  createdAt: string;
  /** Deleted, but kept so logged days still show it. */
  archived?: boolean;
};

export type TagGroupName = 'Occasion' | 'Mood' | 'Weather' | 'Season';
export type TagGroup = { name: TagGroupName; hue: number; tags: string[] };

/** YYYY-MM-DD → outfit ids worn that day (more than one allowed). */
export type WearLog = Record<string, string[]>;

export type Appearance = 'system' | 'light' | 'dark';
export type Units = 'C' | 'F';

export type Place = { name: string; region: string; latitude: number; longitude: number };

export type Settings = {
  appearance: Appearance;
  units: Units;
  morningSuggestion: boolean;
  morningTime: string; // HH:mm
  skipRecentDays: number;
  useDeviceLocation: boolean;
  place?: Place;
};
