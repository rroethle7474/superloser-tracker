-- Track edit time on comments (distinct from post order, which uses created_at).
alter table public.comments
  add column if not exists updated_at timestamptz not null default now();

-- Trust-based edit: the UI gates with localStorage (author remembers their comment IDs).
-- For a small family audience this is acceptable; can be tightened later with an
-- edit_token column or auth if the audience grows.
create or replace function public.edit_comment(
  comment_id uuid,
  p_body     text
) returns public.comments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  row_out public.comments%rowtype;
begin
  if p_body is null or length(btrim(p_body)) = 0 then
    raise exception 'comment body required' using errcode = '22023';
  end if;

  update public.comments
     set body       = btrim(p_body),
         updated_at = now()
   where id = comment_id
  returning * into row_out;

  if not found then
    raise exception 'comment not found' using errcode = 'P0002';
  end if;

  return row_out;
end;
$$;

grant execute on function public.edit_comment(uuid, text) to anon, authenticated;
