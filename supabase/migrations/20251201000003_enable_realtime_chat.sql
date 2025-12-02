-- Enable Realtime for chat tables
begin;
  -- Remove if already exists to avoid errors (optional, but safer to just add)
  -- In standard Postgres, ADD TABLE throws if already present. 
  -- We can try to drop from publication first or just assume it's needed.
  -- Safest approach for Supabase migrations:
  
  alter publication supabase_realtime add table chat_messages;
  alter publication supabase_realtime add table chats;
commit;
