
-- Simple fix that avoids altering table ownership or global settings
-- This script adds NEW, permissive policies. Since Postgres policies are additive (OR logic),
-- this will allow access even if old policies are broken.

-- 1. Make sure bucket exists (safe insert)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop our specific new policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Avatar Upload Policy 2025" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Select Policy 2025" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update Policy 2025" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Delete Policy 2025" ON storage.objects;

-- 3. Create permissive policies
-- Allow ANYONE (public) to view files
CREATE POLICY "Avatar Select Policy 2025"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow AUTHENTICATED users to upload
CREATE POLICY "Avatar Upload Policy 2025"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- Allow AUTHENTICATED users to update their files
CREATE POLICY "Avatar Update Policy 2025"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' );

-- Allow AUTHENTICATED users to delete their files
CREATE POLICY "Avatar Delete Policy 2025"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' );
