-- Run once in your Supabase project's SQL Editor.
create table if not exists public.portfolio_content (
  id text primary key check (id = 'portfolio'),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_content enable row level security;
revoke all on public.portfolio_content from anon, authenticated;
grant select, insert, update on public.portfolio_content to service_role;

-- The application authorizes all writes and proxies file delivery server-side.
-- No direct public database or storage policies are required.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-assets', 'portfolio-assets', false, 4194304,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;
