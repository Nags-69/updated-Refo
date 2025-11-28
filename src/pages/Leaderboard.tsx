import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, TrendingUp } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface LeaderboardEntry {
  user_id: string;
  username: string;
  email: string;
  total_earnings: number;
  current_balance: number;
  tasks_completed: number;
  current_streak: number;
  badges_count: number;
  rank: number;
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
    getCurrentUser();

    // Set up realtime updates
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet'
        },
        () => {
          loadLeaderboard();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          loadLeaderboard();
        }
      )
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
    // Get all users with their wallet totals and task counts
    const { data: walletsData } = await supabase
      .from("wallet")
      .select("user_id, total_balance");

    if (!walletsData) return;

    // Get task counts for each user (only verified tasks)
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("user_id")
      .eq("status", "verified");

    // Get streaks for each user
    const { data: streaksData } = await supabase
      .from("user_streaks")
      .select("user_id, current_streak");

    // Get badge counts for each user
    const { data: badgesData } = await supabase
      .from("user_badges")
      .select("user_id");

    // Get profiles
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username, email");

    // Get all completed transactions (withdrawals) for each user
    const { data: transactionsData } = await supabase
      .from("transactions")
      .select("user_id, amount")
      .eq("status", "completed")
      .eq("type", "withdrawal");

    // Combine data
    const leaderboardData = walletsData.map((wallet, index) => {
      const profile = profilesData?.find(p => p.id === wallet.user_id);
      const tasks = tasksData?.filter(t => t.user_id === wallet.user_id).length || 0;
      const streak = streaksData?.find(s => s.user_id === wallet.user_id)?.current_streak || 0;
      const badges = badgesData?.filter(b => b.user_id === wallet.user_id).length || 0;
      
      // Calculate total withdrawals for this user
      const completedPayouts = transactionsData?.filter(t => t.user_id === wallet.user_id)
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      // Total earnings = current balance + completed withdrawals
      const totalEarnings = Number(wallet.total_balance) + completedPayouts;

      return {
        user_id: wallet.user_id,
        username: profile?.username || profile?.email?.split('@')[0] || 'User',
        email: profile?.email || '',
        total_earnings: totalEarnings,
        current_balance: Number(wallet.total_balance),
        tasks_completed: tasks,
        current_streak: streak,
        badges_count: badges,
        rank: index + 1,
      };
    });

    // Sort by total earnings
    leaderboardData.sort((a, b) => b.total_earnings - a.total_earnings);
    
    // Update ranks
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    setLeaderboard(leaderboardData.slice(0, 50));
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

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* 2nd Place */}
            <Card className="p-6 text-center order-1 bg-gradient-to-br from-muted/50 to-muted/10">
              <div className="flex justify-center mb-3">
                <Medal className="h-12 w-12 text-gray-400" />
              </div>
              <Avatar className="h-16 w-16 mx-auto mb-3 ring-4 ring-muted">
                <AvatarFallback className="text-lg">
                  {leaderboard[1].username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold truncate">{leaderboard[1].username}</h3>
              <p className="text-2xl font-heading font-bold text-primary mt-2">
                ₹{leaderboard[1].total_earnings.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Wallet: ₹{leaderboard[1].current_balance.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                {leaderboard[1].tasks_completed} tasks
              </p>
            </Card>

            {/* 1st Place */}
            <Card className="p-6 text-center order-2 bg-gradient-to-br from-primary/20 to-primary/5 scale-105">
              <div className="flex justify-center mb-3">
                <Trophy className="h-14 w-14 text-yellow-500" />
              </div>
              <Avatar className="h-20 w-20 mx-auto mb-3 ring-4 ring-primary">
                <AvatarFallback className="text-xl">
                  {leaderboard[0].username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold truncate">{leaderboard[0].username}</h3>
              <p className="text-3xl font-heading font-bold text-primary mt-2">
                ₹{leaderboard[0].total_earnings.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Wallet: ₹{leaderboard[0].current_balance.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                {leaderboard[0].tasks_completed} tasks
              </p>
            </Card>

            {/* 3rd Place */}
            <Card className="p-6 text-center order-3 bg-gradient-to-br from-muted/50 to-muted/10">
              <div className="flex justify-center mb-3">
                <Medal className="h-12 w-12 text-amber-600" />
              </div>
              <Avatar className="h-16 w-16 mx-auto mb-3 ring-4 ring-muted">
                <AvatarFallback className="text-lg">
                  {leaderboard[2].username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold truncate">{leaderboard[2].username}</h3>
              <p className="text-2xl font-heading font-bold text-primary mt-2">
                ₹{leaderboard[2].total_earnings.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Wallet: ₹{leaderboard[2].current_balance.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                {leaderboard[2].tasks_completed} tasks
              </p>
            </Card>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="space-y-3">
          {leaderboard.slice(3).map((entry) => (
            <Card 
              key={entry.user_id} 
              className={`p-4 transition-all ${
                entry.user_id === currentUserId 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-accent/50'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 sm:w-12 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarFallback>
                      {entry.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      {entry.username}
                      {entry.user_id === currentUserId && (
                        <Badge variant="secondary">You</Badge>
                      )}
                    </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {entry.tasks_completed} tasks
                        </span>
                      </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-heading font-bold text-primary">
                    ₹{entry.total_earnings.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Wallet: ₹{entry.current_balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No data available yet</p>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Leaderboard;
