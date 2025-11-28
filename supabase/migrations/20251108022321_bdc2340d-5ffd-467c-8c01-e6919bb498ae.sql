-- Create chats table
CREATE TABLE public.chats (
  chat_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  active_responder TEXT NOT NULL DEFAULT 'AI',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.chats(chat_id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'admin')),
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responder_mode TEXT NOT NULL CHECK (responder_mode IN ('AI', 'ADMIN'))
);

-- Enable Row Level Security
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chats
CREATE POLICY "Users can view own chats" 
ON public.chats 
FOR SELECT 
USING (user_id::text = 'demo-user' OR auth.uid() = user_id);

CREATE POLICY "Users can create own chats" 
ON public.chats 
FOR INSERT 
WITH CHECK (user_id::text = 'demo-user' OR auth.uid() = user_id);

CREATE POLICY "Users can update own chats" 
ON public.chats 
FOR UPDATE 
USING (user_id::text = 'demo-user' OR auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view own chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (user_id::text = 'demo-user' OR auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (user_id::text = 'demo-user' OR auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX idx_chat_messages_timestamp ON public.chat_messages(timestamp);

-- Add trigger for updating last_updated
CREATE TRIGGER update_chats_last_updated
BEFORE UPDATE ON public.chats
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();