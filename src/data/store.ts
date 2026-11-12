import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { dateKey, todayKey } from '@/lib/dates';
import { buildSampleCloset, DEFAULT_TAG_GROUPS } from './sample';
import type { Category, ColorName, Item, Outfit, Settings, TagGroup, TagGroupName, WearLog } from './types';

export const UNDO_WINDOW_MS = 5000;

const TILE_HUES = [30, 80, 220, 250, 90, 60, 200, 150, 40, 120, 300, 180];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export type NewItem = {
  name: string;
  category: Category;
  color: ColorName;
  tags: string[];
  photoUri?: string;
  originalUri?: string;
};

export type OutfitDraft = {
  outfitId?: string;
  name: string;
  tags: string[];
  itemIds: string[];
  note: string;
};

/** Photo moving through camera → processing → add item. */
export type Capture = {
  originalUri: string;
  photoUri?: string;
  suggestion?: { category?: Category; color?: ColorName; tags?: string[] };
};

type State = {
  onboarded: boolean;
  profileName: string;
  memberSince: string;
  items: Item[];
  outfits: Outfit[];
  log: WearLog;
  tagGroups: TagGroup[];
  settings: Settings;
  recentSearches: string[];
  /** Item waiting out its undo window. */
  pendingDelete: string | null;

  // Not persisted
  draft: OutfitDraft;
  capture: Capture | null;
  dismissedRecs: { date: string; ids: string[] };
};

type Actions = {
  completeOnboarding: () => void;
  loadSampleCloset: () => void;
  setProfileName: (name: string) => void;

  addItem: (item: NewItem) => string;
  updateItem: (id: string, patch: Partial<Item>) => void;
  toggleFavorite: (id: string) => void;
  requestDelete: (id: string) => void;
  undoDelete: () => void;
  finalizeDelete: () => void;

  saveDraft: () => string;
  startDraft: (from?: Outfit | { itemIds: string[] }) => void;
  updateDraft: (patch: Partial<OutfitDraft>) => void;
  deleteOutfit: (id: string) => void;

  /** Adds outfits to a day's log and updates wear counts. */
  logOutfits: (day: string, outfitIds: string[]) => void;
  unlogOutfit: (day: string, outfitId: string) => void;
  /** Saves an unnamed outfit made from individual pieces and logs it. */
  logPieces: (day: string, itemIds: string[]) => void;

  addTag: (group: TagGroupName, tag: string) => void;
  deleteTag: (tag: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  addRecentSearch: (q: string) => void;
  setCapture: (c: Capture | null) => void;
  dismissRec: (outfitId: string) => void;
  resetDismissed: () => void;
};

const emptyDraft = (): OutfitDraft => ({ name: '', tags: [], itemIds: [], note: '' });

const defaultSettings: Settings = {
  appearance: 'system',
  units: 'C',
  morningSuggestion: true,
  morningTime: '07:00',
  skipRecentDays: 5,
  useDeviceLocation: false,
};

function bumpWear<T extends { id: string; wearCount: number; lastWorn?: string }>(list: T[], ids: Set<string>, day: string, by: 1 | -1) {
  return list.map((x) =>
    ids.has(x.id)
      ? { ...x, wearCount: Math.max(0, x.wearCount + by), lastWorn: by > 0 && (!x.lastWorn || x.lastWorn < day) ? day : x.lastWorn }
      : x,
  );
}

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      onboarded: false,
      profileName: '',
      memberSince: todayKey(),
      items: [],
      outfits: [],
      log: {},
      tagGroups: DEFAULT_TAG_GROUPS,
      settings: defaultSettings,
      recentSearches: [],
      pendingDelete: null,
      draft: emptyDraft(),
      capture: null,
      dismissedRecs: { date: todayKey(), ids: [] },

      completeOnboarding: () => set({ onboarded: true }),
      loadSampleCloset: () => {
        const s = buildSampleCloset();
        set({ items: s.items, outfits: s.outfits, log: s.log, profileName: get().profileName || s.name });
      },
      setProfileName: (profileName) => set({ profileName }),

      addItem: (data) => {
        const id = uid();
        const item: Item = {
          ...data,
          id,
          bgHue: TILE_HUES[get().items.length % TILE_HUES.length],
          wearCount: 0,
          favorite: false,
          createdAt: todayKey(),
        };
        set((s) => ({ items: [item, ...s.items] }));
        return id;
      },
      updateItem: (id, patch) => set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      toggleFavorite: (id) => set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, favorite: !x.favorite } : x)) })),

      requestDelete: (id) => {
        if (get().pendingDelete) get().finalizeDelete();
        set((s) => ({ pendingDelete: id, items: s.items.map((x) => (x.id === id ? { ...x, deletedAt: Date.now() } : x)) }));
      },
      undoDelete: () => {
        const id = get().pendingDelete;
        if (!id) return;
        set((s) => ({ pendingDelete: null, items: s.items.map((x) => (x.id === id ? { ...x, deletedAt: undefined } : x)) }));
      },
      finalizeDelete: () => {
        const id = get().pendingDelete;
        if (!id) return;
        // The item leaves its outfits; the wear log keeps outfit ids, so worn days stay.
        set((s) => ({
          pendingDelete: null,
          items: s.items.filter((x) => x.id !== id),
          outfits: s.outfits.map((o) => (o.itemIds.includes(id) ? { ...o, itemIds: o.itemIds.filter((x) => x !== id) } : o)),
        }));
      },

      startDraft: (from) => {
        if (from && 'id' in from) {
          set({ draft: { outfitId: from.id, name: from.name, tags: [...from.tags], itemIds: [...from.itemIds], note: from.note ?? '' } });
        } else {
          set({ draft: { ...emptyDraft(), itemIds: from?.itemIds ?? [] } });
        }
      },
      updateDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      saveDraft: () => {
        const { draft } = get();
        const name = draft.name.trim() || 'Untitled outfit';
        if (draft.outfitId) {
          const id = draft.outfitId;
          set((s) => ({
            outfits: s.outfits.map((o) => (o.id === id ? { ...o, name, tags: draft.tags, itemIds: draft.itemIds, note: draft.note } : o)),
            draft: emptyDraft(),
          }));
          return id;
        }
        const id = uid();
        const outfit: Outfit = { id, name, tags: draft.tags, itemIds: draft.itemIds, note: draft.note, wearCount: 0, createdAt: todayKey() };
        set((s) => ({ outfits: [outfit, ...s.outfits], draft: emptyDraft() }));
        return id;
      },
      deleteOutfit: (id) =>
        set((s) => {
          const logged = Object.values(s.log).some((ids) => ids.includes(id));
          return { outfits: logged ? s.outfits.map((o) => (o.id === id ? { ...o, archived: true } : o)) : s.outfits.filter((o) => o.id !== id) };
        }),

      logOutfits: (day, outfitIds) => {
        const existing = get().log[day] ?? [];
        const added = outfitIds.filter((x) => !existing.includes(x));
        if (!added.length) return;
        const outfitSet = new Set(added);
        const itemSet = new Set(get().outfits.filter((o) => outfitSet.has(o.id)).flatMap((o) => o.itemIds));
        set((s) => ({
          log: { ...s.log, [day]: [...existing, ...added] },
          outfits: bumpWear(s.outfits, outfitSet, day, 1),
          items: bumpWear(s.items, itemSet, day, 1),
        }));
      },
      unlogOutfit: (day, outfitId) => {
        const existing = get().log[day] ?? [];
        if (!existing.includes(outfitId)) return;
        const outfit = get().outfits.find((o) => o.id === outfitId);
        const itemSet = new Set(outfit?.itemIds ?? []);
        set((s) => {
          const next = { ...s.log, [day]: existing.filter((x) => x !== outfitId) };
          if (!next[day].length) delete next[day];
          return { log: next, outfits: bumpWear(s.outfits, new Set([outfitId]), day, -1), items: bumpWear(s.items, itemSet, day, -1) };
        });
      },
      logPieces: (day, itemIds) => {
        const id = uid();
        // Ad-hoc outfits stay out of the library but show on the calendar.
        const outfit: Outfit = { id, name: 'Outfit of the day', tags: [], itemIds, wearCount: 0, createdAt: todayKey(), archived: true };
        set((s) => ({ outfits: [outfit, ...s.outfits] }));
        get().logOutfits(day, [id]);
      },

      addTag: (group, tag) => {
        const t = tag.trim().toLowerCase();
        if (!t || get().tagGroups.some((g) => g.tags.includes(t))) return;
        set((s) => ({ tagGroups: s.tagGroups.map((g) => (g.name === group ? { ...g, tags: [...g.tags, t] } : g)) }));
      },
      deleteTag: (tag) =>
        set((s) => ({
          tagGroups: s.tagGroups.map((g) => ({ ...g, tags: g.tags.filter((x) => x !== tag) })),
          items: s.items.map((x) => (x.tags.includes(tag) ? { ...x, tags: x.tags.filter((t) => t !== tag) } : x)),
          outfits: s.outfits.map((o) => (o.tags.includes(tag) ? { ...o, tags: o.tags.filter((t) => t !== tag) } : o)),
        })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      addRecentSearch: (q) => {
        const t = q.trim().toLowerCase();
        if (!t) return;
        set((s) => ({ recentSearches: [t, ...s.recentSearches.filter((x) => x !== t)].slice(0, 6) }));
      },
      setCapture: (capture) => set({ capture }),
      dismissRec: (outfitId) => {
        const today = todayKey();
        set((s) => ({ dismissedRecs: { date: today, ids: s.dismissedRecs.date === today ? [...s.dismissedRecs.ids, outfitId] : [outfitId] } }));
      },
      resetDismissed: () => set({ dismissedRecs: { date: todayKey(), ids: [] } }),
    }),
    {
      name: 'fitchecked',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ draft, capture, dismissedRecs, ...rest }) =>
        Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as Partial<State>,
      onRehydrateStorage: () => (state) => {
        // An undo window can't outlive the app session.
        state?.finalizeDelete();
      },
    },
  ),
);

/** Outfits that haven't been deleted. */
export function useOutfits() {
  const outfits = useStore((s) => s.outfits);
  return useMemo(() => outfits.filter((o) => !o.archived), [outfits]);
}

/** Items not waiting out a delete. */
export function useItems() {
  const items = useStore((s) => s.items);
  return useMemo(() => items.filter((x) => !x.deletedAt), [items]);
}

export function itemMap(items: Item[]) {
  return new Map(items.map((x) => [x.id, x]));
}

export function isWornOn(log: WearLog, outfitId: string, day = dateKey(new Date())) {
  return (log[day] ?? []).includes(outfitId);
}

/** An outfit's live pieces, in order. */
export function outfitItems(o: Outfit | undefined, map: Map<string, Item>): Item[] {
  if (!o) return [];
  return o.itemIds.map((id) => map.get(id)).filter((x): x is Item => !!x && !x.deletedAt);
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
