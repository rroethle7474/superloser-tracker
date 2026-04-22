create extension if not exists pgcrypto;

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  order_index  int  not null,
  sitter_x     int  not null default 10,
  sitter_y     int  not null default 50,
  dog_x        int  not null default 20,
  dog_y        int  not null default 65,
  cat_x        int  not null default 80,
  cat_y        int  not null default 25,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);
create index tasks_order_idx on public.tasks (order_index);

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  author_name text not null default 'Anonymous',
  is_admin    boolean not null default false,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index comments_created_idx on public.comments (created_at);

create table public.site_config (
  id                  int primary key default 1,
  uploaded_video_path text,
  live_stream_url     text,
  updated_at          timestamptz not null default now(),
  constraint site_config_singleton check (id = 1)
);

create table public.admin_secrets (
  id   int primary key default 1,
  slug text not null,
  constraint admin_secrets_singleton check (id = 1)
);

alter table public.tasks         enable row level security;
alter table public.comments      enable row level security;
alter table public.site_config   enable row level security;
alter table public.admin_secrets enable row level security;

create policy "tasks_public_read" on public.tasks
  for select to anon, authenticated using (true);
create policy "comments_public_read" on public.comments
  for select to anon, authenticated using (true);
create policy "site_config_public_read" on public.site_config
  for select to anon, authenticated using (true);

revoke insert, update, delete on public.tasks         from anon;
revoke insert, update, delete on public.comments      from anon;
revoke insert, update, delete on public.site_config   from anon;
revoke all on public.admin_secrets from anon;

create or replace function public.toggle_task(task_id uuid, admin_token text)
returns public.tasks
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  expected_slug text;
  row_out public.tasks%rowtype;
begin
  select slug into expected_slug from public.admin_secrets where id = 1;
  if expected_slug is null or admin_token is null or admin_token <> expected_slug then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  update public.tasks
     set completed_at = case when completed_at is null then now() else null end
   where id = task_id
  returning * into row_out;
  if not found then
    raise exception 'task not found' using errcode = 'P0002';
  end if;
  return row_out;
end;
$$;
grant execute on function public.toggle_task(uuid, text) to anon, authenticated;

create or replace function public.update_site_config(
  p_uploaded_video_path text,
  p_live_stream_url     text,
  admin_token           text
) returns public.site_config
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  expected_slug text;
  row_out public.site_config%rowtype;
begin
  select slug into expected_slug from public.admin_secrets where id = 1;
  if expected_slug is null or admin_token is null or admin_token <> expected_slug then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  update public.site_config
     set uploaded_video_path = p_uploaded_video_path,
         live_stream_url     = p_live_stream_url,
         updated_at          = now()
   where id = 1
  returning * into row_out;
  return row_out;
end;
$$;
grant execute on function public.update_site_config(text, text, text) to anon, authenticated;

create or replace function public.add_comment(
  p_author_name text,
  p_body        text,
  admin_token   text default null
) returns public.comments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  expected_slug text;
  is_admin_flag boolean := false;
  row_out public.comments%rowtype;
begin
  if p_body is null or length(btrim(p_body)) = 0 then
    raise exception 'comment body required' using errcode = '22023';
  end if;
  select slug into expected_slug from public.admin_secrets where id = 1;
  if admin_token is not null and expected_slug is not null and admin_token = expected_slug then
    is_admin_flag := true;
  end if;
  insert into public.comments (author_name, is_admin, body)
  values (coalesce(nullif(btrim(p_author_name), ''), 'Anonymous'), is_admin_flag, p_body)
  returning * into row_out;
  return row_out;
end;
$$;
grant execute on function public.add_comment(text, text, text) to anon, authenticated;

alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.site_config;

insert into public.tasks (title, order_index, sitter_x, sitter_y, dog_x, dog_y, cat_x, cat_y) values
  ('Arrive at the house',           1, 10, 80, 50, 70, 85, 20),
  ('Greet the dog (mandatory)',     2, 30, 70, 35, 70, 85, 20),
  ('Walk the dog',                  3, 60, 40, 55, 42, 85, 20),
  ('Feed the dog (if negotiated)',  4, 40, 60, 45, 60, 85, 25),
  ('Check on the cat',              5, 75, 30, 40, 70, 72, 30),
  ('Lock up & depart',              6, 10, 80, 45, 65, 85, 25);

insert into public.site_config (id, uploaded_video_path, live_stream_url) values (1, null, null)
on conflict (id) do nothing;

insert into public.comments (author_name, is_admin, body) values
  ('Mission Control', true, 'Welcome to mission control. The dog hasn''t been walked yet.');
