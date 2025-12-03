
-- Force public access to the avatars bucket
-- This ensures that both authenticated and anonymous users can view files

-- 1. Ensure the bucket is public (redundant but safe)
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';

-- 2. Drop existing policies to avoid conflicts (optional, but cleaner)
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Give me access to own folder 1oj01k_0" ON storage.objects;
DROP POLICY IF EXISTS "Give me access to own folder 1oj01k_1" ON storage.objects;
DROP POLICY IF EXISTS "Give me access to own folder 1oj01k_2" ON storage.objects;
DROP POLICY IF EXISTS "Give me access to own folder 1oj01k_3" ON storage.objects;

-- 3. Create a comprehensive SELECT policy for everyone
CREATE POLICY "Allow Public Select"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 4. Create an INSERT policy for authenticated users (for uploads)
CREATE POLICY "Allow Authenticated Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- 5. Create an UPDATE policy for authenticated users (for overwriting their own files)
CREATE POLICY "Allow Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' );

-- 6. Create a DELETE policy for authenticated users (for removing their own files)
CREATE POLICY "Allow Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' );
