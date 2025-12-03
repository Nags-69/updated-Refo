-- Add avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add avatar_url to leaderboard
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Policy to allow authenticated users to update their avatars
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Policy to allow everyone to view avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'avatars' );

-- Update the leaderboard sync function to include avatar_url
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
  END IF;

  -- Get latest data
  SELECT email, avatar_url INTO user_email, user_avatar FROM public.profiles WHERE id = target_user_id;
  SELECT total_balance, total_balance INTO user_earnings, user_balance FROM public.wallet WHERE user_id = target_user_id;
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
