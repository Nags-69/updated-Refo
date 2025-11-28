-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create own chat messages" ON public.chat_messages;

-- Create public access policies for chats (no auth required for now)
CREATE POLICY "Anyone can view chats" 
ON public.chats 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create chats" 
ON public.chats 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update chats" 
ON public.chats 
FOR UPDATE 
USING (true);

-- Create public access policies for chat_messages (no auth required for now)
CREATE POLICY "Anyone can view chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create chat messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (true);