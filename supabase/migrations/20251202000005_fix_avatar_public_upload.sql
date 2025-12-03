
-- Allow PUBLIC (everyone) to upload to avatars bucket
-- This bypasses the need for authenticated role checks
-- This is an additive policy, so it will work even if other policies fail.

CREATE POLICY "Public Upload Avatars 2025"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'avatars' );
