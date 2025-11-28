import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Flame, Award } from "lucide-react";

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

const StreakDisplay = () => {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setStreak(data as any);
    } else {
      // Initialize streak for new user
      const { data: newStreak } = await supabase
        .from("user_streaks")
        .insert({ user_id: user.id, current_streak: 0, longest_streak: 0 })
        .select()
        .single();
      setStreak(newStreak as any);
    }
    setLoading(false);
  };

  if (loading || !streak) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-500/5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-500/20 rounded-2xl">
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-heading font-bold">
              {streak.current_streak} {streak.current_streak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-primary/20 to-primary/5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-2xl">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Best Streak</p>
            <p className="text-2xl font-heading font-bold">
              {streak.longest_streak} {streak.longest_streak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StreakDisplay;
