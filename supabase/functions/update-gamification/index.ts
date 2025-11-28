import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { userId } = await req.json();
    console.log('Updating gamification for user:', userId);

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingStreak } = await supabaseClient
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingStreak) {
      const lastActivity = existingStreak.last_activity_date;
      let newStreak = existingStreak.current_streak;

      if (lastActivity !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastActivity === yesterdayStr) {
          // Consecutive day
          newStreak += 1;
        } else if (lastActivity !== today) {
          // Streak broken
          newStreak = 1;
        }

        const longestStreak = Math.max(existingStreak.longest_streak, newStreak);

        await supabaseClient
          .from('user_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_activity_date: today,
          })
          .eq('user_id', userId);

        console.log('Updated streak:', newStreak);
      }
    } else {
      // Create new streak
      await supabaseClient
        .from('user_streaks')
        .insert({
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
        });
      console.log('Created new streak');
    }

    // Check and award badges
    await checkAndAwardBadges(supabaseClient, userId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating gamification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

async function checkAndAwardBadges(supabaseClient: any, userId: string) {
  // Get all badges
  const { data: allBadges } = await supabaseClient
    .from('badges')
    .select('*');

  // Get user's current badges
  const { data: userBadges } = await supabaseClient
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedBadgeIds = userBadges?.map((b: any) => b.badge_id) || [];

  for (const badge of allBadges || []) {
    if (earnedBadgeIds.includes(badge.id)) continue;

    let shouldAward = false;

    if (badge.requirement_type === 'tasks_completed') {
      const { count } = await supabaseClient
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'verified');

      shouldAward = (count || 0) >= badge.requirement_value;
    } else if (badge.requirement_type === 'streak_days') {
      const { data: streak } = await supabaseClient
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', userId)
        .maybeSingle();

      shouldAward = (streak?.current_streak || 0) >= badge.requirement_value;
    } else if (badge.requirement_type === 'earnings_reached') {
      const { data: wallet } = await supabaseClient
        .from('wallet')
        .select('total_balance')
        .eq('user_id', userId)
        .maybeSingle();

      shouldAward = Number(wallet?.total_balance || 0) >= badge.requirement_value;
    }

    if (shouldAward) {
      await supabaseClient
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id,
        });
      console.log('Awarded badge:', badge.name);
    }
  }
}
