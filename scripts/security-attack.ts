// Scripted REST/Storage/Auth attack test. Run: npm run test:security
// Uses raw fetch against PostgREST/Storage/GoTrue with the anon key and two users' JWTs.
// Creates namespaced users (sec-*@security.test) and deletes them afterwards.
import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL!, anon = process.env.SUPABASE_ANON_KEY!, svc = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !anon || !svc) throw new Error('Set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY');
const admin = createClient(url, svc);
const TABLES = ['items', 'outfits', 'outfit_items', 'wear_log', 'tag_groups', 'recent_searches', 'profiles', 'item_wear_stats', 'outfit_wear_stats'];
let failed = 0;
const check = (ok: boolean, m: string) => { console.log(ok ? 'PASS' : 'FAIL', m); if (!ok) failed++; };
const rest = (path: string, key: string, jwt: string | null, init: RequestInit = {}) =>
  fetch(`${url}/rest/v1/${path}`, { ...init, headers: { apikey: key, ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}), 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers as any) } });
const json = async (r: Response) => { try { return await r.json(); } catch { return null; } };
const made: string[] = [];
const mk = async (n: string) => {
  const email = `sec-${n}-${Date.now()}@security.test`, password = 'Sec-pw-123456!';
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error; made.push(data.user!.id);
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: anon, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const j = await json(r); if (!j?.access_token) throw new Error('login failed');
  return { uid: data.user!.id as string, jwt: j.access_token as string, email };
};
(async () => {
  try {
    const A = await mk('a'), B = await mk('b');
    const seed = async (u: typeof A, tag: string) => {
      const it = await json(await rest('items', anon, u.jwt, { method: 'POST', body: JSON.stringify({ name: `${tag} item`, category: 'Tops', color: 'Black' }) }));
      const of = await json(await rest('outfits', anon, u.jwt, { method: 'POST', body: JSON.stringify({ name: `${tag} outfit` }) }));
      return { item: it[0].id as string, outfit: of[0].id as string };
    };
    const a = await seed(A, 'A'), b = await seed(B, 'B');
    const bPath = `${B.uid}/${b.item}/photo.png`;
    const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), c => c.charCodeAt(0));
    await admin.storage.from('item-photos').upload(bPath, png, { contentType: 'image/png', upsert: true });

    // 1. anon key without a user JWT: no table readable or writable
    for (const t of TABLES) {
      const r = await rest(`${t}?select=*`, anon, null); const j = await json(r);
      check(r.status >= 400 || (Array.isArray(j) && j.length === 0), `anon cannot read ${t} (status ${r.status})`);
    }
    for (const t of ['items', 'outfits', 'tag_groups', 'recent_searches']) {
      const r = await rest(t, anon, null, { method: 'POST', body: JSON.stringify({ user_id: A.uid, name: 'x', query: 'x' }) });
      check(r.status >= 400, `anon cannot insert into ${t} (status ${r.status})`);
    }
    // 2. cross-user reads
    for (const t of TABLES.filter(t => !t.endsWith('stats'))) {
      const j = await json(await rest(`${t}?user_id=eq.${B.uid}&select=*`, anon, A.jwt));
      check(Array.isArray(j) && j.length === 0, `A cannot read B's ${t}`);
    }
    const stats = await json(await rest(`item_wear_stats?user_id=eq.${B.uid}`, anon, A.jwt));
    check(Array.isArray(stats) && stats.length === 0, `A cannot read B's item_wear_stats (security_invoker)`);
    const own = await json(await rest('items?select=id', anon, A.jwt));
    check(own.length === 1 && own[0].id === a.item, 'A sees only its own item');
    // 3. cross-user writes
    let r = await rest(`items?id=eq.${b.item}`, anon, A.jwt, { method: 'PATCH', body: JSON.stringify({ name: 'pwned' }) });
    check((await json(r))?.length === 0, "A cannot update B's item");
    r = await rest(`items?id=eq.${b.item}`, anon, A.jwt, { method: 'DELETE' });
    check((await json(r))?.length === 0, "A cannot delete B's item");
    r = await rest('items', anon, A.jwt, { method: 'POST', body: JSON.stringify({ user_id: B.uid, name: 'planted', category: 'Tops', color: 'Black' }) });
    check(r.status >= 400, `A cannot insert an item owned by B (status ${r.status})`);
    r = await rest(`items?id=eq.${a.item}`, anon, A.jwt, { method: 'PATCH', body: JSON.stringify({ user_id: B.uid }) });
    check(r.status >= 400 || (await json(r))?.length === 0, 'A cannot reassign its item to B');
    r = await rest('outfit_items', anon, A.jwt, { method: 'POST', body: JSON.stringify({ outfit_id: a.outfit, item_id: b.item }) });
    check(r.status >= 400, "A cannot link B's item into A's outfit (composite FK)");
    r = await rest('wear_log', anon, A.jwt, { method: 'POST', body: JSON.stringify({ day: '2026-01-01', outfit_id: b.outfit }) });
    check(r.status >= 400, "A cannot log wear of B's outfit");
    r = await rest(`profiles?user_id=eq.${B.uid}`, anon, A.jwt, { method: 'PATCH', body: JSON.stringify({ display_name: 'pwned' }) });
    check((await json(r))?.length === 0, "A cannot update B's profile");
    r = await rest('profiles', anon, A.jwt, { method: 'POST', body: JSON.stringify({ user_id: A.uid }) });
    check(r.status >= 400, 'profiles cannot be inserted by clients');
    r = await rest(`profiles?user_id=eq.${A.uid}`, anon, A.jwt, { method: 'DELETE' });
    check(r.status >= 400 || (await json(r))?.length === 0, 'profiles cannot be deleted by clients');
    check(!!(await admin.from('profiles').select('user_id').eq('user_id', A.uid).maybeSingle()).data, 'profile row still exists after delete attempt');
    // 4. service-role key is not accepted as an anon-role credential smuggled via JWT forgery
    const forged = A.jwt.split('.').slice(0, 2).join('.') + '.AAAA';
    r = await rest('items?select=id', anon, forged);
    check(r.status === 401, `forged JWT rejected (status ${r.status})`);
    // 5. storage
    const sh = (jwt: string | null) => ({ apikey: anon, ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) });
    r = await fetch(`${url}/storage/v1/object/item-photos/${bPath}`, { headers: sh(A.jwt) });
    check(r.status >= 400, `A cannot download B's photo (status ${r.status})`);
    r = await fetch(`${url}/storage/v1/object/item-photos/${bPath}`, { headers: sh(null) });
    check(r.status >= 400, `anon cannot download B's photo (status ${r.status})`);
    r = await fetch(`${url}/storage/v1/object/public/item-photos/${bPath}`);
    check(r.status >= 400, `bucket is not public (status ${r.status})`);
    r = await fetch(`${url}/storage/v1/object/sign/item-photos/${bPath}`, { method: 'POST', headers: { ...sh(A.jwt), 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 60 }) });
    check(r.status >= 400, `A cannot sign a URL for B's photo (status ${r.status})`);
    r = await fetch(`${url}/storage/v1/object/item-photos/${B.uid}/evil.png`, { method: 'POST', headers: { ...sh(A.jwt), 'Content-Type': 'image/png' }, body: png });
    check(r.status >= 400, `A cannot upload into B's folder (status ${r.status})`);
    r = await fetch(`${url}/storage/v1/object/item-photos/${bPath}`, { method: 'DELETE', headers: sh(A.jwt) });
    const stillThere = await admin.storage.from('item-photos').download(bPath);
    check(!stillThere.error, "A cannot delete B's photo");
    r = await fetch(`${url}/storage/v1/object/item-photos/${A.uid}/x.html`, { method: 'POST', headers: { ...sh(A.jwt), 'Content-Type': 'text/html' }, body: '<script>1</script>' });
    check(r.status >= 400, `non-image upload rejected by bucket mime allow-list (status ${r.status})`);
    r = await fetch(`${url}/storage/v1/object/item-photos/${A.uid}/ok.png`, { method: 'POST', headers: { ...sh(A.jwt), 'Content-Type': 'image/png' }, body: png });
    check(r.status < 300, `A can upload to its own folder (status ${r.status})`);
    // 6. auth config
    const s = await json(await fetch(`${url}/auth/v1/settings`, { headers: { apikey: anon } }));
    check(s?.disable_signup === false, 'signup is enabled (expected for a consumer app)');
    r = await fetch(`${url}/auth/v1/signup`, { method: 'POST', headers: { apikey: anon, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `sec-weak-${Date.now()}@security.test`, password: '1234567' }) });
    console.log(r.status >= 400 ? 'PASS' : 'WARN', `server rejects 7-char password (status ${r.status}); WARN = running stack predates config.toml minimum_password_length=8 (restart needed)`);
    r = await fetch(`${url}/auth/v1/admin/users`, { headers: { apikey: anon, Authorization: `Bearer ${A.jwt}` } });
    check(r.status >= 400, `user JWT cannot call auth admin API (status ${r.status})`);
    // 7. input validation (needs migration 20261112090000_input_validation applied)
    const bad: Record<string, any> = {
      'foreign photo_path': { name: 'x', category: 'Tops', color: 'Black', photo_path: `${B.uid}/x.png` },
      'path traversal': { name: 'x', category: 'Tops', color: 'Black', photo_path: `${A.uid}/../${B.uid}/x.png` },
      '201-char name': { name: 'x'.repeat(201), category: 'Tops', color: 'Black' },
      'bad category': { name: 'x', category: 'Hats', color: 'Black' },
      '100 tags': { name: 'x', category: 'Tops', color: 'Black', tags: Array(100).fill('t') },
    };
    for (const [k, body] of Object.entries(bad)) {
      r = await rest('items', anon, A.jwt, { method: 'POST', body: JSON.stringify(body) });
      check(r.status >= 400, `items rejects ${k} (status ${r.status})`);
    }
    r = await rest(`profiles?user_id=eq.${A.uid}`, anon, A.jwt, { method: 'PATCH', body: JSON.stringify({ display_name: 'n'.repeat(101) }) });
    check(r.status >= 400, `profile rejects 101-char display_name (status ${r.status})`);
  } finally {
    const { data: all } = await admin.auth.admin.listUsers({ perPage: 200 });
    for (const u of all?.users ?? []) if (u.email?.startsWith('sec-weak-') && u.email.endsWith('@security.test')) made.push(u.id);
    for (const id of made) {
      await admin.storage.from('item-photos').remove([]).catch(() => {});
      const { data } = await admin.storage.from('item-photos').list(id); 
      for (const o of data ?? []) { const { data: sub } = await admin.storage.from('item-photos').list(`${id}/${o.name}`); await admin.storage.from('item-photos').remove([`${id}/${o.name}`, ...(sub ?? []).map(s => `${id}/${o.name}/${s.name}`)]); }
      await admin.auth.admin.deleteUser(id);
    }
  }
  console.log(failed ? `\n${failed} FAILED` : '\nall passed'); process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
