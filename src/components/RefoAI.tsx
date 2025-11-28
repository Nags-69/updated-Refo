import { useState, useRef, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { streamAIChat } from "@/utils/aiChat";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const RefoAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [chatId, setChatId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize or fetch existing chat
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log("User not authenticated");
          return;
        }
        
        setUserId(user.id);

        // Check if user has existing chat
        const { data: existingChat, error: fetchError } = await supabase
          .from("chats")
          .select("*")
          .eq("user_id", user.id)
          .order("last_updated", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Error fetching chat:", fetchError);
          return;
        }

        if (existingChat) {
          setChatId(existingChat.chat_id);

          // Fetch messages for this chat
          const { data: chatMessages, error: messagesError } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("chat_id", existingChat.chat_id)
            .order("timestamp", { ascending: true });

          if (!messagesError && chatMessages) {
            setMessages(
              chatMessages.map((msg) => ({
                role: msg.sender === "user" ? "user" : "assistant",
                content: msg.message,
              }))
            );
          }
        } else {
          // Create new chat
          const { data: newChat, error: createError } = await supabase
            .from("chats")
            .insert({ user_id: user.id, active_responder: "AI" })
            .select()
            .single();

          if (!createError && newChat) {
            setChatId(newChat.chat_id);

            // Add welcome message
            const welcomeMsg = {
              chat_id: newChat.chat_id,
              user_id: user.id,
              sender: "assistant",
              message:
                "Hi! I'm Refo AI. I can help you with offers, payouts, verification, and affiliate questions. How can I assist you today?",
              responder_mode: "AI",
            };

            await supabase.from("chat_messages").insert(welcomeMsg);

            setMessages([
              {
                role: "assistant",
                content: welcomeMsg.message,
              },
            ]);
          }
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };

    if (isOpen) {
      initializeChat();
    }
  }, [isOpen]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!chatId || !isOpen) return;
    
    let mounted = true;
    
    console.log('RefoAI: Setting up realtime for chat:', chatId);
    const channel = supabase
      .channel(`refo-ai-messages-${chatId}`)
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
          console.log('RefoAI: Received message:', newMsg);
          
          // Only add messages from admin in ADMIN_CONTROLLED mode
          // AI messages are already added during streaming, user messages are added optimistically
          if (mounted && newMsg.sender === 'admin' && newMsg.responder_mode === 'ADMIN') {
            console.log('RefoAI: Adding admin message to UI');
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: newMsg.message },
            ]);
          } else {
            console.log('RefoAI: Skipping message (already in UI)');
          }
        }
      )
      .subscribe((status) => {
        console.log('RefoAI: Subscription status:', status);
      });

    return () => {
      mounted = false;
      console.log('RefoAI: Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [chatId, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isOpen) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
      return () => {
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging]);

  const sendMessage = async () => {
    if (!input.trim() || !chatId || !userId) return;

    const userMessageText = input.trim();

    const userMessage: Message = { role: "user", content: userMessageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      // Check current active responder
      const { data: chat } = await supabase
        .from("chats")
        .select("active_responder")
        .eq("chat_id", chatId)
        .single();

      const activeResponder = chat?.active_responder || "AI";
      // Map active_responder to valid responder_mode values
      const responderMode = activeResponder === "ADMIN_CONTROLLED" ? "ADMIN" : "AI";

      // Save user message to database
      await supabase.from("chat_messages").insert({
        chat_id: chatId,
        user_id: userId,
        sender: "user",
        message: userMessageText,
        responder_mode: responderMode,
      });

      // Only generate AI response if not in ADMIN_CONTROLLED mode
      if (activeResponder === "AI") {
        setIsTyping(true);

        let assistantContent = "";
        const conversationMessages = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        await streamAIChat({
          messages: [...conversationMessages, { role: "user", content: userMessageText }],
          onDelta: (chunk) => {
            assistantContent += chunk;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          },
          onDone: async () => {
            setIsTyping(false);
            try {
              await supabase.from("chat_messages").insert({
                chat_id: chatId,
                user_id: userId,
                sender: "assistant",
                message: assistantContent,
                responder_mode: "AI",
              });

              await supabase
                .from("chats")
                .update({ last_updated: new Date().toISOString() })
                .eq("chat_id", chatId);
            } catch (error) {
              console.error("Error saving assistant message:", error);
            }
          },
          onError: (error) => {
            setIsTyping(false);
            toast({
              title: "AI Error",
              description: error,
              variant: "destructive",
            });
          },
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);
      toast({
        title: "Error sending message",
        description: "Failed to send your message. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div
        ref={buttonRef}
        className={cn(
          "fixed z-50 cursor-pointer transition-transform duration-150",
          isDragging ? "scale-95" : "hover:scale-105"
        )}
        style={{
          bottom: position.y === 0 ? "6rem" : "auto",
          right: position.x === 0 ? "1.5rem" : "auto",
          transform:
            position.x !== 0 || position.y !== 0
              ? `translate(${position.x}px, ${position.y}px)`
              : "none",
        }}
        onClick={() => !isDragging && setIsOpen(true)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="bg-primary text-primary-foreground rounded-full p-4 shadow-lg">
          <MessageCircle className="h-6 w-6" />
        </div>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:justify-end md:pr-6 md:pb-6 p-4">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setIsOpen(false)}
          />
          <Card
            className="relative w-full max-w-md bg-background shadow-2xl rounded-3xl overflow-hidden transition-all duration-200"
            style={{ maxHeight: "60vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground rounded-full p-2">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold">Refo AI</h3>
                  <p className="text-xs text-muted-foreground">
                    Your assistant
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div
              className="overflow-y-auto p-4 space-y-3"
              style={{ height: "calc(60vh - 140px)" }}
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] px-4 py-2 rounded-2xl text-sm transition-all duration-150",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-4 py-2 rounded-2xl text-sm bg-secondary text-secondary-foreground">
                    <div className="flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce animation-delay-200">●</span>
                      <span className="animate-bounce animation-delay-400">●</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask about offers, payouts..."
                  className="flex-1 rounded-full"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className="rounded-full bg-primary hover:bg-primary/90"
                  size="icon"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default RefoAI;
