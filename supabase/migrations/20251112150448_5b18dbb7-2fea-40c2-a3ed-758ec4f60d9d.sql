-- Make task-proofs bucket public so images are visible
UPDATE storage.buckets 
SET public = true 
WHERE id = 'task-proofs';

-- Change proof_url to support multiple images (array of text)
ALTER TABLE public.tasks 
ALTER COLUMN proof_url TYPE text[] 
USING CASE 
  WHEN proof_url IS NULL THEN NULL 
  ELSE ARRAY[proof_url] 
END;

-- Create function to delete old task proofs (older than 7 days)
CREATE OR REPLACE FUNCTION delete_old_task_proofs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_task RECORD;
  proof_path text;
BEGIN
  -- Find tasks with proofs older than 7 days
  FOR old_task IN 
    SELECT id, proof_url, user_id
    FROM public.tasks
    WHERE proof_uploaded_at < NOW() - INTERVAL '7 days'
    AND proof_url IS NOT NULL
  LOOP
    -- Delete files from storage
    IF old_task.proof_url IS NOT NULL THEN
      FOREACH proof_path IN ARRAY old_task.proof_url
      LOOP
        -- Extract the storage path from the full URL
        DELETE FROM storage.objects
        WHERE bucket_id = 'task-proofs'
        AND name LIKE '%' || old_task.id || '%';
      END LOOP;
    END IF;
    
    -- Clear proof_url and proof_uploaded_at from task
    UPDATE public.tasks
    SET proof_url = NULL,
        proof_uploaded_at = NULL
    WHERE id = old_task.id;
  END LOOP;
END;
$$;

-- Create a table to track last cleanup time
CREATE TABLE IF NOT EXISTS public.task_cleanup_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_cleanup_at timestamp with time zone NOT NULL DEFAULT now(),
  tasks_cleaned integer DEFAULT 0
);

-- Insert initial record
INSERT INTO public.task_cleanup_log (last_cleanup_at, tasks_cleaned)
VALUES (now(), 0);

-- Enable RLS on cleanup log
ALTER TABLE public.task_cleanup_log ENABLE ROW LEVEL SECURITY;

-- Allow admins to view cleanup log
CREATE POLICY "Admins can view cleanup log"
ON public.task_cleanup_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));