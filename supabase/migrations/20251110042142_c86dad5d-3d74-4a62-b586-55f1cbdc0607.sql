-- Add trigger to automatically update last_updated in chats table
CREATE OR REPLACE FUNCTION public.handle_chats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for chats table
DROP TRIGGER IF EXISTS update_chats_last_updated ON public.chats;
CREATE TRIGGER update_chats_last_updated
  BEFORE UPDATE ON public.chats
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_chats_updated_at();