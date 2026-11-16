-- Plain psql isolation test. Run: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/isolation.sql
-- Runs in a transaction and rolls back; leaves no data behind.
begin;

create function public.t_check(ok boolean, msg text) returns void language plpgsql as $$
begin if not ok then raise exception 'FAIL: %', msg; end if; raise notice 'ok: %', msg; end $$;

-- two users (signup trigger must create profiles)
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values ('aaaaaaaa-0000-0000-0000-00000000000a','00000000-0000-0000-0000-000000000000','authenticated','authenticated','a@test.local','{"name":"A"}',now(),now()),
       ('bbbbbbbb-0000-0000-0000-00000000000b','00000000-0000-0000-0000-000000000000','authenticated','authenticated','b@test.local','{"name":"B"}',now(),now());

select public.t_check((select count(*) from public.profiles where user_id in ('aaaaaaaa-0000-0000-0000-00000000000a','bbbbbbbb-0000-0000-0000-00000000000b')) = 2, 'signup creates profiles');
select public.t_check((select count(*) from public.tag_groups where user_id = 'aaaaaaaa-0000-0000-0000-00000000000a') = 4, 'signup seeds tag groups');

select public.t_check((select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r' and not c.relrowsecurity) = 0, 'RLS enabled on every public table');

-- seed B's data as superuser
insert into public.items (id, user_id, name, category, color) values ('b0000000-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-00000000000b','B shirt','Tops','Black');
insert into public.outfits (id, user_id, name) values ('b0000000-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-00000000000b','B outfit');
insert into public.outfit_items (outfit_id,item_id,user_id) values ('b0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-00000000000b');
insert into public.wear_log (user_id,day,outfit_id) values ('bbbbbbbb-0000-0000-0000-00000000000b','2026-01-01','b0000000-0000-0000-0000-000000000002');
insert into public.recent_searches (user_id,query) values ('bbbbbbbb-0000-0000-0000-00000000000b','denim');
insert into storage.objects (bucket_id,name,owner_id) values ('item-photos','bbbbbbbb-0000-0000-0000-00000000000b/x.jpg','bbbbbbbb-0000-0000-0000-00000000000b');

-- ===== anon =====
set local role anon;
do $$ declare t text; n int; begin
  foreach t in array array['items','outfits','outfit_items','wear_log','tag_groups','recent_searches','profiles','item_wear_stats','outfit_wear_stats'] loop
    begin
      execute format('select count(*) from public.%I', t) into n;
      perform public.t_check(n = 0, 'anon sees 0 rows in '||t);
    exception when insufficient_privilege then perform public.t_check(true, 'anon denied on '||t); end;
  end loop;
  perform public.t_check((select count(*) from storage.objects where bucket_id='item-photos') = 0, 'anon sees no photos');
  begin insert into public.items (user_id,name,category,color) values ('bbbbbbbb-0000-0000-0000-00000000000b','x','Tops','Black');
    raise exception 'FAIL: anon insert allowed';
  exception when insufficient_privilege then perform public.t_check(true,'anon insert denied'); end;
end $$;
reset role;

-- ===== user A =====
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-00000000000a',true);
select set_config('request.jwt.claims','{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}',true);

do $$ declare n int; begin
  perform public.t_check((select count(*) from public.items) = 0, 'A cannot select B items');
  perform public.t_check((select count(*) from public.outfits) = 0, 'A cannot select B outfits');
  perform public.t_check((select count(*) from public.outfit_items) = 0, 'A cannot select B outfit_items');
  perform public.t_check((select count(*) from public.wear_log) = 0, 'A cannot select B wear_log');
  perform public.t_check((select count(*) from public.recent_searches) = 0, 'A cannot select B searches');
  perform public.t_check((select count(*) from public.profiles where user_id <> auth.uid()) = 0, 'A cannot select B profile');
  perform public.t_check((select count(*) from public.item_wear_stats) = 0, 'A cannot see B stats view');
  perform public.t_check((select count(*) from storage.objects where bucket_id='item-photos') = 0, 'A cannot list B photos');

  update public.items set name='hacked' where id='b0000000-0000-0000-0000-000000000001';
  get diagnostics n = row_count; perform public.t_check(n=0, 'A cannot update B item');
  delete from public.items where id='b0000000-0000-0000-0000-000000000001';
  get diagnostics n = row_count; perform public.t_check(n=0, 'A cannot delete B item');
  update public.profiles set display_name='hacked' where user_id='bbbbbbbb-0000-0000-0000-00000000000b';
  get diagnostics n = row_count; perform public.t_check(n=0, 'A cannot update B profile');
  update storage.objects set name='aaaaaaaa-0000-0000-0000-00000000000a/stolen.jpg' where name='bbbbbbbb-0000-0000-0000-00000000000b/x.jpg';
  get diagnostics n = row_count; perform public.t_check(n=0, 'A cannot move/modify B photo (direct deletes are blocked by storage anyway)');

  begin insert into public.items (user_id,name,category,color) values ('bbbbbbbb-0000-0000-0000-00000000000b','x','Tops','Black');
    raise exception 'FAIL: A inserted as B';
  exception when insufficient_privilege then perform public.t_check(true,'A cannot insert row owned by B'); end;
  begin insert into storage.objects (bucket_id,name,owner_id) values ('item-photos','bbbbbbbb-0000-0000-0000-00000000000b/y.jpg',auth.uid());
    raise exception 'FAIL: A uploaded to B folder';
  exception when insufficient_privilege then perform public.t_check(true,'A cannot upload to B folder'); end;
  declare aid uuid; begin insert into public.items (name,category,color) values ('A tmp','Tops','White') returning id into aid;
  insert into public.outfit_items (outfit_id,item_id,user_id) values ('b0000000-0000-0000-0000-000000000002',aid,auth.uid());
    raise exception 'FAIL: A linked B rows';
  exception when insufficient_privilege or foreign_key_violation then perform public.t_check(true,'A cannot link B outfit/items'); end;

  -- positive: A can use own data
  insert into public.items (name,category,color) values ('A tee','Tops','White');
  perform public.t_check((select count(*) from public.items) = 1, 'A sees own item');
  insert into storage.objects (bucket_id,name,owner_id) values ('item-photos',auth.uid()||'/mine.jpg',auth.uid());
  perform public.t_check((select count(*) from storage.objects where bucket_id='item-photos') = 1, 'A sees own photo only');
end $$;
reset role;

select 'ALL ISOLATION TESTS PASSED' as result;
rollback;
