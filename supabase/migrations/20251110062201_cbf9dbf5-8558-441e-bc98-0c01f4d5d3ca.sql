-- Check admin role for offers creation
-- Update RLS policy to allow admins to insert offers
DROP POLICY IF EXISTS "Admins can manage offers" ON public.offers;

CREATE POLICY "Admins can manage offers"
ON public.offers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));