-- Create payout_requests table for withdrawal tracking
CREATE TABLE public.payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payout_method TEXT NOT NULL CHECK (payout_method IN ('upi', 'bank')),
  upi_id TEXT,
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  bank_account_holder TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_upi_details CHECK (
    (payout_method = 'upi' AND upi_id IS NOT NULL) OR payout_method != 'upi'
  ),
  CONSTRAINT valid_bank_details CHECK (
    (payout_method = 'bank' AND bank_account_number IS NOT NULL AND bank_ifsc_code IS NOT NULL AND bank_account_holder IS NOT NULL) OR payout_method != 'bank'
  )
);

-- Enable RLS
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own payout requests
CREATE POLICY "Users can create own payout requests"
ON public.payout_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own payout requests
CREATE POLICY "Users can view own payout requests"
ON public.payout_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all payout requests
CREATE POLICY "Admins can view all payout requests"
ON public.payout_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update payout requests
CREATE POLICY "Admins can update payout requests"
ON public.payout_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));