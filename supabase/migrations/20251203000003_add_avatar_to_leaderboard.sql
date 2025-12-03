
-- Add avatar_url to leaderboard
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update the function to sync avatar_url
CREATE OR REPLACE FUNCTION public.update_leaderboard_entry()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  user_email TEXT;
  user_avatar TEXT;
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
  SELECT email, avatar_url INTO user_email, user_avatar FROM public.profiles WHERE id = target_user_id;
  
  -- Calculate Lifetime Earnings
  SELECT COALESCE(SUM(amount), 0) INTO user_earnings 
  FROM public.transactions 
  WHERE user_id = target_user_id AND type IN ('earning', 'bonus');
  
  -- Get current balance
  SELECT total_balance INTO user_balance FROM public.wallet WHERE user_id = target_user_id;
  
  -- Get completed tasks count
  SELECT COUNT(*) INTO user_tasks FROM public.tasks WHERE user_id = target_user_id AND status = 'completed';

  -- Upsert into leaderboard
  INSERT INTO public.leaderboard (user_id, username, avatar_url, total_earnings, current_balance, tasks_completed, updated_at)
  VALUES (
    target_user_id,
    COALESCE(user_email, 'User'),
    user_avatar,
    COALESCE(user_earnings, 0),
    COALESCE(user_balance, 0),
    COALESCE(user_tasks, 0),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    total_earnings = EXCLUDED.total_earnings,
    current_balance = EXCLUDED.current_balance,
    tasks_completed = EXCLUDED.tasks_completed,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill avatar_url
UPDATE public.leaderboard l
SET avatar_url = p.avatar_url
FROM public.profiles p
WHERE l.user_id = p.id;
