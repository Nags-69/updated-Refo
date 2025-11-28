-- Fix search_path for security - update handle_chats_updated_at function
CREATE OR REPLACE FUNCTION public.handle_chats_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$;