import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Send, Users } from "lucide-react";

const NotificationsManagement = () => {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState<"info" | "warning" | "success" | "error">("info");
    const [targetUserEmail, setTargetUserEmail] = useState("");
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    const handleSendNotification = async () => {
        if (!title.trim() || !message.trim()) {
            toast({
                title: "Missing fields",
                description: "Please provide both title and message",
                variant: "destructive",
            });
            return;
        }

        setIsSending(true);

        try {
            let targetUserIds: string[] = [];

            if (targetUserEmail.trim()) {
                // Send to specific user
                const { data: profiles, error: profileError } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("email", targetUserEmail.trim())
                    .maybeSingle();

                if (profileError || !profiles) {
                    toast({
                        title: "User not found",
                        description: `Could not find user with email: ${targetUserEmail}`,
                        variant: "destructive",
                    });
                    setIsSending(false);
                    return;
                }
                targetUserIds = [profiles.id];
            } else {
                // Send to all users
                const { data: profiles, error: profileError } = await supabase
                    .from("profiles")
                    .select("id");

                if (profileError) throw profileError;
                targetUserIds = profiles.map(p => p.id);
            }

            if (targetUserIds.length === 0) {
                toast({
                    title: "No recipients",
                    description: "No users found to send notification to",
                    variant: "destructive",
                });
                setIsSending(false);
                return;
            }

            const notifications = targetUserIds.map(userId => ({
                user_id: userId,
                title,
                message,
                type,
            }));

            const { error } = await supabase
                .from("notifications" as any)
                .insert(notifications);

            if (error) throw error;

            toast({
                title: "Success",
                description: `Notification sent to ${targetUserIds.length} user(s)`,
            });

            // Reset form
            setTitle("");
            setMessage("");
            setTargetUserEmail("");
            setType("info");

        } catch (error: any) {
            console.error("Error sending notification:", error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-foreground">Notifications Center</h2>
                <p className="text-muted-foreground mt-1">Send alerts and updates to users</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5" />
                            Send Notification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                placeholder="Notification Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message</label>
                            <Textarea
                                placeholder="Enter your message here..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type</label>
                                <Select value={type} onValueChange={(v: any) => setType(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="info">Info</SelectItem>
                                        <SelectItem value="success">Success</SelectItem>
                                        <SelectItem value="warning">Warning</SelectItem>
                                        <SelectItem value="error">Error</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Target User (Optional)</label>
                                <Input
                                    placeholder="Email (leave empty for all)"
                                    value={targetUserEmail}
                                    onChange={(e) => setTargetUserEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleSendNotification}
                            disabled={isSending}
                        >
                            {isSending ? "Sending..." : "Send Notification"}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-card border rounded-lg p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${type === 'error' ? "bg-red-500" :
                                        type === 'success' ? "bg-green-500" :
                                            type === 'warning' ? "bg-yellow-500" :
                                                "bg-blue-500"
                                    }`} />
                                <div className="space-y-1 flex-1">
                                    <p className="text-sm font-semibold leading-none">
                                        {title || "Notification Title"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {message || "Notification message will appear here..."}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground pt-1">
                                        Just now
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Target: {targetUserEmail ? targetUserEmail : "All Users"}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default NotificationsManagement;
