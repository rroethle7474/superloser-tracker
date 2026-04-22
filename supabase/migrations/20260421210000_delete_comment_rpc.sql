-- Trust-based delete: like edit_comment, the UI gates via localStorage + admin role.
-- Suitable for a small family audience; tighten later if the surface grows.
create or replace function public.delete_comment(comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.comments where id = comment_id;
  if not found then
    raise exception 'comment not found' using errcode = 'P0002';
  end if;
end;
$$;

grant execute on function public.delete_comment(uuid) to anon, authenticated;
