-- Forcefully enable Realtime for chat tables
begin;
  -- Drop existing publication to ensure clean state (optional, but good for reset)
  -- DROP PUBLICATION IF EXISTS supabase_realtime; 
  -- Re-creating it might affect other tables, so let's just alter.

  -- Ensure the publication exists
  -- create publication supabase_realtime; -- usually exists by default

  -- Remove tables first to avoid "already exists" errors if we want to be clean, 
  -- but "alter publication add table" is idempotent-ish in some versions, but throws in others if already added.
  -- The safest way is to just run it. If it fails, it means it's already there.
  
  -- However, to be 100% sure, let's try to drop and re-add from the publication
  alter publication supabase_realtime drop table if exists chat_messages;
  alter publication supabase_realtime drop table if exists chats;
  
  alter publication supabase_realtime add table chat_messages;
  alter publication supabase_realtime add table chats;
commit;
