
-- Fix Leaderboard Permissions
-- Ensure anon and authenticated roles can read the leaderboard

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on leaderboard table
GRANT SELECT ON TABLE public.leaderboard TO anon, authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Re-create the select policy to be sure
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard;
CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboard FOR SELECT
  USING (true);

-- Force a refresh of the leaderboard data just in case
UPDATE public.profiles SET updated_at = now();
