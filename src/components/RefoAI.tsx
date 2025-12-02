import { useState, useRef, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { streamAIChat } from "@/utils/aiChat";
import { useChat, Message } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";

const RefoAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();
  const { chatId, messages: initialMessages, queryClient } = useChat(isOpen);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  // Dragging refs
  const buttonRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const position = useRef({ x: 0, y: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Sync local messages with fetched messages
  useEffect(() => {
    if (initialMessages.length > 0) {
      setLocalMessages(initialMessages);
    }
  }, [initialMessages]);

  const playNotificationSound = () => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  // Realtime subscription
  useEffect(() => {
    if (!chatId || !isOpen) return;

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
          // Only add admin messages via realtime (user/AI handled locally/optimistically)
          if (newMsg.sender === 'admin') {
            playNotificationSound();
            setLocalMessages((prev) => [
              ...prev,
              { role: 'assistant', content: newMsg.message },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Optimized Dragging Logic (No Re-renders)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - position.current.x,
      y: e.clientY - position.current.y,
    };

    // Add global listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !buttonRef.current) return;

    e.preventDefault();
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;

    position.current = { x: newX, y: newY };
    buttonRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isOpen) return;
    const touch = e.touches[0];
    isDragging.current = true;
    dragStart.current = {
      x: touch.clientX - position.current.x,
      y: touch.clientY - position.current.y,
    };
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current || !buttonRef.current) return;
    const touch = e.touches[0];
    e.preventDefault(); // Prevent scrolling while dragging

    const newX = touch.clientX - dragStart.current.x;
    const newY = touch.clientY - dragStart.current.y;

    position.current = { x: newX, y: newY };
    buttonRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
  };

  const sendMessage = async () => {
    if (!input.trim() || !chatId || !user) return;

    const userMessageText = input.trim();
    const userMessage: Message = { role: "user", content: userMessageText };

    setLocalMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const { data: chat } = await supabase
        .from("chats")
        .select("active_responder")
        .eq("chat_id", chatId)
        .single();

      const activeResponder = chat?.active_responder || "AI";
      const responderMode = activeResponder === "ADMIN_CONTROLLED" ? "ADMIN" : "AI";

      await supabase.from("chat_messages").insert({
        chat_id: chatId,
        user_id: user.id,
        sender: "user",
        message: userMessageText,
        responder_mode: responderMode,
      });

      if (activeResponder === "AI") {
        setIsTyping(true);
        let assistantContent = "";

        await streamAIChat({
          messages: [...localMessages, userMessage],
          onDelta: (chunk) => {
            assistantContent += chunk;
            setLocalMessages((prev) => {
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
            await supabase.from("chat_messages").insert({
              chat_id: chatId,
              user_id: user.id,
              sender: "assistant",
              message: assistantContent,
              responder_mode: "AI",
            });
            // Invalidate query to ensure sync
            queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
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

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <div
        ref={buttonRef}
        className="fixed z-50 cursor-pointer transition-transform duration-75 hover:scale-105 active:scale-95"
        style={{
          bottom: "6rem",
          right: "1.5rem",
          touchAction: "none" // Important for touch dragging
        }}
        onClick={() => {
          // Only open if not dragging (simple check: if we moved less than 5px)
          if (!isDragging.current) setIsOpen(true);
        }}
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <Card
            className="relative w-full max-w-md bg-background shadow-2xl rounded-3xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300"
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
              {localMessages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm",
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
