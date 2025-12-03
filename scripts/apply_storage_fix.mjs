
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), '.env')));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_PROJECT_ID; // Using the secret key

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStorage() {
    console.log('Attempting to fix storage configuration...');

    // 1. Update bucket to be public
    const { data: bucket, error: bucketError } = await supabase
        .storage
        .updateBucket('avatars', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        });

    if (bucketError) {
        console.error('Error updating bucket:', bucketError);
    } else {
        console.log('Bucket "avatars" updated successfully (set to public).');
    }

    // 2. List files to verify access
    const { data: files, error: listError } = await supabase
        .storage
        .from('avatars')
        .list('presets');

    if (listError) {
        console.error('Error listing presets:', listError);
    } else {
        console.log('Successfully listed presets:', files.length, 'files found.');
    }
}

fixStorage();
