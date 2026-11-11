-- Add the two storefront account categories.
alter table public.accounts
  add column if not exists category text not null default 'normal'
  check (category in ('chicken_skin','normal'));

create index if not exists accounts_category_status_created_idx
  on public.accounts (category, status, created_at desc);

-- Access control: public visitors can read listings; only admin users can mutate them.
alter table public.accounts enable row level security;
drop policy if exists "Public can read accounts" on public.accounts;
create policy "Public can read accounts" on public.accounts for select using (true);
drop policy if exists "Admins can insert accounts" on public.accounts;
create policy "Admins can insert accounts" on public.accounts for insert to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can update accounts" on public.accounts;
create policy "Admins can update accounts" on public.accounts for update to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can delete accounts" on public.accounts;
create policy "Admins can delete accounts" on public.accounts for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Public product images; only admins may upload or delete.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('account-images','account-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Admins upload account images" on storage.objects;
create policy "Admins upload account images" on storage.objects for insert to authenticated
  with check (bucket_id='account-images' and (auth.jwt() -> 'app_metadata' ->> 'role')='admin');
drop policy if exists "Admins delete account images" on storage.objects;
create policy "Admins delete account images" on storage.objects for delete to authenticated
  using (bucket_id='account-images' and (auth.jwt() -> 'app_metadata' ->> 'role')='admin');
