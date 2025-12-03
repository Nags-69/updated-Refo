
-- Recreate Leaderboard as a Table
-- The leaderboard was somehow converted to a VIEW, which doesn't support RLS.
-- We need to drop it and recreate it as a proper TABLE.

-- 1. Drop existing objects (handle both table and view cases)
DROP VIEW IF EXISTS public.leaderboard CASCADE;
DROP TABLE IF EXISTS public.leaderboard CASCADE;

-- 2. Create the table
CREATE TABLE public.leaderboard (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  current_balance DECIMAL(10,2) DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  badges_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboard FOR SELECT
  USING (true);

-- 5. Re-create the update function (ensure it matches the latest logic)
CREATE OR REPLACE FUNCTION public.update_leaderboard_entry()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  user_email TEXT;
  user_earnings DECIMAL(10,2);
  user_balance DECIMAL(10,2);
  user_tasks INTEGER;
BEGIN
  -- Determine user_id based on the table triggering the function
  IF TG_TABLE_NAME = 'profiles' THEN
    target_user_id := NEW.id;
  ELSIF TG_TABLE_NAME = 'wallet' THEN
    target_user_id := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'tasks' THEN
    target_user_id := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'transactions' THEN
    target_user_id := NEW.user_id;
  END IF;

  -- Get latest data
  SELECT email INTO user_email FROM public.profiles WHERE id = target_user_id;
  
  -- Calculate Lifetime Earnings: Sum of all 'earning' and 'bonus' transactions
  SELECT COALESCE(SUM(amount), 0) INTO user_earnings 
  FROM public.transactions 
  WHERE user_id = target_user_id AND type IN ('earning', 'bonus');
  
  -- Get current balance (available for withdrawal)
  SELECT total_balance INTO user_balance FROM public.wallet WHERE user_id = target_user_id;
  
  -- Get completed tasks count
  SELECT COUNT(*) INTO user_tasks FROM public.tasks WHERE user_id = target_user_id AND status = 'completed';

  -- Upsert into leaderboard
  INSERT INTO public.leaderboard (user_id, username, total_earnings, current_balance, tasks_completed, updated_at)
  VALUES (
    target_user_id,
    COALESCE(user_email, 'User'),
    COALESCE(user_earnings, 0),
    COALESCE(user_balance, 0),
    COALESCE(user_tasks, 0),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    username = EXCLUDED.username,
    total_earnings = EXCLUDED.total_earnings,
    current_balance = EXCLUDED.current_balance,
    tasks_completed = EXCLUDED.tasks_completed,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Re-create Triggers
DROP TRIGGER IF EXISTS update_leaderboard_on_profile ON public.profiles;
CREATE TRIGGER update_leaderboard_on_profile
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_leaderboard_entry();

DROP TRIGGER IF EXISTS update_leaderboard_on_wallet ON public.wallet;
CREATE TRIGGER update_leaderboard_on_wallet
  AFTER INSERT OR UPDATE ON public.wallet
  FOR EACH ROW EXECUTE FUNCTION public.update_leaderboard_entry();

DROP TRIGGER IF EXISTS update_leaderboard_on_tasks ON public.tasks;
CREATE TRIGGER update_leaderboard_on_tasks
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_leaderboard_entry();

DROP TRIGGER IF EXISTS update_leaderboard_on_transactions ON public.transactions;
CREATE TRIGGER update_leaderboard_on_transactions
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_leaderboard_entry();

-- 7. Initial Backfill
-- Trigger an update for everyone by touching the profiles table
UPDATE public.profiles SET updated_at = now();
