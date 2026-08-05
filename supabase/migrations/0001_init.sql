create extension if not exists pgcrypto;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text,
  last_name text,
  company text,
  email text,
  phone text,
  consent boolean not null default false,
  sector text,
  size text,
  answers jsonb not null,
  result jsonb not null,
  risk_score integer,
  conforme boolean
);

alter table public.submissions enable row level security;

-- Le simulateur écrit avec la clé publique (anon) : seul l'INSERT est
-- autorisé pour ce rôle, aucune lecture, mise à jour ou suppression.
create policy "anon can insert submissions"
  on public.submissions
  for insert
  to anon
  with check (true);

-- Allow-list des comptes autorisés à lire les leads dans le back-office.
-- "authenticated" tout court ouvrirait la lecture à quiconque crée un
-- compte Supabase Auth : on restreint donc via cette table, remplie à la
-- main (voir README du back-office) avec l'UID de chaque admin.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.admins enable row level security;
-- Aucune policy sur admins : personne ne peut la lire ni l'écrire via
-- l'API publique, seule la console SQL Supabase (rôle postgres) le peut.

create policy "admins can read submissions"
  on public.submissions
  for select
  to authenticated
  using (exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  ));
