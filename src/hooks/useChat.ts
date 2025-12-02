import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export interface Message {
    role: "user" | "assistant";
    content: string;
}

export const useChat = (isOpen: boolean) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [chatId, setChatId] = useState<string | null>(null);

    // Fetch or create chat session
    const { data: chatSession, isLoading: isSessionLoading } = useQuery({
        queryKey: ["chat-session", user?.id],
        queryFn: async () => {
            if (!user) return null;

            // Try to find existing chat
            const { data: existingChat } = await supabase
                .from("chats")
                .select("*")
                .eq("user_id", user.id)
                .order("last_updated", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (existingChat) return existingChat;

            // Create new chat if none exists
            const { data: newChat, error } = await supabase
                .from("chats")
                .insert({ user_id: user.id, active_responder: "AI" })
                .select()
                .single();

            if (error) throw error;

            // Add welcome message
            const welcomeMsg = {
                chat_id: newChat.chat_id,
                user_id: user.id,
                sender: "assistant",
                message: "Hi! I'm Refo AI. I can help you with offers, payouts, verification, and affiliate questions. How can I assist you today?",
                responder_mode: "AI",
            };

            await supabase.from("chat_messages").insert(welcomeMsg);
            return newChat;
        },
        enabled: !!user && isOpen, // Only fetch when chat is opened
        staleTime: Infinity, // Chat session ID doesn't change
    });

    useEffect(() => {
        if (chatSession) {
            setChatId(chatSession.chat_id);
        }
    }, [chatSession]);

    // Fetch messages
    const { data: messages = [], isLoading: isMessagesLoading } = useQuery({
        queryKey: ["chat-messages", chatId],
        queryFn: async () => {
            if (!chatId) return [];
            const { data } = await supabase
                .from("chat_messages")
                .select("*")
                .eq("chat_id", chatId)
                .order("timestamp", { ascending: true });

            return (data || []).map((msg) => ({
                role: msg.sender === "user" ? "user" : "assistant",
                content: msg.message,
            })) as Message[];
        },
        enabled: !!chatId && isOpen,
        staleTime: 1000 * 60, // Cache for 1 minute, rely on realtime for updates
    });

    return {
        chatId,
        messages,
        isLoading: isSessionLoading || isMessagesLoading,
        queryClient
    };
};
