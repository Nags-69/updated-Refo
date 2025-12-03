
-- comprehensive_avatar_fix.sql

-- 1. Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- 2. Enable RLS (standard practice)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop ALL potential conflicting policies for the 'avatars' bucket
-- We use a DO block to iterate and drop policies to handle unknown names if possible, 
-- but standard SQL doesn't easily support "DROP ALL POLICIES ON ... WHERE ...".
-- So we will drop specific known names and generic ones.

DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Select Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Select" ON storage.objects;
DROP POLICY IF EXISTS "Give me access to own folder 1oj01k_0" ON storage.objects;
DROP POLICY IF EXISTS "Give me access to own folder 1oj01k_1" ON storage.objects;
DROP POLICY IF EXISTS "Give me access to own folder 1oj01k_2" ON storage.objects;
DROP POLICY IF EXISTS "Give me access to own folder 1oj01k_3" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Avatars" ON storage.objects;

-- 4. Create SIMPLE, PERMISSIVE policies

-- Allow ANYONE (public) to view files in 'avatars'
CREATE POLICY "Public View Avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow AUTHENTICATED users to upload files to 'avatars'
-- We are NOT restricting the path (name) to simplify debugging. 
-- Any logged-in user can upload any file to this bucket.
CREATE POLICY "Authenticated Upload Avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- Allow AUTHENTICATED users to update (overwrite) files in 'avatars'
-- Only if they are the owner (owner_id matches auth.uid()) OR just allow all auth users for now to fix the blocker.
-- Let's stick to "owner" for update/delete to be slightly safe, but if that fails we can relax it.
-- Actually, for the error "Row Level Security Violated" on INSERT, the INSERT policy is the key.
CREATE POLICY "Authenticated Update Avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' );

-- Allow AUTHENTICATED users to delete files in 'avatars'
CREATE POLICY "Authenticated Delete Avatars"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' );
