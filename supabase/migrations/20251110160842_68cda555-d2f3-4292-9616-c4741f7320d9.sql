-- Add play_store_url and instructions to offers table
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS play_store_url TEXT,
ADD COLUMN IF NOT EXISTS instructions TEXT[];