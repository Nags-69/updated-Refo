import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, TrendingUp, Flame } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_earnings: number;
  current_balance: number;
  tasks_completed: number;
  current_streak: number;
  badges_count: number;
  rank: number;
  avatar_url?: string;
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser();
    loadLeaderboard();

    // Set up realtime updates
    const channel = supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet' }, () => loadLeaderboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => loadLeaderboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => loadLeaderboard())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('total_earnings', { ascending: false })
        .limit(50);

      if (error) throw error;

      const rankedData = (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

      setLeaderboard(rankedData);
    } catch (error) {
      console.error("Leaderboard load error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Updated Masking Logic: Matches length of hidden characters
  const getMaskedName = (name: string, userId: string) => {
    // 1. If it's the current user, show full name
    if (userId === currentUserId) return name;

    // 2. Handle empty or very short names
    if (!name) return "Unknown";
    if (name.length <= 5) {
      // For short names (e.g., "Alice"), mask the middle
      // "Alice" -> "A***e"
      return name.charAt(0) + "*".repeat(Math.max(0, name.length - 2)) + name.slice(-1);
    }

    // 3. For longer names: Show First 2 + Stars (length - 5) + Last 3
    // Example: "naveen karakikatti" (18 chars) -> "na" (2) + 13 stars + "tti" (3)
    const firstTwo = name.slice(0, 2);
    const lastThree = name.slice(-3);
    const middleStars = "*".repeat(name.length - 5);

    return `${firstTwo}${middleStars}${lastThree}`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-heading font-bold">Leaderboard</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-40 rounded-lg -mt-4" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8 items-end">
                {/* 2nd Place */}
                <Card className="p-2 md:p-6 text-center order-1 bg-gradient-to-br from-muted/50 to-muted/10 border-none shadow-md">
                  <div className="flex justify-center mb-2 md:mb-3">
                    <Medal className="h-8 w-8 md:h-12 md:w-12 text-gray-400" />
                  </div>
                  <Avatar className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-2 md:mb-3 ring-4 ring-muted">
                    {leaderboard[1].avatar_url ? (
                      <img src={leaderboard[1].avatar_url} alt={leaderboard[1].username} className="h-full w-full object-cover" />
                    ) : (
                      <AvatarFallback className="text-sm md:text-lg">
                        {(leaderboard[1].username || "??").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <h3 className="font-bold text-sm md:text-base truncate max-w-[100px] md:max-w-full mx-auto">
                    {getMaskedName(leaderboard[1].username, leaderboard[1].user_id)}
                  </h3>
                  <p className="text-lg md:text-2xl font-heading font-bold text-primary mt-1 md:mt-2">
                    ₹{leaderboard[1].total_earnings.toFixed(0)}
                  </p>
                </Card>

                {/* 1st Place */}
                <Card className="p-2 md:p-6 text-center order-2 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20 shadow-lg transform scale-110 z-10 mb-4">
                  <div className="flex justify-center mb-2 md:mb-3">
                    <Trophy className="h-10 w-10 md:h-14 md:w-14 text-yellow-500" />
                  </div>
                  <Avatar className="h-16 w-16 md:h-20 md:w-20 mx-auto mb-2 md:mb-3 ring-4 ring-primary">
                    {leaderboard[0].avatar_url ? (
                      <img src={leaderboard[0].avatar_url} alt={leaderboard[0].username} className="h-full w-full object-cover" />
                    ) : (
                      <AvatarFallback className="text-lg md:text-xl bg-primary text-primary-foreground">
                        {(leaderboard[0].username || "??").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <h3 className="font-bold text-sm md:text-base truncate max-w-[100px] md:max-w-full mx-auto">
                    {getMaskedName(leaderboard[0].username, leaderboard[0].user_id)}
                  </h3>
                  <p className="text-xl md:text-3xl font-heading font-bold text-primary mt-1 md:mt-2">
                    ₹{leaderboard[0].total_earnings.toFixed(0)}
                  </p>
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-700 text-[10px] md:text-xs font-medium">
                    👑 Leader
                  </div>
                </Card>

                {/* 3rd Place */}
                <Card className="p-2 md:p-6 text-center order-3 bg-gradient-to-br from-muted/50 to-muted/10 border-none shadow-md">
                  <div className="flex justify-center mb-2 md:mb-3">
                    <Medal className="h-8 w-8 md:h-12 md:w-12 text-amber-600" />
                  </div>
                  <Avatar className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-2 md:mb-3 ring-4 ring-muted">
                    {leaderboard[2].avatar_url ? (
                      <img src={leaderboard[2].avatar_url} alt={leaderboard[2].username} className="h-full w-full object-cover" />
                    ) : (
                      <AvatarFallback className="text-sm md:text-lg">
                        {(leaderboard[2].username || "??").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <h3 className="font-bold text-sm md:text-base truncate max-w-[100px] md:max-w-full mx-auto">
                    {getMaskedName(leaderboard[2].username, leaderboard[2].user_id)}
                  </h3>
                  <p className="text-lg md:text-2xl font-heading font-bold text-primary mt-1 md:mt-2">
                    ₹{leaderboard[2].total_earnings.toFixed(0)}
                  </p>
                </Card>
              </div>
            )}

            {/* Full Leaderboard List */}
            <div className="space-y-3">
              {leaderboard.length > 0 ? (
                leaderboard.slice(leaderboard.length >= 3 ? 3 : 0).map((entry) => (
                  <Card
                    key={entry.user_id}
                    className={`p-4 transition-all ${entry.user_id === currentUserId
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-accent/50'
                      }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-8 sm:w-12 flex justify-center text-muted-foreground font-bold shrink-0">
                          #{entry.rank}
                        </div>
                        <Avatar className="h-10 w-10 shrink-0">
                          {entry.avatar_url ? (
                            <img src={entry.avatar_url} alt={entry.username} className="h-full w-full object-cover" />
                          ) : (
                            <AvatarFallback className="bg-muted">
                              {(entry.username || "??").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold flex items-center gap-2 truncate">
                            <span className="truncate">
                              {getMaskedName(entry.username, entry.user_id)}
                            </span>
                            {entry.user_id === currentUserId && (
                              <Badge variant="secondary" className="text-[10px] h-5 shrink-0">You</Badge>
                            )}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {entry.tasks_completed} tasks
                            </span>
                            {entry.current_streak > 0 && (
                              <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 rounded">
                                <Flame className="h-3 w-3" />
                                {entry.current_streak}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right pl-12 sm:pl-0 shrink-0">
                        <p className="text-lg font-heading font-bold text-primary">
                          ₹{entry.total_earnings.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center bg-muted/20">
                  <p className="text-muted-foreground">
                    No leaderboard data available yet.
                  </p>
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Leaderboard;