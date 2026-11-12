// Remote half of cloud sync: maps store entities to Supabase rows and back.
// No React Native imports, so it can be exercised from plain node against the dev DB.
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Json } from './database.types';
import type { Category, ColorName, Item, Outfit, Settings, Silhouette, TagGroup, TagGroupName, WearLog } from './types';

export type Client = SupabaseClient<Database>;
export const BUCKET = 'item-photos';
const SIGNED_URL_TTL = 60 * 60 * 24 * 7;
const TAG_GROUP_NAMES: TagGroupName[] = ['Occasion', 'Mood', 'Weather', 'Season'];

export type PhotoRef = { path: string; /** the local/cached uri this object was uploaded from or downloaded to */ src: string };
export type PhotoMeta = Record<string, { photo?: PhotoRef; original?: PhotoRef }>;

/** Everything the push side reads from the store. */
export type LocalView = {
  items: Item[];
  outfits: Outfit[];
  log: WearLog;
  tagGroups: TagGroup[];
  settings: Settings;
  profileName: string;
  memberSince: string;
  onboarded: boolean;
  photoMeta: PhotoMeta;
};

export type Snapshot = Omit<LocalView, 'photoMeta'> & { photoMeta: PhotoMeta; hasData: boolean; tagsEmpty: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: string) => UUID.test(s);

/** Four independent 32-bit hashes → a stable uuid-shaped id. */
function hashUuid(input: string): string {
  const out: string[] = [];
  for (let seed = 1; seed <= 4; seed++) {
    let h = 0x811c9dc5 ^ (seed * 0x9e3779b1);
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
      h ^= h >>> 15;
    }
    out.push((h >>> 0).toString(16).padStart(8, '0'));
  }
  const hex = out.join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/** Real uuids pass through; legacy local ids (not uuids) map deterministically, per user. */
export const remoteId = (uid: string, id: string) => (isUuid(id) ? id.toLowerCase() : hashUuid(`${uid}:${id}`));

export const newId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 3) | 8).toString(16);
  });

const isLocalUri = (u?: string) => !!u && !/^https?:/i.test(u);

/** Permanent failures (bad data, constraint) shouldn't be retried forever; network/auth ones should. */
export function isPermanent(e: unknown): boolean {
  const err = e as { code?: string; message?: string; status?: number } | null;
  if (!err) return false;
  if (typeof err.code === 'string' && err.code) return !err.code.startsWith('PGRST3') && !/jwt/i.test(err.message ?? '');
  if (typeof err.status === 'number') return err.status >= 400 && err.status < 500 && ![401, 408, 429].includes(err.status);
  return false;
}

function check<T extends { error: unknown }>(r: T): T {
  if (r.error) throw r.error;
  return r;
}

async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

export async function remoteIsEmpty(c: Client): Promise<boolean> {
  const counts = await Promise.all(
    (['items', 'outfits', 'wear_log'] as const).map(async (t) => check(await c.from(t).select('*', { count: 'exact', head: true })).count ?? 0),
  );
  return counts.every((n) => n === 0);
}

// ---------- pull ----------

export async function pullAll(
  c: Client,
  uid: string,
  prev: { items: Item[]; photoMeta: PhotoMeta },
  defaults: { settings: Settings; tagGroups: TagGroup[] },
): Promise<Snapshot> {
  const [profile, items, outfits, links, wear, groups] = await Promise.all([
    c.from('profiles').select('*').eq('user_id', uid).maybeSingle().then((r) => check(r).data),
    fetchAll((a, b) => c.from('items').select('*').order('created_at', { ascending: false }).order('id').range(a, b)),
    fetchAll((a, b) => c.from('outfits').select('*').order('created_at', { ascending: false }).order('id').range(a, b)),
    fetchAll((a, b) => c.from('outfit_items').select('outfit_id,item_id,position').order('outfit_id').order('position').range(a, b)),
    fetchAll((a, b) => c.from('wear_log').select('day,outfit_id').order('day').order('id').range(a, b)),
    c.from('tag_groups').select('*').then((r) => check(r).data ?? []),
  ]);

  // wear log + derived counts
  const log: WearLog = {};
  const outfitWear = new Map<string, { n: number; last?: string }>();
  for (const w of wear) {
    (log[w.day] ??= []).push(w.outfit_id);
    const o = outfitWear.get(w.outfit_id) ?? { n: 0 };
    o.n++;
    if (!o.last || o.last < w.day) o.last = w.day;
    outfitWear.set(w.outfit_id, o);
  }
  const itemIdsByOutfit = new Map<string, string[]>();
  for (const l of links) (itemIdsByOutfit.get(l.outfit_id) ?? itemIdsByOutfit.set(l.outfit_id, []).get(l.outfit_id)!).push(l.item_id);
  const itemWear = new Map<string, { n: number; last?: string }>();
  for (const [oid, w] of outfitWear) {
    for (const iid of itemIdsByOutfit.get(oid) ?? []) {
      const cur = itemWear.get(iid) ?? { n: 0 };
      cur.n += w.n;
      if (w.last && (!cur.last || cur.last < w.last)) cur.last = w.last;
      itemWear.set(iid, cur);
    }
  }

  // photos: reuse a local cache when it's the file we uploaded/downloaded, else sign a URL
  const prevByRid = new Map(prev.items.map((i) => [remoteId(uid, i.id), i]));
  const photoMeta: PhotoMeta = {};
  const toSign: string[] = [];
  const decided = new Map<string, { photoUri?: string; originalUri?: string }>();
  for (const r of items) {
    const old = prevByRid.get(r.id);
    const oldMeta = old ? prev.photoMeta[old.id] : undefined;
    const d: { photoUri?: string; originalUri?: string } = {};
    const meta: PhotoMeta[string] = {};
    for (const [kind, path, uriKey] of [
      ['photo', r.photo_path, 'photoUri'],
      ['original', r.original_path, 'originalUri'],
    ] as const) {
      if (!path) continue;
      const ref = oldMeta?.[kind];
      const cached = old?.[uriKey];
      if (ref && ref.path === path && cached && cached === ref.src && isLocalUri(cached)) {
        d[uriKey] = cached;
        meta[kind] = ref;
      } else {
        toSign.push(path);
        meta[kind] = { path, src: '' };
      }
    }
    decided.set(r.id, d);
    photoMeta[r.id] = meta;
  }
  const signed = new Map<string, string>();
  for (let i = 0; i < toSign.length; i += 100) {
    const { data } = await c.storage.from(BUCKET).createSignedUrls(toSign.slice(i, i + 100), SIGNED_URL_TTL);
    for (const s of data ?? []) if (s.path && s.signedUrl) signed.set(s.path, s.signedUrl);
  }

  const outItems: Item[] = items.map((r) => {
    const d = decided.get(r.id)!;
    const meta = photoMeta[r.id];
    for (const [kind, uriKey] of [['photo', 'photoUri'], ['original', 'originalUri']] as const) {
      const ref = meta[kind];
      if (ref && !d[uriKey]) {
        const url = signed.get(ref.path);
        if (url) {
          d[uriKey] = url;
          ref.src = url;
        } else delete meta[kind];
      }
    }
    const w = itemWear.get(r.id);
    return {
      id: r.id,
      name: r.name,
      category: r.category as Category,
      color: r.color as ColorName,
      tags: r.tags,
      photoUri: d.photoUri,
      originalUri: d.originalUri,
      silhouette: (r.silhouette as Silhouette | null) ?? undefined,
      bgHue: r.bg_hue,
      tileDelta: r.tile_delta ?? undefined,
      wearCount: w?.n ?? 0,
      lastWorn: w?.last,
      favorite: r.favorite,
      createdAt: r.created_at.slice(0, 10),
    };
  });

  const outOutfits: Outfit[] = outfits.map((r) => {
    const w = outfitWear.get(r.id);
    return {
      id: r.id,
      name: r.name,
      tags: r.tags,
      itemIds: itemIdsByOutfit.get(r.id) ?? [],
      note: r.note ?? undefined,
      wearCount: w?.n ?? 0,
      lastWorn: w?.last,
      createdAt: r.created_at.slice(0, 10),
      archived: r.archived || undefined,
    };
  });

  const byName = new Map(groups.map((g) => [g.name, g]));
  const tagGroups: TagGroup[] = defaults.tagGroups.map((d) => {
    const g = byName.get(d.name);
    return g ? { name: d.name, hue: g.hue, tags: g.tags } : d;
  });
  // Signup seeds four empty groups; the caller swaps in the app's starter tags for such accounts.
  const tagsEmpty = groups.every((g) => g.tags.length === 0);

  const { onboarded, ...settings } = (profile?.settings ?? {}) as Record<string, unknown>;
  const hasData = items.length > 0 || outfits.length > 0;
  return {
    items: outItems,
    outfits: outOutfits,
    log,
    tagGroups,
    settings: { ...defaults.settings, ...(settings as Partial<Settings>) },
    profileName: profile?.display_name ?? '',
    memberSince: profile?.member_since?.slice(0, 10) ?? '',
    onboarded: onboarded === true || hasData,
    photoMeta,
    hasData,
    tagsEmpty,
  };
}

// ---------- push ----------

export type PushResult = { photoMeta?: PhotoMeta[string] | null; error?: unknown };

const isoDate = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T00:00:00Z` : d);

async function upload(c: Client, uid: string, rid: string, kind: 'photo' | 'original', uri: string): Promise<PhotoRef> {
  const blob = await (await fetch(uri)).blob();
  const type = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : type === 'image/heic' ? 'heic' : 'jpg';
  const path = `${uid}/${rid}/${kind}-${Date.now()}.${ext}`;
  check(await c.storage.from(BUCKET).upload(path, await new Response(blob).arrayBuffer(), { contentType: type, upsert: false }));
  return { path, src: uri };
}

async function removeObjects(c: Client, paths: (string | undefined)[]) {
  const p = paths.filter((x): x is string => !!x);
  if (p.length) await c.storage.from(BUCKET).remove(p).catch(() => {});
}

export async function pushItem(c: Client, uid: string, id: string, v: LocalView): Promise<PushResult> {
  const rid = remoteId(uid, id);
  const item = v.items.find((x) => x.id === id);
  const meta = v.photoMeta[id];
  if (!item) {
    check(await c.from('items').delete().eq('id', rid));
    await removeObjects(c, [meta?.photo?.path, meta?.original?.path]);
    return { photoMeta: null };
  }
  if (item.deletedAt) return {}; // waiting out the undo window; the row is removed on finalize

  // Upload new local photos first so the row can carry their paths.
  const next: PhotoMeta[string] = { ...meta };
  let uploadError: unknown;
  const stale: (string | undefined)[] = [];
  for (const [kind, uri] of [['photo', item.photoUri], ['original', item.originalUri]] as const) {
    const ref = meta?.[kind];
    if (!uri) {
      if (ref) {
        stale.push(ref.path);
        delete next[kind];
      }
    } else if (isLocalUri(uri) && ref?.src !== uri) {
      try {
        next[kind] = await upload(c, uid, rid, kind, uri);
        stale.push(ref?.path);
      } catch (e) {
        uploadError = e;
      }
    }
  }
  check(
    await c.from('items').upsert({
      id: rid,
      user_id: uid,
      name: item.name.slice(0, 200) || 'Untitled',
      category: item.category,
      color: item.color,
      tags: item.tags,
      photo_path: next.photo?.path ?? null,
      original_path: next.original?.path ?? null,
      silhouette: (item.silhouette ?? null) as unknown as NonNullable<Json> | undefined,
      bg_hue: Math.round(item.bgHue),
      tile_delta: item.tileDelta ?? null,
      favorite: item.favorite,
      created_at: isoDate(item.createdAt),
    }),
  );
  await removeObjects(c, stale);
  if (uploadError) return { photoMeta: next, error: uploadError };
  return { photoMeta: next };
}

export async function pushOutfit(c: Client, uid: string, id: string, v: LocalView) {
  const rid = remoteId(uid, id);
  const o = v.outfits.find((x) => x.id === id);
  if (!o) {
    check(await c.from('outfits').delete().eq('id', rid));
    return;
  }
  check(
    await c.from('outfits').upsert({
      id: rid,
      user_id: uid,
      name: o.name.slice(0, 200) || 'Untitled outfit',
      tags: o.tags,
      note: o.note || null,
      archived: !!o.archived,
      created_at: isoDate(o.createdAt),
    }),
  );
  const live = new Map(v.items.filter((i) => !i.deletedAt).map((i) => [i.id, i]));
  const ids = [...new Set(o.itemIds.filter((x) => live.has(x)).map((x) => remoteId(uid, x)))];
  if (ids.length) {
    check(await c.from('outfit_items').upsert(ids.map((item_id, position) => ({ outfit_id: rid, item_id, user_id: uid, position }))));
    check(await c.from('outfit_items').delete().eq('outfit_id', rid).not('item_id', 'in', `(${ids.join(',')})`));
  } else {
    check(await c.from('outfit_items').delete().eq('outfit_id', rid));
  }
}

export async function pushLog(c: Client, uid: string, day: string, outfitId: string, v: LocalView) {
  const rid = remoteId(uid, outfitId);
  if ((v.log[day] ?? []).includes(outfitId)) {
    check(await c.from('wear_log').upsert({ user_id: uid, day, outfit_id: rid }, { onConflict: 'user_id,day,outfit_id', ignoreDuplicates: true }));
  } else {
    check(await c.from('wear_log').delete().eq('day', day).eq('outfit_id', rid));
  }
}

export async function pushTagGroup(c: Client, uid: string, name: TagGroupName, v: LocalView) {
  const g = v.tagGroups.find((x) => x.name === name);
  if (!g || !TAG_GROUP_NAMES.includes(name)) return;
  check(await c.from('tag_groups').upsert({ user_id: uid, name, hue: Math.round(g.hue), tags: g.tags }, { onConflict: 'user_id,name' }));
}

export async function pushProfile(c: Client, uid: string, v: LocalView) {
  check(
    await c.from('profiles').update({
      display_name: v.profileName.slice(0, 200),
      member_since: isoDate(v.memberSince),
      settings: { ...v.settings, onboarded: v.onboarded } as unknown as NonNullable<Json>,
    }).eq('user_id', uid),
  );
}
