
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Use anon key to test RLS

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeaderboard() {
    console.log('Checking leaderboard data...');
    const { data, error, count } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error fetching leaderboard:', error);
    } else {
        console.log(`Found ${count} entries in leaderboard.`);
        if (data && data.length > 0) {
            console.log('First entry:', data[0]);
        } else {
            console.log('Leaderboard is empty.');
        }
    }
}

checkLeaderboard();
