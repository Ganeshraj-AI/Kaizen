-- ==============================================================
-- KAIZEN - SUPABASE SCHEMA
-- This schema matches the latest frontend structure for all features:
-- habits, habit_completions, mood_logs, sleep_logs, reflections, journal_entries
-- ==============================================================

-- Disable notices for clean output
SET client_min_messages = warning;

-- ==============================================================
-- 1. DROP EXISTING TABLES TO ENSURE CLEAN CREATION
-- ==============================================================
DROP TABLE IF EXISTS public.habit_completions CASCADE;
DROP TABLE IF EXISTS public.habits CASCADE;
DROP TABLE IF EXISTS public.mood_logs CASCADE;
DROP TABLE IF EXISTS public.sleep_logs CASCADE;
DROP TABLE IF EXISTS public.reflections CASCADE;
DROP TABLE IF EXISTS public.journal_entries CASCADE;

-- ==============================================================
-- 2. CREATE TABLES
-- ==============================================================

-- HABITS
CREATE TABLE public.habits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    emoji TEXT,
    color TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- HABIT COMPLETIONS
-- Primary key is (habit_id, date) to allow clean upserts from the frontend
CREATE TABLE public.habit_completions (
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    PRIMARY KEY (habit_id, date)
);

-- MOOD LOGS
-- Primary key is (user_id, date) for daily upserts
CREATE TABLE public.mood_logs (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    note TEXT,
    logged_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, date)
);

-- SLEEP LOGS
-- Primary key is (user_id, date) for daily upserts
CREATE TABLE public.sleep_logs (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours NUMERIC,
    PRIMARY KEY (user_id, date)
);

-- REFLECTIONS (Backward Compatibility)
CREATE TABLE public.reflections (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    content TEXT,
    PRIMARY KEY (user_id, date)
);

-- JOURNAL ENTRIES
CREATE TABLE public.journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT,
    mood INTEGER,
    reflection TEXT,
    wins JSONB DEFAULT '[]'::jsonb,
    struggles JSONB DEFAULT '[]'::jsonb,
    gratitude JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, date)
);

-- ==============================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- 4. CREATE POLICIES
-- ==============================================================

CREATE POLICY "Users can manage their own habits" 
    ON public.habits FOR ALL 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own habit completions" 
    ON public.habit_completions FOR ALL 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own mood logs" 
    ON public.mood_logs FOR ALL 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sleep logs" 
    ON public.sleep_logs FOR ALL 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own reflections" 
    ON public.reflections FOR ALL 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own journal entries" 
    ON public.journal_entries FOR ALL 
    USING (auth.uid() = user_id);
