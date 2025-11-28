import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Bot, User as UserIcon, PauseCircle } from "lucide-react";

type Chat = {
  chat_id: string;
  user_id: string;
  active_responder: string;
  last_updated: string;
  user_email?: string;
  message_count?: number;
};

type ChatMessage = {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
};

const ChatControl = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchChats();

    // Set up real-time subscription for chats
    const chatsChannel = supabase
      .channel('chats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats'
        },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    // Set up real-time subscription for messages (scoped to selected chat)
    let messagesChannel: ReturnType<typeof supabase.channel> | null = null;
    if (selectedChat?.chat_id) {
      messagesChannel = supabase
        .channel(`messages-${selectedChat.chat_id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `chat_id=eq.${selectedChat.chat_id}`
          },
          (payload) => {
            const newMsg = payload.new as any;
            // Optimistically append without refetch for snappier UI
            setMessages((prev) => [
              ...prev,
              {
                id: newMsg.id,
                sender: newMsg.sender,
                message: newMsg.message,
                timestamp: newMsg.timestamp,
              },
            ]);
            // Also refresh chats list (for counts/last_updated)
            fetchChats();
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(chatsChannel);
      if (messagesChannel) supabase.removeChannel(messagesChannel);
    };
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      const { data: chatsData, error } = await supabase
        .from("chats")
        .select("*")
        .order("last_updated", { ascending: false });

      if (error) {
        toast({ title: "Error loading chats", variant: "destructive" });
        return;
      }

      if (chatsData) {
        const chatsWithDetails = await Promise.all(
          chatsData.map(async (chat) => {
            let userEmail = "Demo User";
            
            // Try to get profile email, fallback to demo user
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("email")
                .eq("id", chat.user_id)
                .maybeSingle();
              
              if (profile?.email) {
                userEmail = profile.email;
              }
            } catch (error) {
              console.log("Could not fetch profile for", chat.user_id);
            }

            const { count } = await supabase
              .from("chat_messages")
              .select("*", { count: "exact", head: true })
              .eq("chat_id", chat.chat_id);

            return {
              ...chat,
              user_email: userEmail,
              message_count: count || 0,
            };
          })
        );

        setChats(chatsWithDetails);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast({ title: "Connection error", variant: "destructive" });
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("timestamp", { ascending: true });

      if (error) {
        toast({ title: "Error loading messages", variant: "destructive" });
        return;
      }

      setMessages(messagesData || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({ title: "Connection error", variant: "destructive" });
    }
  };

  const handleViewChat = (chat: Chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.chat_id);
    setIsDialogOpen(true);
  };

  const toggleResponder = async (chat: Chat) => {
    const newMode = chat.active_responder === "AI" ? "ADMIN_CONTROLLED" : "AI";

    try {
      const { error } = await supabase
        .from("chats")
        .update({ 
          active_responder: newMode
        })
        .eq("chat_id", chat.chat_id);

      if (error) {
        toast({ 
          title: "Failed to update chat", 
          description: error.message,
          variant: "destructive" 
        });
      } else {
        toast({
          title: newMode === "AI" ? "✅ AI Resumed" : "🔴 Admin Takeover",
          description: newMode === "AI" 
            ? "AI will respond to user messages" 
            : "AI paused - Admin will handle responses"
        });
        fetchChats();
        if (selectedChat?.chat_id === chat.chat_id) {
          setSelectedChat({ ...chat, active_responder: newMode });
        }
      }
    } catch (error) {
      console.error("Error toggling responder:", error);
      toast({ 
        title: "Connection error", 
        description: "Unable to update chat status",
        variant: "destructive" 
      });
    }
  };

  const getStatusBadge = (active_responder: string) => {
    if (active_responder === "AI") {
      return (
        <Badge className="bg-green-500/20 text-green-700 hover:bg-green-500/30 border-green-500/50">
          🟢 AI Active
        </Badge>
      );
    } else if (active_responder === "ADMIN_CONTROLLED") {
      return (
        <Badge className="bg-red-500/20 text-red-700 hover:bg-red-500/30 border-red-500/50">
          🔴 Admin Controlled
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 border-yellow-500/50">
          🟡 Paused
        </Badge>
      );
    }
  };

  const handleClearChat = async (chat: Chat) => {
    if (!confirm(`Are you sure you want to clear all messages for ${chat.user_email}?`)) {
      return;
    }

    try {
      console.log('Clearing chat:', chat.chat_id);
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("chat_id", chat.chat_id);

      if (error) {
        console.error('Delete error:', error);
        toast({ title: "Failed to clear chat", description: error.message, variant: "destructive" });
        return;
      }

      console.log('Chat cleared successfully');
      toast({ title: "Chat cleared successfully" });
      fetchChats();
      
      if (selectedChat?.chat_id === chat.chat_id) {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error clearing chat:", error);
      toast({ title: "Connection error", variant: "destructive" });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      console.log('Admin sending message to chat:', selectedChat.chat_id);
      const { error } = await supabase.from("chat_messages").insert({
        chat_id: selectedChat.chat_id,
        user_id: selectedChat.user_id,
        sender: "admin",
        message: newMessage.trim(),
        responder_mode: "ADMIN",
      });

      if (error) {
        console.error('Message send error:', error);
        toast({ title: "Send failed", description: error.message, variant: "destructive" });
        return;
      }

      console.log('Admin message sent successfully');

      // Update chat to ADMIN_CONTROLLED mode
      await supabase
        .from("chats")
        .update({ active_responder: "ADMIN_CONTROLLED" })
        .eq("chat_id", selectedChat.chat_id);

      setNewMessage("");

      toast({ title: "Message sent as Refo Assistant" });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Connection error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Admin Control Center</h2>
        <p className="text-muted-foreground mt-1">Manage user conversations with Refo AI</p>
      </div>
      
      <Card className="border-border shadow-sm">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-xl flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Query List - All Chats
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Last Message</TableHead>
                  <TableHead className="font-semibold">Active Responder</TableHead>
                  <TableHead className="font-semibold">Time</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No chats yet. Chats will appear here when users interact with Refo AI.
                    </TableCell>
                  </TableRow>
                ) : (
                  chats.map((chat) => (
                    <TableRow 
                      key={chat.chat_id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium">{chat.user_email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {chat.message_count} message{chat.message_count !== 1 ? 's' : ''}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {chat.active_responder === "AI" ? (
                            <Bot className="h-4 w-4 text-green-600" />
                          ) : chat.active_responder === "ADMIN_CONTROLLED" ? (
                            <UserIcon className="h-4 w-4 text-red-600" />
                          ) : (
                            <PauseCircle className="h-4 w-4 text-yellow-600" />
                          )}
                          <span className="text-sm font-medium">
                            {chat.active_responder === "ADMIN_CONTROLLED" ? "ADMIN" : chat.active_responder}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(chat.last_updated).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(chat.active_responder)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewChat(chat)}
                            className="hover:bg-primary/10"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant={chat.active_responder === "AI" ? "destructive" : "default"}
                            onClick={() => toggleResponder(chat)}
                            className={chat.active_responder === "AI" 
                              ? "bg-red-600 hover:bg-red-700" 
                              : "bg-green-600 hover:bg-green-700"
                            }
                          >
                            {chat.active_responder === "AI" ? "Take Over" : "Resume AI"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClearChat(chat)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            Clear
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">
                  💬 Chat with {selectedChat?.user_email}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">Current Mode:</span>
                  {selectedChat && getStatusBadge(selectedChat.active_responder)}
                </div>
              </div>
              {selectedChat && (
                <Button
                  size="sm"
                  variant={selectedChat.active_responder === "AI" ? "destructive" : "default"}
                  onClick={() => toggleResponder(selectedChat)}
                  className={selectedChat.active_responder === "AI" 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-green-600 hover:bg-green-700"
                  }
                >
                  {selectedChat.active_responder === "AI" ? "Take Over" : "Resume AI"}
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="flex flex-col h-[60vh]">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 py-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No messages yet
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                          msg.sender === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {msg.sender === "user" ? (
                            <UserIcon className="h-3 w-3" />
                          ) : (
                            <Bot className="h-3 w-3" />
                          )}
                          <p className="text-xs font-semibold">
                            {msg.sender === "user" ? "User" : "Refo Assistant"}
                          </p>
                        </div>
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                        <p className="text-xs opacity-60 mt-1.5">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="mt-4 pt-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder="Type your message as Refo Assistant..."
                  className="flex-1"
                  disabled={selectedChat?.active_responder === "AI"}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || selectedChat?.active_responder === "AI"}
                  className="bg-primary hover:bg-primary/90"
                >
                  Send
                </Button>
              </div>
              {selectedChat?.active_responder === "AI" && (
                <p className="text-xs text-muted-foreground mt-2">
                  ℹ️ AI is active. Take over to send messages manually.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatControl;
