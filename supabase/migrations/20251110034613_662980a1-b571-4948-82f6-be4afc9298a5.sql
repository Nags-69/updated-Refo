-- Add username field to profiles table
ALTER TABLE public.profiles
ADD COLUMN username TEXT UNIQUE;

-- Create index on username for faster lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Update RLS policies for admin to manage offers
DROP POLICY IF EXISTS "Anyone can view public offers" ON public.offers;

CREATE POLICY "Anyone can view public offers"
ON public.offers
FOR SELECT
USING ((is_public = true) OR (auth.uid() IS NOT NULL));

CREATE POLICY "Admins can manage offers"
ON public.offers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies for admin to manage tasks
CREATE POLICY "Admins can update tasks"
ON public.tasks
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies for admin to manage transactions
CREATE POLICY "Admins can create transactions"
ON public.transactions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies for admin to manage wallet
CREATE POLICY "Admins can update wallets"
ON public.wallet
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));