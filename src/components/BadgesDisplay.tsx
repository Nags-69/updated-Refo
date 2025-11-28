import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Crown, Flame, Zap, Star, DollarSign, TrendingUp, Gem } from "lucide-react";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  earned: boolean;
  earned_at?: string;
}

const iconMap: { [key: string]: any } = {
  Trophy,
  Award,
  Crown,
  Flame,
  Zap,
  Star,
  DollarSign,
  TrendingUp,
  Gem,
};

const BadgesDisplay = () => {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get all badges
    const { data: allBadges } = await supabase
      .from("badges")
      .select("*")
      .order("requirement_value");

    // Get user's earned badges
    const { data: userBadges } = await supabase
      .from("user_badges")
      .select("badge_id, earned_at")
      .eq("user_id", user.id);

    if (allBadges) {
      const badgesWithStatus = allBadges.map(badge => ({
        ...badge,
        earned: userBadges?.some(ub => ub.badge_id === badge.id) || false,
        earned_at: userBadges?.find(ub => ub.badge_id === badge.id)?.earned_at,
      }));
      setBadges(badgesWithStatus as any);
    }
    setLoading(false);
  };

  if (loading) return null;

  const earnedBadges = badges.filter(b => b.earned);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-semibold">Your Badges</h2>
        <Badge variant="secondary">
          {earnedBadges.length}/{badges.length} Unlocked
        </Badge>
      </div>

      {/* Earned Badges */}
      {earnedBadges.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Earned</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {earnedBadges.map((badge) => {
              const IconComponent = iconMap[badge.icon] || Trophy;
              return (
                <Card 
                  key={badge.id} 
                  className="p-4 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                >
                  <div className="flex justify-center mb-2">
                    <div className="p-3 bg-primary/20 rounded-2xl">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{badge.name}</h3>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Complete tasks to earn badges!</p>
      )}

    </div>
  );
};

export default BadgesDisplay;
