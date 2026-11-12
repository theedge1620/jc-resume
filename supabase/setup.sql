-- Run once in Supabase → SQL Editor.
-- Creates a PRIVATE bucket for the site content and lets signed-in users read it.
-- Nobody can read it anonymously, and only the service_role key (upload script /
-- dashboard) can write to it.

insert into storage.buckets (id, name, public)
values ('private-site', 'private-site', false)
on conflict (id) do update set public = false;

drop policy if exists "private-site: signed-in users can read" on storage.objects;
create policy "private-site: signed-in users can read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'private-site');
