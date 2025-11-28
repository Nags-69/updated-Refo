-- Create badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL, -- 'tasks_completed', 'streak_days', 'earnings_reached'
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_badges table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create user_streaks table
CREATE TABLE public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Badges policies
CREATE POLICY "Anyone can view badges"
ON public.badges FOR SELECT
USING (true);

CREATE POLICY "Admins can manage badges"
ON public.badges FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- User badges policies
CREATE POLICY "Users can view own badges"
ON public.user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view all user badges"
ON public.user_badges FOR SELECT
USING (true);

CREATE POLICY "System can insert badges"
ON public.user_badges FOR INSERT
WITH CHECK (true);

-- User streaks policies
CREATE POLICY "Users can view own streak"
ON public.user_streaks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view all streaks"
ON public.user_streaks FOR SELECT
USING (true);

CREATE POLICY "Users can insert own streak"
ON public.user_streaks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
ON public.user_streaks FOR UPDATE
USING (auth.uid() = user_id);

-- Insert default badges
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value) VALUES
('First Steps', 'Complete your first task', 'Trophy', 'tasks_completed', 1),
('Task Master', 'Complete 10 tasks', 'Award', 'tasks_completed', 10),
('Century Club', 'Complete 100 tasks', 'Crown', 'tasks_completed', 100),
('3 Day Streak', 'Maintain a 3-day streak', 'Flame', 'streak_days', 3),
('Week Warrior', 'Maintain a 7-day streak', 'Zap', 'streak_days', 7),
('Month Champion', 'Maintain a 30-day streak', 'Star', 'streak_days', 30),
('First Earnings', 'Earn your first ₹100', 'DollarSign', 'earnings_reached', 100),
('Big Earner', 'Earn ₹1,000 total', 'TrendingUp', 'earnings_reached', 1000),
('Top Performer', 'Earn ₹5,000 total', 'Gem', 'earnings_reached', 5000);

-- Trigger for updating streak updated_at
CREATE TRIGGER update_user_streaks_updated_at
BEFORE UPDATE ON public.user_streaks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();