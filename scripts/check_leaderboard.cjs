
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rpjdneupntgmztxdgvwx.supabase.co";
const supabaseKey = "sb_publishable_ouMhuwMOmMwhZ63uxLxMHw_8k59gzXy";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeaderboard() {
    console.log('Checking leaderboard data...');
    const { data, error, count } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact' })
        .order('total_earnings', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching leaderboard:', error);
    } else {
        console.log(`Found ${count} entries in leaderboard.`);
        if (data && data.length > 0) {
            console.log('Top 5 entries:');
            data.forEach(entry => {
                console.log(`User: ${entry.username}, Earnings: ${entry.total_earnings}, Tasks: ${entry.tasks_completed}`);
            });
        } else {
            console.log('Leaderboard is empty.');
        }
    }
}

checkLeaderboard();
