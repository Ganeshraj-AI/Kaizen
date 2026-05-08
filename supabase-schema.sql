-- ═══════════════════════════════════════════════════
-- Kaizen – Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════

-- Enable RLS
alter table if exists public.habits enable row level security;

-- ── Habits ───────────────────────────────────────
create table if not exists public.habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  emoji       text default '✨',
  color       text default '#8B5CF6',
  category    text default 'General',
  created_at  timestamptz default now()
);

create policy "Users manage own habits"
  on public.habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Habit Completions ─────────────────────────────
create table if not exists public.habit_completions (
  id          uuid primary key default gen_random_uuid(),
  habit_id    uuid references public.habits(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        date not null,
  created_at  timestamptz default now(),
  unique(habit_id, date)
);

create policy "Users manage own completions"
  on public.habit_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Mood Logs ─────────────────────────────────────
create table if not exists public.mood_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        date not null,
  mood        integer not null check (mood between 1 and 5),
  note        text default '',
  logged_at   timestamptz default now(),
  unique(user_id, date)
);

create policy "Users manage own mood logs"
  on public.mood_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Sleep Logs ────────────────────────────────────
create table if not exists public.sleep_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        date not null,
  hours       numeric(4,1) not null check (hours >= 0 and hours <= 24),
  created_at  timestamptz default now(),
  unique(user_id, date)
);

create policy "Users manage own sleep logs"
  on public.sleep_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Reflections ───────────────────────────────────
create table if not exists public.reflections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        date not null,
  content     text not null,
  updated_at  timestamptz default now(),
  unique(user_id, date)
);

create policy "Users manage own reflections"
  on public.reflections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Journal Entries ───────────────────────────────
create table if not exists public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        date not null,
  title       text default '',
  mood        integer check (mood between 1 and 5),
  reflection  text default '',
  wins        jsonb default '[]',
  struggles   jsonb default '[]',
  notes       text default '',
  gratitude   jsonb default '[]',
  tags        jsonb default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(user_id, date)
);

create policy "Users manage own journal entries"
  on public.journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Enable RLS on all tables ──────────────────────
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.mood_logs enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.reflections enable row level security;
alter table public.journal_entries enable row level security;
