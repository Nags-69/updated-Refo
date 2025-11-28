-- Fix 1: Add SET search_path to handle_new_user() function to prevent privilege escalation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.wallet (user_id, total_balance, pending_balance)
  VALUES (NEW.id, 0, 0);
  
  INSERT INTO public.affiliate_links (user_id, unique_code)
  VALUES (NEW.id, SUBSTRING(NEW.id::TEXT FROM 1 FOR 8));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 2: Add INSERT policy for profiles table
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);