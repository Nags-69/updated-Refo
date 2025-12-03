
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rpjdneupntgmztxdgvwx.supabase.co";
const supabaseKey = "sb_secret_pqfBAOM61p-ii7-C-QK97A_jvtMKFz9"; // Secret Key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    console.log("Attempting upload with ANON key...");

    // Create a dummy file buffer
    const fileBuffer = Buffer.from('Hello World');

    const fileName = `test_${Date.now()}.png`; // Changed extension to .png

    // Try to upload to 'avatars' bucket
    const { data, error } = await supabase
        .storage
        .from('avatars')
        .upload(`debug/${fileName}`, fileBuffer, {
            contentType: 'image/png', // Changed MIME type
            upsert: true
        });

    if (error) {
        console.error("Upload FAILED:", error);
    } else {
        console.log("Upload SUCCESS:", data);
    }
}

testUpload();
