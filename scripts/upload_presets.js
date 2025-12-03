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
// Try using the secret key first, fallback to publishable
const supabaseKey = env.VITE_SUPABASE_PROJECT_ID || env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const imgDir = path.resolve(__dirname, '../src/img');

async function uploadPresets() {
    console.log('Checking connection and buckets...');

    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
        console.error('Error listing buckets:', bucketError.message);
        return;
    }

    console.log('Buckets:', buckets.map(b => b.name));

    const avatarsBucket = buckets.find(b => b.name === 'avatars');
    if (!avatarsBucket) {
        console.log('Avatars bucket not found. Attempting to create...');
        const { data, error } = await supabase.storage.createBucket('avatars', { public: true });
        if (error) {
            console.error('Failed to create bucket:', error.message);
            return;
        }
        console.log('Created avatars bucket.');
    } else {
        console.log('Avatars bucket exists.');
    }

    console.log('Starting upload of presets...');

    try {
        const files = fs.readdirSync(imgDir);

        for (const file of files) {
            if (file.match(/\.(png|jpg|jpeg|svg|webp)$/i)) {
                const filePath = path.join(imgDir, file);
                const fileBuffer = fs.readFileSync(filePath);
                const storagePath = `presets/${file}`;

                console.log(`Uploading ${file} to ${storagePath}...`);

                const { data, error } = await supabase.storage
                    .from('avatars')
                    .upload(storagePath, fileBuffer, {
                        contentType: 'image/png',
                        upsert: true
                    });

                if (error) {
                    console.error(`Failed to upload ${file}:`, error.message);
                } else {
                    console.log(`Successfully uploaded ${file}`);
                }
            }
        }
        console.log('Upload complete.');
    } catch (err) {
        console.error('Error reading directory or uploading:', err);
    }
}

uploadPresets();
