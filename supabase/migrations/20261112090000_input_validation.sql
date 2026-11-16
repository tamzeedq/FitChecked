-- Security review: bound every client-writable free-form column (defense against oversized writes / path abuse).
alter table public.items
  add constraint items_tags_bounded check (cardinality(tags) <= 50 and length(array_to_string(tags, ',')) <= 2000),
  add constraint items_photo_path_own check (photo_path is null or (length(photo_path) <= 300 and photo_path like user_id::text || '/%' and photo_path not like '%..%')),
  add constraint items_original_path_own check (original_path is null or (length(original_path) <= 300 and original_path like user_id::text || '/%' and original_path not like '%..%')),
  add constraint items_silhouette_bounded check (silhouette is null or pg_column_size(silhouette) <= 8192),
  add constraint items_bg_hue_range check (bg_hue between 0 and 360);
alter table public.outfits
  add constraint outfits_tags_bounded check (cardinality(tags) <= 50 and length(array_to_string(tags, ',')) <= 2000),
  add constraint outfits_note_len check (note is null or length(note) <= 2000);
alter table public.tag_groups
  add constraint tag_groups_tags_bounded check (cardinality(tags) <= 200 and length(array_to_string(tags, ',')) <= 4000),
  add constraint tag_groups_hue_range check (hue between 0 and 360);
alter table public.profiles
  add constraint profiles_display_name_len check (length(display_name) <= 100),
  add constraint profiles_settings_bounded check (pg_column_size(settings) <= 4096);
alter table public.outfit_items add constraint outfit_items_position_range check (position between 0 and 1000);
