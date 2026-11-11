-- Add the two storefront account categories.
alter table public.accounts
  add column if not exists category text not null default 'normal'
  check (category in ('chicken_skin','normal'));

create index if not exists accounts_category_status_created_idx
  on public.accounts (category, status, created_at desc);
