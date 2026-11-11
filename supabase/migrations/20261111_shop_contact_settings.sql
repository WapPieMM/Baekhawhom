-- Baekhawhom editable public contact channels
create table if not exists public.shop_settings (
  id text primary key check (id = 'main'),
  line_url text not null default '',
  line_text text not null default '',
  instagram_url text not null default '',
  instagram_text text not null default '',
  facebook_url text not null default '',
  facebook_text text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.shop_settings (id)
values ('main')
on conflict (id) do nothing;

alter table public.shop_settings enable row level security;
grant select on public.shop_settings to anon, authenticated;
grant insert, update on public.shop_settings to authenticated;

drop policy if exists "Public can read shop settings" on public.shop_settings;
create policy "Public can read shop settings"
  on public.shop_settings for select
  using (true);

drop policy if exists "Admins can insert shop settings" on public.shop_settings;
create policy "Admins can insert shop settings"
  on public.shop_settings for insert to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update shop settings" on public.shop_settings;
create policy "Admins can update shop settings"
  on public.shop_settings for update to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
