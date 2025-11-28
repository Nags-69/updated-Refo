-- Create storage bucket for task proof screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-proofs',
  'task-proofs',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Allow users to upload their own task proofs
CREATE POLICY "Users can upload own task proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own task proofs
CREATE POLICY "Users can view own task proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all task proofs
CREATE POLICY "Admins can view all task proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-proofs' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add column to track when proof was uploaded
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS proof_uploaded_at timestamp with time zone;