create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC'
);

create table if not exists public.pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  planned_duration_sec int not null default 1500,
  status text not null default 'created' check (status in ('created', 'running', 'paused', 'completed', 'canceled')),
  started_at timestamptz,
  last_resumed_at timestamptz,
  paused_total_sec int not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_pomodoro_sessions_user_status_created
  on public.pomodoro_sessions(user_id, status, created_at desc);

create index if not exists idx_pomodoro_sessions_user_completed_at
  on public.pomodoro_sessions(user_id, completed_at desc);

alter table public.profiles enable row level security;
alter table public.pomodoro_sessions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "sessions_select_own" on public.pomodoro_sessions;
create policy "sessions_select_own"
  on public.pomodoro_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "sessions_insert_own" on public.pomodoro_sessions;
create policy "sessions_insert_own"
  on public.pomodoro_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "sessions_update_own" on public.pomodoro_sessions;
create policy "sessions_update_own"
  on public.pomodoro_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, timezone)
  values (new.id, 'UTC')
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
