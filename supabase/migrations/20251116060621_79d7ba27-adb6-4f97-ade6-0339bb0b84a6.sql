-- Fix offers table RLS policy to restrict non-public offers to admins only
DROP POLICY IF EXISTS "Anyone can view public offers" ON public.offers;

CREATE POLICY "Public offers or admin access"
  ON public.offers FOR SELECT
  USING (
    is_public = true 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Fix function search_path issues for security
-- Update handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update handle_chats_updated_at function
CREATE OR REPLACE FUNCTION public.handle_chats_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$function$;