CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_unique_code TEXT;
BEGIN
  -- Insert basic user info into the profiles table
  INSERT INTO public.profiles (id, email, phone)
  VALUES (NEW.id, NEW.email, NEW.phone);
  
  -- Create a wallet for the new user
  INSERT INTO public.wallet (user_id)
  VALUES (NEW.id);
  
  -- Generate a unique affiliate code, retrying if a collision occurs
  LOOP
    -- Generate a random 8-character alphanumeric code
    new_unique_code := SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8);
    -- Check if the code already exists
    IF NOT EXISTS (SELECT 1 FROM public.affiliate_links WHERE unique_code = new_unique_code) THEN
      -- If it's unique, exit the loop
      EXIT;
    END IF;
  END LOOP;
  
  -- Insert the new, unique affiliate link
  INSERT INTO public.affiliate_links (user_id, unique_code)
  VALUES (NEW.id, new_unique_code);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
