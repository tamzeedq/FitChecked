-- FitChecked core schema. Mirrors src/data/types.ts.
-- wearCount / lastWorn are derived from wear_log (views below), not stored.

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- profiles: 1:1 with auth.users
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  member_since timestamptz not null default now(),
  settings jsonb not null default '{
    "appearance":"system","units":"C","morningSuggestion":false,
    "morningTime":"08:00","skipRecentDays":7,"useDeviceLocation":false}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint settings_is_object check (jsonb_typeof(settings) = 'object')
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 200),
  category text not null check (category in ('Tops','Bottoms','Outerwear','Shoes','Accessories')),
  color text not null check (color in ('Black','White','Cream','Grey','Navy','Olive','Camel','Rust')),
  tags text[] not null default '{}',
  photo_path text,      -- item-photos bucket path: {user_id}/...
  original_path text,
  silhouette jsonb,
  bg_hue integer not null default 0,
  tile_delta real,
  favorite boolean not null default false,
  deleted_at timestamptz, -- soft delete
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index items_user_idx on public.items(user_id) where deleted_at is null;

create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 200),
  tags text[] not null default '{}',
  note text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index outfits_user_idx on public.outfits(user_id);

-- ordered join; composite FKs guarantee both sides belong to the same user
create table public.outfit_items (
  outfit_id uuid not null,
  item_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  position integer not null default 0,
  primary key (outfit_id, item_id),
  foreign key (outfit_id, user_id) references public.outfits(id, user_id) on delete cascade,
  foreign key (item_id, user_id) references public.items(id, user_id) on delete cascade
);
create index outfit_items_user_idx on public.outfit_items(user_id);
create index outfit_items_item_idx on public.outfit_items(item_id);

create table public.wear_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  outfit_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key (outfit_id, user_id) references public.outfits(id, user_id) on delete cascade,
  unique (user_id, day, outfit_id)
);
create index wear_log_user_day_idx on public.wear_log(user_id, day);

create table public.tag_groups (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (name in ('Occasion','Mood','Weather','Season')),
  hue integer not null default 0,
  tags text[] not null default '{}',
  primary key (user_id, name)
);

create table public.recent_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  query text not null check (length(query) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (user_id, query)
);
create index recent_searches_user_idx on public.recent_searches(user_id, created_at desc);

create trigger items_updated before update on public.items for each row execute function public.set_updated_at();
create trigger outfits_updated before update on public.outfits for each row execute function public.set_updated_at();
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

-- derived wear stats (security_invoker so RLS of the caller applies)
create view public.item_wear_stats with (security_invoker = true) as
select i.id as item_id, i.user_id, count(w.id)::int as wear_count, max(w.day) as last_worn
from public.items i
left join public.outfit_items oi on oi.item_id = i.id and oi.user_id = i.user_id
left join public.wear_log w on w.outfit_id = oi.outfit_id and w.user_id = i.user_id
group by i.id, i.user_id;

create view public.outfit_wear_stats with (security_invoker = true) as
select o.id as outfit_id, o.user_id, count(w.id)::int as wear_count, max(w.day) as last_worn
from public.outfits o
left join public.wear_log w on w.outfit_id = o.id and w.user_id = o.user_id
group by o.id, o.user_id;

-- RLS: owner-only
do $$
declare t text;
begin
  foreach t in array array['items','outfits','outfit_items','wear_log','tag_groups','recent_searches'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%1$s_select_own" on public.%1$I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy "%1$s_insert_own" on public.%1$I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy "%1$s_update_own" on public.%1$I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy "%1$s_delete_own" on public.%1$I for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles for select to authenticated using (user_id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- no insert policy (trigger creates it); no delete policy (cascades from auth.users)

-- explicit grants: anon gets nothing
revoke all on all tables in schema public from anon;
revoke all on public.item_wear_stats, public.outfit_wear_stats from anon;
grant select, insert, update, delete on public.items, public.outfits, public.outfit_items,
  public.wear_log, public.tag_groups, public.recent_searches to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.item_wear_stats, public.outfit_wear_stats to authenticated;

-- signup trigger: profile + default tag groups
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  insert into public.tag_groups (user_id, name, hue, tags) values
    (new.id,'Occasion',30,'{}'),(new.id,'Mood',300,'{}'),
    (new.id,'Weather',220,'{}'),(new.id,'Season',140,'{}');
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
