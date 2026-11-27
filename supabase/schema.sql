-- Jalankan SQL ini di Supabase Dashboard -> SQL Editor

-- 1. Tabel Profil User (koin & total poin)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  coins integer not null default 5,
  total_points integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 2. Tabel Koleksi Hadiah User
create table if not exists public.collected_prizes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prize_id text not null,
  name text not null,
  emoji text not null,
  rarity text not null,
  description text not null,
  points integer not null default 0,
  collected_at timestamptz not null default now()
);

create index if not exists idx_collected_prizes_user_id
  on public.collected_prizes (user_id, collected_at desc);

-- 3. Aktifkan Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.collected_prizes enable row level security;

-- Policy: user hanya bisa melihat & mengubah datanya sendiri
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can view own prizes"
  on public.collected_prizes for select
  using (auth.uid() = user_id);

create policy "Users can insert own prizes"
  on public.collected_prizes for insert
  with check (auth.uid() = user_id);

-- 4. Trigger otomatis membuat profil saat user baru login via Google / Facebook
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, coins, total_points)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', 'Player'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    5,
    0
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
