import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp } from "lucide-react";

type Task = {
  id: string;
  offer_id: string;
  status: string;
  created_at: string;
  offer_title?: string;
  reward?: number;
};

type UserProfile = {
  id: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  is_verified: boolean | null;
  created_at: string | null;
  role?: string;
  tasks?: Task[];
};

const UsersManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Error loading users", variant: "destructive" });
      return;
    }

    if (profiles) {
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id)
            .maybeSingle();

          return {
            ...profile,
            role: roleData?.role || "user",
          };
        })
      );

      setUsers(usersWithRoles);
    }
  };

  const fetchUserTasks = async (userId: string) => {
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select(`
        id,
        offer_id,
        status,
        created_at,
        offers (
          title,
          reward
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
      toast({ title: "Error loading tasks", variant: "destructive" });
      return [];
    }

    return tasks?.map(task => ({
      id: task.id,
      offer_id: task.offer_id,
      status: task.status,
      created_at: task.created_at,
      offer_title: (task.offers as any)?.title,
      reward: (task.offers as any)?.reward,
    })) || [];
  };

  const handleExpandUser = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }

    const tasks = await fetchUserTasks(userId);
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, tasks } : user
    ));
    setExpandedUser(userId);
  };

  const updateTaskStatus = async (taskId: string, userId: string, newStatus: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task:", error);
      toast({ 
        title: "Error", 
        description: "Failed to update task status",
        variant: "destructive" 
      });
      return;
    }

    toast({ 
      title: "Success", 
      description: `Task status updated to ${newStatus}` 
    });

    // Refresh tasks for this user
    const tasks = await fetchUserTasks(userId);
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, tasks } : user
    ));
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Users Management</h2>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Tasks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <>
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.username || "Not set"}
                      </TableCell>
                      <TableCell>{user.email || "N/A"}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {user.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.is_verified ? (
                          <Badge className="bg-success text-success-foreground">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline">Unverified</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExpandUser(user.id)}
                        >
                          {expandedUser === user.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedUser === user.id && user.tasks && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/50">
                          <div className="p-4">
                            <h4 className="font-semibold mb-3">User Tasks</h4>
                            {user.tasks.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No tasks found</p>
                            ) : (
                              <div className="space-y-3">
                                {user.tasks.map((task) => (
                                  <div key={task.id} className="flex items-center justify-between border border-border rounded-lg p-3 bg-background">
                                    <div className="flex-1">
                                      <p className="font-medium">{task.offer_title || "Unknown Offer"}</p>
                                      <p className="text-sm text-muted-foreground">
                                        Reward: ₹{task.reward} • {new Date(task.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant={
                                        task.status === "verified" ? "default" :
                                        task.status === "rejected" ? "destructive" :
                                        task.status === "completed" ? "secondary" :
                                        "outline"
                                      }>
                                        {task.status}
                                      </Badge>
                                      <div className="flex gap-1">
                                        {task.status !== "pending" && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => updateTaskStatus(task.id, user.id, "pending")}
                                          >
                                            Pending
                                          </Button>
                                        )}
                                        {task.status !== "completed" && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => updateTaskStatus(task.id, user.id, "completed")}
                                          >
                                            Completed
                                          </Button>
                                        )}
                                        {task.status !== "verified" && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => updateTaskStatus(task.id, user.id, "verified")}
                                          >
                                            Verified
                                          </Button>
                                        )}
                                        {task.status !== "rejected" && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => updateTaskStatus(task.id, user.id, "rejected")}
                                          >
                                            Rejected
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersManagement;
