
-- Fix RLS for transactions table
-- Allow authenticated users to view and insert transactions

-- 1. Enable RLS (good practice)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 2. Create policy to allow ALL operations for authenticated users
-- This is necessary for the Admin panel to add/update transactions
-- and for users to view their own history (though we might want to refine this later)

CREATE POLICY "Enable all access for authenticated users"
ON public.transactions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
