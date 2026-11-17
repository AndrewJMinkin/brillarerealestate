-- Apply once to both new and existing installations, after schema.sql.
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  posted_on date not null,
  title text not null,
  body text not null,
  related_section text check (related_section in ('core', 'bonus', 'linkedin')),
  published boolean not null default false
);
alter table public.announcements enable row level security;
revoke all on public.announcements from anon, authenticated;
grant select on public.announcements to authenticated;
create policy "Students can read published announcements"
on public.announcements for select to authenticated
using (published = true and (select auth.uid()) is not null);
