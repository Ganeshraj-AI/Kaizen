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
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'friends', 'public')),
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
-- 4. SOCIAL TABLES (PHASES A-E)
-- ==============================================================

-- PROFILES
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    kaizen_id TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    private_growth_mode BOOLEAN DEFAULT false,
    default_visibility TEXT DEFAULT 'private' CHECK (default_visibility IN ('private', 'friends', 'public')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- FRIEND REQUESTS
CREATE TABLE public.friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(sender_id, receiver_id)
);

-- FRIENDSHIPS
CREATE TABLE public.friendships (
    user_id_1 UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id_2 UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id_1, user_id_2),
    CHECK (user_id_1 < user_id_2)
);

-- SHARED REFLECTIONS
CREATE TABLE public.shared_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    journal_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    snippet_type TEXT CHECK (snippet_type IN ('quote', 'gratitude', 'summary')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- CHALLENGE GROUPS
CREATE TABLE public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    visibility TEXT DEFAULT 'invite_only' CHECK (visibility IN ('invite_only', 'friends')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- CHALLENGE MEMBERS
CREATE TABLE public.challenge_members (
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (challenge_id, user_id)
);

-- ACTIVITY SNAPSHOTS
CREATE TABLE public.activity_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('streak', 'milestone', 'challenge_completed', 'habit_bundle')),
    meta_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_snapshots ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- 5. AUTH TRIGGERS (Auto-create Profile)
-- ==============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_kaizen_id TEXT;
    new_username TEXT;
    base_name TEXT;
BEGIN
    -- Generate KZN-XXXX
    new_kaizen_id := 'KZN-' || upper(substring(md5(random()::text) from 1 for 4));
    
    -- Generate username
    base_name := COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'user');
    new_username := lower(regexp_replace(base_name, '[^a-zA-Z0-9]', '', 'g')) || substring(md5(random()::text) from 1 for 3);

    INSERT INTO public.profiles (id, kaizen_id, username, display_name)
    VALUES (
        new.id,
        new_kaizen_id,
        new_username,
        COALESCE(new.raw_user_meta_data->>'name', 'Seeker')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================
-- 6. CREATE POLICIES
-- ==============================================================

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone unless private" 
    ON public.profiles FOR SELECT 
    USING (private_growth_mode = false OR auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Habits
CREATE POLICY "Users can view own and friends/public habits" 
    ON public.habits FOR SELECT 
    USING (
        auth.uid() = user_id 
        OR visibility = 'public' 
        OR (visibility = 'friends' AND EXISTS (
            SELECT 1 FROM public.friendships f 
            WHERE (f.user_id_1 = auth.uid() AND f.user_id_2 = public.habits.user_id) 
               OR (f.user_id_2 = auth.uid() AND f.user_id_1 = public.habits.user_id)
        ))
    );

CREATE POLICY "Users can manage their own habits" 
    ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own habits update" 
    ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own habits delete" 
    ON public.habits FOR DELETE USING (auth.uid() = user_id);

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

-- Friendships
CREATE POLICY "Users can view their own friendships"
    ON public.friendships FOR SELECT
    USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Friend Requests
CREATE POLICY "Users can view their own requests"
    ON public.friend_requests FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send requests"
    ON public.friend_requests FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received requests"
    ON public.friend_requests FOR UPDATE
    USING (auth.uid() = receiver_id);

-- Shared Reflections
CREATE POLICY "View shared reflections of friends"
    ON public.shared_reflections FOR SELECT
    USING (
        auth.uid() = user_id OR EXISTS (
            SELECT 1 FROM public.friendships f 
            WHERE (f.user_id_1 = auth.uid() AND f.user_id_2 = public.shared_reflections.user_id) 
               OR (f.user_id_2 = auth.uid() AND f.user_id_1 = public.shared_reflections.user_id)
        )
    );

CREATE POLICY "Manage own shared reflections"
    ON public.shared_reflections FOR ALL
    USING (auth.uid() = user_id);

-- Activity Snapshots
CREATE POLICY "View activity of friends"
    ON public.activity_snapshots FOR SELECT
    USING (
        auth.uid() = user_id OR EXISTS (
            SELECT 1 FROM public.friendships f 
            WHERE (f.user_id_1 = auth.uid() AND f.user_id_2 = public.activity_snapshots.user_id) 
               OR (f.user_id_2 = auth.uid() AND f.user_id_1 = public.activity_snapshots.user_id)
        )
    );

CREATE POLICY "Manage own activity"
    ON public.activity_snapshots FOR ALL
    USING (auth.uid() = user_id);

