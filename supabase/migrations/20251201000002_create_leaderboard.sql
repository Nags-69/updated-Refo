-- Create leaderboard table
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

-- Enable RLS
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read leaderboard
CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboard FOR SELECT
  USING (true);

-- Function to update leaderboard
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
  END IF;

  -- Get latest data
  SELECT email INTO user_email FROM public.profiles WHERE id = target_user_id;
  SELECT total_balance, total_balance INTO user_earnings, user_balance FROM public.wallet WHERE user_id = target_user_id; -- Assuming current_balance = total_balance for now
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

-- Triggers
CREATE TRIGGER update_leaderboard_on_profile
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_leaderboard_entry();

CREATE TRIGGER update_leaderboard_on_wallet
  AFTER INSERT OR UPDATE ON public.wallet
  FOR EACH ROW EXECUTE FUNCTION public.update_leaderboard_entry();

CREATE TRIGGER update_leaderboard_on_tasks
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_leaderboard_entry();

-- Initial Backfill
INSERT INTO public.leaderboard (user_id, username, total_earnings, current_balance, tasks_completed, updated_at)
SELECT 
  p.id,
  p.email,
  COALESCE(w.total_balance, 0),
  COALESCE(w.total_balance, 0),
  (SELECT COUNT(*) FROM public.tasks t WHERE t.user_id = p.id AND t.status = 'completed'),
  now()
FROM public.profiles p
LEFT JOIN public.wallet w ON p.id = w.user_id
ON CONFLICT (user_id) DO NOTHING;
