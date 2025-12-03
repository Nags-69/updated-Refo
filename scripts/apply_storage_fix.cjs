
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rpjdneupntgmztxdgvwx.supabase.co";
const supabaseKey = "sb_secret_pqfBAOM61p-ii7-C-QK97A_jvtMKFz9"; // Secret key

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
