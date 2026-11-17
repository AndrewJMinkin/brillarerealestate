-- Run once in the project's Supabase SQL editor before enabling auth-config.js.
-- The static site must never contain private lesson content or private links.
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'core' check (category in ('core', 'bonus')),
  position integer not null default 0,
  lesson_url text check (lesson_url is null or lesson_url ~ '^https://'),
  published boolean not null default false
);
alter table public.lessons enable row level security;
revoke all on public.lessons from anon, authenticated;
grant select on public.lessons to authenticated;
create policy "Confirmed students can read published lessons"
on public.lessons for select to authenticated
using (published = true and (select auth.uid()) is not null);
-- No browser role can insert, update or delete lessons.
-- Add the verified original curriculum in the dashboard. Leave lesson_url NULL
-- until links are ready. Do not seed guessed curriculum as if it were original.
