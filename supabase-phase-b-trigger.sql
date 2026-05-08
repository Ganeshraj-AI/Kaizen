-- ==============================================================
-- KAIZEN - PHASE B: FRIENDSHIP TRIGGER
-- Run this in your Supabase SQL Editor.
-- This automatically creates a friendship row when a request is accepted.
-- ==============================================================

CREATE OR REPLACE FUNCTION public.handle_friend_request_accepted()
RETURNS trigger AS $$
BEGIN
    -- If status changed to 'accepted'
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Insert into friendships, ensuring user_id_1 is always strictly less than user_id_2
        IF NEW.sender_id < NEW.receiver_id THEN
            INSERT INTO public.friendships (user_id_1, user_id_2) 
            VALUES (NEW.sender_id, NEW.receiver_id) 
            ON CONFLICT DO NOTHING;
        ELSE
            INSERT INTO public.friendships (user_id_1, user_id_2) 
            VALUES (NEW.receiver_id, NEW.sender_id) 
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists to allow clean recreations
DROP TRIGGER IF EXISTS on_friend_request_accepted ON public.friend_requests;

-- Create trigger
CREATE TRIGGER on_friend_request_accepted
    AFTER UPDATE ON public.friend_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_friend_request_accepted();

-- Add a Delete policy to friendships if not present, so users can remove friends
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'friendships' AND policyname = 'Users can remove their own friendships'
    ) THEN
        CREATE POLICY "Users can remove their own friendships"
            ON public.friendships FOR DELETE
            USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
    END IF;
END $$;
