// Cloud sync. The zustand store stays the UI's source of truth; this module
//  - diffs every store change into a persisted set of "dirty" entity keys,
//  - flushes those keys to Supabase (retrying while offline),
//  - pulls the account's data on sign-in and clears local data on sign-out.
// Keys are idempotent ("push whatever the store holds for item X now"), so retries and
// coalescing are safe. Sync follows useAuth's user, so there is no second auth listener.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { AppState, Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { DEFAULT_TAG_GROUPS } from './sample';
import { useStore } from './store';
import {
  isPermanent,
  pullAll,
  pushItem,
  pushLog,
  pushOutfit,
  pushProfile,
  pushTagGroup,
  remoteId,
  remoteIsEmpty,
  type Client,
  type LocalView,
} from './syncRemote';
import type { Item, Outfit, TagGroup, TagGroupName } from './types';

type Store = ReturnType<typeof useStore.getState>;
type Meta = { owner: string | null; dirty: string[] };
type AuthLike = {
  getState: () => { user: { id: string } | null; initialized: boolean };
  subscribe: (l: (s: { user: { id: string } | null; initialized: boolean }) => void) => () => void;
};

const META_KEY = 'fitchecked-sync';
const RETRY_MS = 15000;
const client = supabase as unknown as Client;

let meta: Meta = { owner: null, dirty: [] };
let uid: string | null = null; // user whose data the store holds and whose changes are tracked
let suppress = 0;
let flushing: Promise<boolean> | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let chain: Promise<unknown> = Promise.resolve();
const dirty = new Set<string>();

const quiet = <T>(fn: () => T): T => {
  suppress++;
  try {
    return fn();
  } finally {
    suppress--;
  }
};

const persistMeta = () => {
  meta.dirty = [...dirty];
  AsyncStorage.setItem(META_KEY, JSON.stringify(meta)).catch(() => {});
};

const view = (s: Store): LocalView => ({
  items: s.items,
  outfits: s.outfits,
  log: s.log,
  tagGroups: s.tagGroups,
  settings: s.settings,
  profileName: s.profileName,
  memberSince: s.memberSince,
  onboarded: s.onboarded,
  photoMeta: s.photoMeta,
});

// ---------- diffing ----------

const sameArr = (a: unknown[], b: unknown[]) => a === b || (a.length === b.length && a.every((x, i) => x === b[i]));

const itemChanged = (a: Item, b: Item) =>
  a.name !== b.name || a.category !== b.category || a.color !== b.color || !sameArr(a.tags, b.tags) || a.photoUri !== b.photoUri ||
  a.originalUri !== b.originalUri || a.silhouette !== b.silhouette || a.bgHue !== b.bgHue || a.tileDelta !== b.tileDelta ||
  a.favorite !== b.favorite || a.createdAt !== b.createdAt;

const outfitChanged = (a: Outfit, b: Outfit) =>
  a.name !== b.name || a.note !== b.note || !!a.archived !== !!b.archived || !sameArr(a.tags, b.tags) || !sameArr(a.itemIds, b.itemIds);

function diffKeys(n: Store, p: Store): string[] {
  const keys: string[] = [];
  if (n.items !== p.items) {
    const prev = new Map(p.items.map((x) => [x.id, x]));
    const seen = new Set<string>();
    for (const x of n.items) {
      seen.add(x.id);
      const o = prev.get(x.id);
      if (!o || itemChanged(o, x)) keys.push(`item:${x.id}`);
    }
    for (const id of prev.keys()) if (!seen.has(id)) keys.push(`item:${id}`);
  }
  if (n.outfits !== p.outfits) {
    const prev = new Map(p.outfits.map((x) => [x.id, x]));
    const seen = new Set<string>();
    for (const x of n.outfits) {
      seen.add(x.id);
      const o = prev.get(x.id);
      if (!o || outfitChanged(o, x)) keys.push(`outfit:${x.id}`);
    }
    for (const id of prev.keys()) if (!seen.has(id)) keys.push(`outfit:${id}`);
  }
  if (n.log !== p.log) {
    for (const day of new Set([...Object.keys(n.log), ...Object.keys(p.log)])) {
      const a = n.log[day] ?? [];
      const b = p.log[day] ?? [];
      if (a === b) continue;
      for (const id of a) if (!b.includes(id)) keys.push(`log:${day}|${id}`);
      for (const id of b) if (!a.includes(id)) keys.push(`log:${day}|${id}`);
    }
  }
  if (n.tagGroups !== p.tagGroups) {
    for (const g of n.tagGroups) {
      const o = p.tagGroups.find((x) => x.name === g.name);
      if (!o || o.hue !== g.hue || !sameArr(o.tags, g.tags)) keys.push(`tag:${g.name}`);
    }
  }
  if (n.profileName !== p.profileName || n.memberSince !== p.memberSince || n.settings !== p.settings || n.onboarded !== p.onboarded) keys.push('profile');
  return keys;
}

function allKeys(s: Store): string[] {
  const keys = ['profile', ...s.tagGroups.map((g) => `tag:${g.name}`), ...s.items.map((i) => `item:${i.id}`), ...s.outfits.map((o) => `outfit:${o.id}`)];
  for (const [day, ids] of Object.entries(s.log)) for (const id of ids) keys.push(`log:${day}|${id}`);
  return keys;
}

function mark(keys: string[]) {
  if (!keys.length) return;
  keys.forEach((k) => dirty.add(k));
  persistMeta();
}

// ---------- flushing ----------

const ORDER: Record<string, number> = { profile: 0, tag: 1, item: 2, outfit: 3, log: 4 };

function weight(key: string, s: Store): number {
  const [type, rest] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
  const present =
    type === 'item' ? s.items.some((x) => x.id === rest)
    : type === 'outfit' ? s.outfits.some((x) => x.id === rest)
    : type === 'log' ? (s.log[rest.split('|')[0]] ?? []).includes(rest.split('|')[1])
    : true;
  return present ? ORDER[type] : 20 - ORDER[type]; // upserts parents-first, deletes children-first
}

async function pushKey(user: string, key: string): Promise<void> {
  const s = useStore.getState();
  const v = view(s);
  const type = key.slice(0, key.indexOf(':') === -1 ? undefined : key.indexOf(':'));
  const rest = key.slice(type.length + 1);
  if (type === 'profile') return pushProfile(client, user, v);
  if (type === 'tag') return pushTagGroup(client, user, rest as TagGroupName, v);
  if (type === 'outfit') {
    await pushOutfit(client, user, rest, v);
    return;
  }
  if (type === 'log') {
    const [day, outfitId] = rest.split('|');
    await pushLog(client, user, day, outfitId, v);
    return;
  }
  if (type === 'item') {
    const res = await pushItem(client, user, rest, v);
    if (res.photoMeta !== undefined && uid === user) quiet(() => useStore.getState().setPhotoMeta(rest, res.photoMeta ?? null));
    if (res.error) throw res.error;
  }
}

async function drain(): Promise<boolean> {
  const user = uid;
  if (!user) return true;
  let ok = true;
  while (dirty.size && uid === user) {
    const s = useStore.getState();
    const keys = [...dirty].sort((a, b) => weight(a, s) - weight(b, s));
    let progressed = false;
    for (const key of keys) {
      if (uid !== user) return false;
      dirty.delete(key);
      try {
        await pushKey(user, key);
        progressed = true;
      } catch (e) {
        if (isPermanent(e)) {
          console.warn(`[sync] dropping ${key}:`, (e as { message?: string }).message);
          progressed = true;
        } else {
          dirty.add(key);
          ok = false;
        }
      }
    }
    persistMeta();
    if (!ok || !progressed) break;
  }
  if (dirty.size) scheduleRetry();
  return ok && dirty.size === 0;
}

function flush(): Promise<boolean> {
  if (!flushing) flushing = drain().finally(() => (flushing = null));
  return flushing;
}

function scheduleRetry(ms = RETRY_MS) {
  clearTimeout(timer);
  timer = setTimeout(() => void flush(), ms);
}

/** Best-effort push of everything pending (used just before sign-out, while the session is still valid). */
export async function flushPending(timeoutMs = 8000): Promise<void> {
  if (!uid || !dirty.size) return;
  await Promise.race([flush(), new Promise((r) => setTimeout(r, timeoutMs))]).catch(() => {});
}

// ---------- sign-in / sign-out ----------

async function cachePhotos(user: string) {
  if (Platform.OS === 'web') return;
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true });
  for (const item of useStore.getState().items) {
    for (const [kind, key] of [['photo', 'photoUri'], ['original', 'originalUri']] as const) {
      const ref = useStore.getState().photoMeta[item.id]?.[kind];
      const url = item[key];
      if (uid !== user || !ref || !url || !/^https?:/i.test(url) || ref.src !== url) continue;
      try {
        const ext = ref.path.split('.').pop() ?? 'jpg';
        const file = await File.downloadFileAsync(url, new File(dir, `${remoteId(user, item.id)}-${kind}.${ext}`));
        const st = useStore.getState();
        const cur = st.items.find((x) => x.id === item.id);
        if (uid !== user || !cur || cur[key] !== url) continue;
        quiet(() => {
          st.updateItem(item.id, { [key]: file.uri });
          st.setPhotoMeta(item.id, { ...st.photoMeta[item.id], [kind]: { path: ref.path, src: file.uri } });
        });
      } catch {
        // keep the signed URL
      }
    }
  }
}

/** Replaces local data with the server's, once nothing is waiting to be pushed. Returns false when it couldn't. */
async function pull(user: string): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (!(await flush())) return false;
    const s = useStore.getState();
    const snap = await pullAll(client, user, { items: s.items, photoMeta: s.photoMeta }, { settings: s.settings, tagGroups: DEFAULT_TAG_GROUPS });
    if (uid !== user) return false;
    if (dirty.size) continue; // edited while fetching; push first, then fetch again
    s.finalizeDelete();
    const fresh = snap.tagsEmpty;
    quiet(() => {
      useStore.getState().applyRemote(fresh ? { ...snap, tagGroups: DEFAULT_TAG_GROUPS as TagGroup[] } : snap);
    });
    if (fresh) mark(DEFAULT_TAG_GROUPS.map((g) => `tag:${g.name}`)); // seed the starter tags on the server
    void flush();
    void cachePhotos(user);
    return true;
  }
  return false;
}

async function whenHydrated() {
  if (useStore.persist.hasHydrated()) return;
  await new Promise<void>((r) => {
    const off = useStore.persist.onFinishHydration(() => {
      off();
      r();
    });
  });
}

function clearLocal() {
  uid = null;
  clearTimeout(timer);
  dirty.clear();
  meta = { owner: null, dirty: [] };
  AsyncStorage.setItem(META_KEY, JSON.stringify(meta)).catch(() => {});
  quiet(() => useStore.getState().resetUserData());
}

async function signedIn(user: string): Promise<void> {
  await whenHydrated();
  const stored = await AsyncStorage.getItem(META_KEY).then((r) => (r ? (JSON.parse(r) as Meta) : null)).catch(() => null);
  if (stored) meta = stored;
  if (meta.owner && meta.owner !== user) clearLocal(); // another account's data is on this device
  dirty.clear();
  meta.dirty.forEach((k) => dirty.add(k));

  const s = useStore.getState();
  if (meta.owner === user) {
    uid = user;
    await pull(user).catch(() => scheduleRetry());
    return;
  }
  // First sign-in for the data on this device.
  try {
    const empty = await remoteIsEmpty(client);
    const local = s.items.length > 0 || s.outfits.length > 0 || Object.keys(s.log).length > 0;
    dirty.clear();
    meta = { owner: user, dirty: [] };
    uid = user;
    if (empty && local) mark(allKeys(s)); // one-time upload of the existing local closet
    else persistMeta();
    await pull(user);
  } catch {
    if (uid === user && meta.owner === user) scheduleRetry();
    else setTimeout(() => void (useAuthUser() === user && signedIn(user)), RETRY_MS);
  }
}

let currentUser: () => string | null = () => null;
const useAuthUser = () => currentUser();

/** Mount once (from the auth listener). Returns a cleanup function. */
export function startSync(auth: AuthLike): () => void {
  currentUser = () => auth.getState().user?.id ?? null;
  let last: string | null | undefined;

  const onAuth = ({ user, initialized }: { user: { id: string } | null; initialized: boolean }) => {
    if (!initialized) return;
    const id = user?.id ?? null;
    if (id === last) return;
    const prevId = last;
    last = id;
    chain = chain.then(async () => {
      if (id) return signedIn(id);
      await whenHydrated();
      const stored = meta.owner ?? (await AsyncStorage.getItem(META_KEY).then((r) => (r ? (JSON.parse(r) as Meta).owner : null)).catch(() => null));
      if (prevId || stored) clearLocal();
    });
  };
  const offAuth = auth.subscribe(onAuth);
  onAuth(auth.getState());

  const offStore = useStore.subscribe((n, p) => {
    if (suppress || !uid || meta.owner !== uid) return;
    const keys = diffKeys(n, p);
    if (!keys.length) return;
    mark(keys);
    scheduleRetry(600);
  });

  const wake = () => {
    if (uid && dirty.size) void flush();
  };
  const appSub = AppState.addEventListener('change', (st) => st === 'active' && wake());
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.addEventListener('online', wake);

  return () => {
    offAuth();
    offStore();
    appSub.remove();
    clearTimeout(timer);
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.removeEventListener('online', wake);
  };
}
