import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { streamAIChat } from "@/utils/aiChat";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Refo Assistant. I can help you with questions about offers, tasks, and rewards. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastUserMsgRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    if (!chatId) return;
    
    console.log('Chat.tsx: Setting up realtime for chat:', chatId);
    const channel = supabase
      .channel(`chat-messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          const newMsg = payload.new as any;
          console.log('Chat.tsx: Realtime message received:', newMsg);
          
          // Only skip if it's our own user message that we just added to UI
          if (
            newMsg.user_id === userIdRef.current &&
            newMsg.sender === 'user' &&
            newMsg.message === lastUserMsgRef.current
          ) {
            console.log('Chat.tsx: Skipping echo of user message');
            // Clear the ref after using it once
            lastUserMsgRef.current = null;
            return;
          }
          
          console.log('Chat.tsx: Adding message to UI');
          // Add all other messages (including admin replies)
          setMessages((prev) => [
            ...prev,
            { role: newMsg.sender === 'user' ? 'user' : 'assistant', content: newMsg.message },
          ]);
        }
      )
      .subscribe((status) => {
        console.log('Chat.tsx: Subscription status:', status);
      });

    return () => {
      console.log('Chat.tsx: Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  const initChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    userIdRef.current = user.id;

    // Always reuse the latest chat for this user (avoid duplicates)
    const { data: chatsList, error: chatsErr } = await supabase
      .from("chats")
      .select("chat_id")
      .eq("user_id", user.id)
      .order("last_updated", { ascending: false })
      .limit(1);

    if (chatsErr) {
      console.error("Load chats error:", chatsErr);
    }

    if (chatsList && chatsList.length > 0) {
      const current = chatsList[0];
      setChatId(current.chat_id);
      
      // Load existing messages
      const { data: chatMessages } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_id", current.chat_id)
        .order("timestamp", { ascending: true });

      if (chatMessages && chatMessages.length > 0) {
        const formattedMessages = chatMessages.map(msg => ({
          role: msg.sender === "user" ? "user" as const : "assistant" as const,
          content: msg.message
        }));
        setMessages(formattedMessages);
      }
    } else {
      // Create new chat
      const { data: newChat } = await supabase
        .from("chats")
        .insert({ user_id: user.id, active_responder: "AI" })
        .select("chat_id")
        .single();

      if (newChat) {
        setChatId(newChat.chat_id);
      }
    }
  };

  const saveMessage = async (role: "user" | "admin", content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !chatId) return;

    await supabase.from("chat_messages").insert({
      chat_id: chatId,
      user_id: user.id,
      sender: role,
      message: content,
      responder_mode: role === "admin" ? "ADMIN" : "AI"
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    lastUserMsgRef.current = input;
    await saveMessage("user", input);
    setInput("");
    setLoading(true);

    // Check chat mode
    const { data: chat } = await supabase
      .from("chats")
      .select("active_responder")
      .eq("chat_id", chatId)
      .single();

    if (chat?.active_responder === "ADMIN_CONTROLLED") {
      setLoading(false);
      toast({ 
        title: "Message sent", 
        description: "An admin will respond shortly" 
      });
      return;
    }

    let assistantContent = "";
    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      await streamAIChat({
        messages: [...messages, userMessage],
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: async () => {
          setLoading(false);
          await saveMessage("admin", assistantContent);
        },
        onError: (error) => {
          setLoading(false);
          toast({ title: "Error", description: error, variant: "destructive" });
        }
      });
    } catch (e) {
      setLoading(false);
      console.error(e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card sticky top-0 z-10">
          <h1 className="text-2xl font-heading font-bold">Refo Assistant</h1>
          <p className="text-sm text-muted-foreground">Your personal rewards guide</p>
        </div>

        {/* Messages Container with Scrollbar */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`max-w-[80%] p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </Card>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <Card className="max-w-[80%] p-4 bg-card">
                <p className="text-sm text-muted-foreground">Typing...</p>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Fixed at Bottom */}
        <div className="p-4 border-t border-border bg-card sticky bottom-16">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask me anything about Refo..."
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-primary/90 rounded-2xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Chat;
