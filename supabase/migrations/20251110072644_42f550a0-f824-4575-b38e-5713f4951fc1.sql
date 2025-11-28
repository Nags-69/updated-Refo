-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can view chats" ON public.chats;
DROP POLICY IF EXISTS "Anyone can view chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can create chats" ON public.chats;
DROP POLICY IF EXISTS "Anyone can update chats" ON public.chats;
DROP POLICY IF EXISTS "Anyone can create chat messages" ON public.chat_messages;

-- Create secure policies for chats table
CREATE POLICY "Users can view own chats"
ON public.chats
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all chats"
ON public.chats
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create own chats"
ON public.chats
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats"
ON public.chats
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all chats"
ON public.chats
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create secure policies for chat_messages table
CREATE POLICY "Users can view own messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create own messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can create any messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));