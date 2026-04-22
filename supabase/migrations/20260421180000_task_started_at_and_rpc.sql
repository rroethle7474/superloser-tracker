-- Add "started" phase support for tasks (used by "Walk the dog" primarily).
alter table public.tasks
  add column if not exists started_at timestamptz;

-- RPC: flip started_at between now() and null, slug-gated like toggle_task.
create or replace function public.toggle_task_started(task_id uuid, admin_token text)
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
     set started_at = case when started_at is null then now() else null end
   where id = task_id
  returning * into row_out;

  if not found then
    raise exception 'task not found' using errcode = 'P0002';
  end if;

  return row_out;
end;
$$;

grant execute on function public.toggle_task_started(uuid, text) to anon, authenticated;
