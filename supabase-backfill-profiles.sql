-- ==============================================================
-- KAIZEN - PROFILE BACKFILL SCRIPT
-- Run this in your Supabase SQL Editor to generate profiles 
-- for all existing users who registered before Phase A.
-- ==============================================================

INSERT INTO public.profiles (id, kaizen_id, username, display_name)
SELECT 
    u.id,
    
    -- Generate KZN-XXXX (4 character random hex)
    'KZN-' || upper(substring(md5(random()::text) from 1 for 4)) AS kaizen_id,
    
    -- Generate unique username (cleaned base name + 3 character random hex)
    lower(regexp_replace(COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'user'), '[^a-zA-Z0-9]', '', 'g')) || substring(md5(random()::text) from 1 for 3) AS username,
    
    -- Use their auth name, or their email prefix, or default to 'Seeker'
    COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'Seeker') AS display_name

FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);
