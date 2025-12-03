import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file manually
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
// Use ONLY the publishable key to simulate browser/anon access
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPresets() {
    console.log('Listing files in "avatars" bucket, folder "presets"...');

    const { data, error } = await supabase.storage.from('avatars').list('presets');

    if (error) {
        console.error('Error listing presets:', error);
    } else {
        console.log('Found presets:', data);
        if (data.length === 0) {
            console.log('WARNING: No files found in presets folder.');
        }
    }
}

checkPresets();
