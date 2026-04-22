-- =============================================================
-- Videos: multi-video gallery backing the Video section
-- =============================================================

-- 1) Drop the update_site_config RPC that references columns we're about to drop.
drop function if exists public.update_site_config(text, text, text);

-- 2) Drop now-unused video columns from site_config.
alter table public.site_config
  drop column if exists uploaded_video_path,
  drop column if exists live_stream_url;

-- 3) videos table
create table public.videos (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  storage_path text not null,
  created_at   timestamptz not null default now()
);

create index videos_created_idx on public.videos (created_at desc);

alter table public.videos enable row level security;

create policy "videos_public_read" on public.videos
  for select to anon, authenticated using (true);

revoke insert, update, delete on public.videos from anon;

-- 4) RPCs

create or replace function public.add_video(
  p_title         text,
  p_storage_path  text,
  admin_token     text
) returns public.videos
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  expected_slug text;
  row_out public.videos%rowtype;
begin
  if p_title is null or length(btrim(p_title)) = 0 then
    raise exception 'title required' using errcode = '22023';
  end if;
  if p_storage_path is null or length(btrim(p_storage_path)) = 0 then
    raise exception 'storage_path required' using errcode = '22023';
  end if;

  select slug into expected_slug from public.admin_secrets where id = 1;
  if expected_slug is null or admin_token is null or admin_token <> expected_slug then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  insert into public.videos (title, storage_path)
  values (btrim(p_title), p_storage_path)
  returning * into row_out;
  return row_out;
end;
$$;

grant execute on function public.add_video(text, text, text) to anon, authenticated;

create or replace function public.delete_video(
  video_id     uuid,
  admin_token  text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  expected_slug text;
begin
  select slug into expected_slug from public.admin_secrets where id = 1;
  if expected_slug is null or admin_token is null or admin_token <> expected_slug then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  delete from public.videos where id = video_id;
  if not found then
    raise exception 'video not found' using errcode = 'P0002';
  end if;
end;
$$;

grant execute on function public.delete_video(uuid, text) to anon, authenticated;

-- 5) Realtime publication
alter publication supabase_realtime add table public.videos;

-- 6) Storage policies for the `Videos` bucket (note capital V — that's the actual name).
-- Anon can insert/delete objects in this bucket. The admin gate lives in the add_video
-- RPC (DB row won't exist without a valid slug), so orphan uploads can't appear in UI.

drop policy if exists "videos_bucket_insert" on storage.objects;
drop policy if exists "videos_bucket_delete" on storage.objects;
drop policy if exists "videos_bucket_select" on storage.objects;

create policy "videos_bucket_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'Videos');

create policy "videos_bucket_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'Videos');

-- Public-read is already handled by the bucket's `public: true` setting,
-- but adding an explicit policy doesn't hurt and makes intent clear.
create policy "videos_bucket_select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'Videos');
