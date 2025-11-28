import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Link2, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Overview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReferrals: 0,
    pendingTasks: 0,
    completedPayouts: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [profilesResult, affiliatesResult, tasksResult, transactionsResult] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("affiliate_links").select("conversions"),
      supabase.from("tasks").select("status", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("transactions").select("status", { count: "exact", head: true }).eq("status", "completed"),
    ]);

    const totalReferrals = affiliatesResult.data?.reduce((sum, link) => sum + (link.conversions || 0), 0) || 0;

    setStats({
      totalUsers: profilesResult.count || 0,
      totalReferrals,
      pendingTasks: tasksResult.count || 0,
      completedPayouts: transactionsResult.count || 0,
    });
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Total Referrals",
      value: stats.totalReferrals,
      icon: Link2,
      color: "text-success",
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks,
      icon: Clock,
      color: "text-muted-foreground",
    },
    {
      title: "Completed Payouts",
      value: stats.completedPayouts,
      icon: CheckCircle,
      color: "text-success",
    },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Overview;
