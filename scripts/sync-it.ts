import { createClient } from '@supabase/supabase-js';
import { pullAll, pushItem, pushOutfit, pushLog, pushProfile, pushTagGroup, remoteIsEmpty, remoteId, type LocalView } from '../src/data/syncRemote';
// Keys come from the environment only. Run: npm run test:sync  (PHOTO=1 also exercises photo upload)
const url = process.env.SUPABASE_URL!, anon = process.env.SUPABASE_ANON_KEY!, svc = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !anon || !svc) throw new Error('Set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY');
const admin = createClient(url, svc);
const mk = async (n: string) => {
  const email = `${n}-${Date.now()}@sync.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: 'pw-123456!', email_confirm: true });
  if (error) throw error;
  const c = createClient(url, anon);
  const r = await c.auth.signInWithPassword({ email, password: 'pw-123456!' });
  if (r.error) throw r.error;
  return { c: c as any, uid: data.user!.id };
};
const assert = (ok: boolean, m: string) => { if (!ok) throw new Error('FAIL ' + m); console.log('ok', m); };
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
(async () => {
  const A = await mk('a'), B = await mk('b');
  const v: LocalView = {
    items: [{ id: 'legacy-1', name: 'Tee', category: 'Tops', color: 'Black', tags: ['x'], bgHue: 30, wearCount: 0, favorite: true, createdAt: '2026-01-02', ...(process.env.PHOTO ? { photoUri: png } : {}) }],
    outfits: [{ id: 'o-legacy', name: 'Fit', tags: ['work'], itemIds: ['legacy-1'], wearCount: 0, createdAt: '2026-01-03' }],
    log: { '2026-02-01': ['o-legacy'] }, tagGroups: [{ name: 'Mood', hue: 5, tags: ['calm'] }],
    settings: { appearance: 'dark', units: 'F', morningSuggestion: false, morningTime: '08:00', skipRecentDays: 3, useDeviceLocation: false },
    profileName: 'Ann', memberSince: '2025-05-05', onboarded: true, photoMeta: {},
  };
  assert(await remoteIsEmpty(A.c), 'account starts empty');
  const run = async () => {
    await pushProfile(A.c, A.uid, v); await pushTagGroup(A.c, A.uid, 'Mood', v);
    const r = await pushItem(A.c, A.uid, 'legacy-1', v); if (r.error) throw r.error; v.photoMeta['legacy-1'] = r.photoMeta!;
    await pushOutfit(A.c, A.uid, 'o-legacy', v); await pushLog(A.c, A.uid, '2026-02-01', 'o-legacy', v);
  };
  await run(); await run(); // migration twice => no duplicates
  const snap = await pullAll(A.c, A.uid, { items: v.items, photoMeta: v.photoMeta }, { settings: v.settings, tagGroups: [{ name: 'Occasion', hue: 1, tags: ['d'] }, { name: 'Mood', hue: 2, tags: [] }] });
  assert(snap.items.length === 1 && snap.outfits.length === 1, 'no duplicates after double upload');
  assert(snap.items[0].id === remoteId(A.uid, 'legacy-1') && snap.outfits[0].itemIds[0] === snap.items[0].id, 'ids mapped, outfit link kept');
  assert(snap.items[0].wearCount === 1 && snap.items[0].lastWorn === '2026-02-01' && snap.outfits[0].wearCount === 1, 'wear counts derived');
  assert(snap.profileName === 'Ann' && snap.memberSince === '2025-05-05' && snap.settings.units === 'F' && snap.onboarded, 'profile + settings');
  assert(snap.tagGroups.find(g => g.name === 'Mood')!.tags[0] === 'calm', 'tag groups');
  if (process.env.PHOTO) {
    const path = Object.values(snap.photoMeta)[0].photo!.path;
    assert(path.startsWith(A.uid + '/'), 'photo under {user_id}/ : ' + path);
    const res = await fetch(snap.items[0].photoUri!); assert(res.ok && (await res.arrayBuffer()).byteLength > 0, 'signed url renders');
    const fresh = await pullAll(A.c, A.uid, { items: [], photoMeta: {} }, { settings: v.settings, tagGroups: [] });
    assert(fresh.items.length === 1 && !!fresh.items[0].photoUri, 'fresh device sees data+photo');
  }
  // unlog + delete
  v.log = {}; await pushLog(A.c, A.uid, '2026-02-01', 'o-legacy', v);
  v.items = []; await pushItem(A.c, A.uid, 'legacy-1', v);
  const after = await pullAll(A.c, A.uid, { items: [], photoMeta: {} }, { settings: v.settings, tagGroups: [] });
  assert(after.items.length === 0 && Object.keys(after.log).length === 0 && after.outfits[0].itemIds.length === 0, 'unlog/delete propagate');
  // user B sees nothing
  assert(await remoteIsEmpty(B.c), 'user B sees none of A data');
  const bs = await pullAll(B.c, B.uid, { items: [], photoMeta: {} }, { settings: v.settings, tagGroups: [] });
  assert(bs.items.length === 0 && bs.outfits.length === 0 && bs.profileName === '', 'B pull empty');
  await admin.auth.admin.deleteUser(A.uid); await admin.auth.admin.deleteUser(B.uid);
  console.log('ALL PASSED');
})().catch((e) => { console.error(e); process.exit(1); });
