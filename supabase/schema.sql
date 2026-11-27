-- Jalankan SQL ini di Supabase Dashboard -> SQL Editor
-- Semua waktu harian menggunakan GMT+7 (Asia/Jakarta)

-- 1. Tabel Profil User
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  email text,
  avatar_url text,
  free_tokens integer not null default 3,
  paid_tokens integer not null default 0,
  pity_counter integer not null default 0,
  pity_bonus_active boolean not null default false,
  last_daily_claim_date date,
  total_points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username is null or username ~ '^[a-z0-9]{3,20}$')
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists free_tokens integer not null default 3;
alter table public.profiles add column if not exists paid_tokens integer not null default 0;
alter table public.profiles add column if not exists pity_counter integer not null default 0;
alter table public.profiles add column if not exists pity_bonus_active boolean not null default false;
alter table public.profiles add column if not exists last_daily_claim_date date;
alter table public.profiles add column if not exists total_points integer not null default 0;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_profiles_username_lower
  on public.profiles (lower(username))
  where username is not null;

-- 2. Tabel Series Hadiah
create table if not exists public.series (
  id text primary key,
  name text not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

insert into public.series (id, name, description, is_active, sort_order)
values
  ('first-edition', 'First Edition', 'Seri perdana 90+ hewan & huruf CLAWME!', true, 1),
  ('neon-cyber', 'Neon Cyber (Coming Soon)', 'Seri bulan depan — segera hadir!', false, 2)
on conflict (id) do nothing;

-- 3. Tabel Koleksi User (per item & per series, termasuk penanda asal: capit vs trade)
create table if not exists public.user_collectibles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  series_id text not null references public.series (id) on delete cascade,
  collectible_id text not null,
  tier text not null,
  quantity integer not null default 1,
  capit_quantity integer not null default 0,
  trade_quantity integer not null default 0,
  traded_from_usernames text[] not null default '{}',
  first_obtained_at timestamptz not null default now(),
  last_obtained_at timestamptz not null default now(),
  unique (user_id, series_id, collectible_id)
);

alter table public.user_collectibles add column if not exists capit_quantity integer not null default 0;
alter table public.user_collectibles add column if not exists trade_quantity integer not null default 0;
alter table public.user_collectibles add column if not exists traded_from_usernames text[] not null default '{}';

create index if not exists idx_user_collectibles_user_series
  on public.user_collectibles (user_id, series_id);

-- 4. Tabel Riwayat Transaksi Saweria (Idempotency)
create table if not exists public.saweria_transactions (
  id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  username_or_email text,
  amount_idr integer not null,
  tokens_added integer not null,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

-- 4b. Tabel Konfigurasi Game & Drop Rate (Rule #5)
create table if not exists public.game_config (
  id text primary key default 'default',
  catch_chance_normal numeric not null default 30,
  catch_chance_pity numeric not null default 90,
  pity_threshold integer not null default 10,
  tier_c_chance numeric not null default 58.9,
  tier_b_chance numeric not null default 25,
  tier_a_chance numeric not null default 15,
  tier_ss_chance numeric not null default 1,
  tier_ssr_chance numeric not null default 0.1,
  daily_free_tokens integer not null default 3,
  clawme_redeem_tokens integer not null default 5,
  token_price_idr integer not null default 1000,
  updated_at timestamptz not null default now()
);

insert into public.game_config (id, catch_chance_normal)
values ('default', 30)
on conflict (id) do update set catch_chance_normal = excluded.catch_chance_normal;

alter table public.profiles drop constraint if exists username_format;
alter table public.profiles
  add constraint username_format check (username is null or username ~ '^[a-z0-9]{3,20}$');

alter table public.game_config enable row level security;

drop policy if exists "Game config readable by everyone" on public.game_config;
create policy "Game config readable by everyone"
  on public.game_config for select
  using (true);

-- 5. Aktifkan Row Level Security (RLS) & Grant Hak Akses
grant usage on schema public to anon, authenticated, service_role;
grant select on public.game_config to anon, authenticated;
grant select on public.series to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.user_collectibles to authenticated;
grant all on public.profiles, public.user_collectibles, public.saweria_transactions, public.series, public.game_config to service_role;

alter table public.profiles enable row level security;
alter table public.series enable row level security;
alter table public.user_collectibles enable row level security;
alter table public.saweria_transactions enable row level security;

drop policy if exists "Series readable by everyone" on public.series;
create policy "Series readable by everyone"
  on public.series for select
  using (true);

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can view own collectibles" on public.user_collectibles;
create policy "Users can view own collectibles"
  on public.user_collectibles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own collectibles" on public.user_collectibles;
create policy "Users can insert own collectibles"
  on public.user_collectibles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own collectibles" on public.user_collectibles;
create policy "Users can update own collectibles"
  on public.user_collectibles for update
  using (auth.uid() = user_id);

-- 6. Trigger saat user baru login via Google / Facebook
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  today_wib date := (now() at time zone 'Asia/Jakarta')::date;
begin
  insert into public.profiles (
    id,
    email,
    avatar_url,
    free_tokens,
    paid_tokens,
    last_daily_claim_date
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    3,
    0,
    today_wib
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. RPC: Klaim +3 Token Harian (Reset 00:00 AM GMT+7, akumulasi)
create or replace function public.claim_daily_tokens()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today_wib date := (now() at time zone 'Asia/Jakarta')::date;
  prof record;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into prof from public.profiles where id = uid for update;
  if not found then
    raise exception 'Profile not found';
  end if;

  if prof.last_daily_claim_date is null or prof.last_daily_claim_date < today_wib then
    update public.profiles
    set
      free_tokens = free_tokens + 3,
      last_daily_claim_date = today_wib,
      updated_at = now()
    where id = uid
    returning * into prof;

    return jsonb_build_object(
      'claimed', true,
      'free_tokens', prof.free_tokens,
      'paid_tokens', prof.paid_tokens,
      'last_daily_claim_date', prof.last_daily_claim_date
    );
  end if;

  return jsonb_build_object(
    'claimed', false,
    'free_tokens', prof.free_tokens,
    'paid_tokens', prof.paid_tokens,
    'last_daily_claim_date', prof.last_daily_claim_date
  );
end;
$$;

-- 8. RPC: Set Username Pertama Kali (lowercase a-z0-9, unik, permanen tidak bisa diubah)
create or replace function public.set_username(new_username text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cleaned text := lower(trim(new_username));
  existing_username text;
  taken boolean;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select username into existing_username from public.profiles where id = uid;
  if existing_username is not null then
    raise exception 'Username sudah ditetapkan dan tidak dapat diubah lagi.';
  end if;

  if cleaned !~ '^[a-z0-9]{3,20}$' then
    raise exception 'Username harus 3-20 karakter (hanya huruf kecil dan angka, tanpa spasi/tanda baca).';
  end if;

  select exists (
    select 1 from public.profiles
    where lower(username) = cleaned and id <> uid
  ) into taken;

  if taken then
    raise exception 'Username sudah dipakai pemain lain, silakan pilih yang lain.';
  end if;

  update public.profiles
  set username = cleaned, updated_at = now()
  where id = uid;

  return cleaned;
end;
$$;

-- 9. RPC: Tukar Koleksi Lengkap C-A-P-I-T menjadi +5 Free Tokens
create or replace function public.redeem_capit(target_series text default 'first-edition')
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  letters text[] := array['letter-C', 'letter-A', 'letter-P', 'letter-I', 'letter-T'];
  ltr text;
  qty integer;
  new_free integer;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  foreach ltr in array letters loop
    select quantity into qty
    from public.user_collectibles
    where user_id = uid and series_id = target_series and collectible_id = ltr
    for update;

    if qty is null or qty < 1 then
      raise exception 'Huruf CAPIT belum lengkap!';
    end if;
  end loop;

  foreach ltr in array letters loop
    update public.user_collectibles
    set
      quantity = quantity - 1,
      capit_quantity = greatest(0, capit_quantity - 1),
      last_obtained_at = now()
    where user_id = uid and series_id = target_series and collectible_id = ltr;
  end loop;

  update public.profiles
  set free_tokens = free_tokens + 5, updated_at = now()
  where id = uid
  returning free_tokens into new_free;

  return new_free;
end;
$$;

-- 10. RPC: Leaderboard berdasarkan Collectibles ME unik terbuka + tie-breaker tier & waktu (Rule #26)
create or replace function public.get_leaderboard(target_series text default 'first-edition')
returns table (
  username text,
  unlocked_count bigint,
  ssr_count bigint,
  ss_count bigint,
  a_count bigint,
  b_count bigint,
  last_unlock_at timestamptz
)
language sql
security definer set search_path = public
as $$
  select
    p.username,
    count(uc.collectible_id) as unlocked_count,
    count(*) filter (where uc.tier = 'SSR') as ssr_count,
    count(*) filter (where uc.tier = 'SS') as ss_count,
    count(*) filter (where uc.tier = 'A') as a_count,
    count(*) filter (where uc.tier = 'B') as b_count,
    max(uc.first_obtained_at) as last_unlock_at
  from public.profiles p
  join public.user_collectibles uc
    on uc.user_id = p.id
   and uc.series_id = target_series
   and uc.quantity > 0
   and uc.collectible_id not like 'letter-%'
  where p.username is not null
  group by p.id, p.username
  order by
    unlocked_count desc,
    ssr_count desc,
    ss_count desc,
    a_count desc,
    b_count desc,
    last_unlock_at asc
  limit 50;
$$;

grant execute on function public.claim_daily_tokens() to authenticated;
grant execute on function public.set_username(text) to authenticated;
grant execute on function public.redeem_capit(text) to authenticated;
grant execute on function public.get_leaderboard(text) to anon, authenticated;
