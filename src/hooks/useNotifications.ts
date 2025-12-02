import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type Notification = {
    id: string;
    title: string;
    message: string;
    type: "info" | "warning" | "success" | "error";
    read: boolean;
    created_at: string;
};

export const useNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { toast } = useToast();

    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    toast({
                        title: newNotification.title,
                        description: newNotification.message,
                        variant: newNotification.type === 'error' ? 'destructive' : 'default',
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchNotifications = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from("notifications" as any)
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("Error fetching notifications:", error);
            return;
        }

        setNotifications(data as Notification[]);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
    };

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from("notifications" as any)
            .update({ read: true })
            .eq("id", id);

        if (error) {
            console.error("Error marking notification as read:", error);
            return;
        }

        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = async () => {
        if (!user) return;

        const { error } = await supabase
            .from("notifications" as any)
            .update({ read: true })
            .eq("user_id", user.id)
            .eq("read", false);

        if (error) {
            console.error("Error marking all as read:", error);
            return;
        }

        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications
    };
};
