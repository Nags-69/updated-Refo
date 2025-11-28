import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Image } from "lucide-react";

type Task = {
  id: string;
  user_id: string;
  offer_id: string;
  status: string;
  created_at: string;
  proof_url?: string[];
  user_email?: string;
  offer_title?: string;
  offer_reward?: number;
};

const ReferralsManagement = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProofs, setSelectedProofs] = useState<string[]>([]);
  const [currentProofIndex, setCurrentProofIndex] = useState(0);
  const [cleanupInfo, setCleanupInfo] = useState<{ last_cleanup_at: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    fetchCleanupInfo();
  }, []);

  const fetchCleanupInfo = async () => {
    const { data } = await supabase
      .from("task_cleanup_log" as any)
      .select("last_cleanup_at")
      .order("last_cleanup_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setCleanupInfo(data as any);
    }
  };

  const getDaysSinceCleanup = () => {
    if (!cleanupInfo) return null;
    const lastCleanup = new Date(cleanupInfo.last_cleanup_at);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastCleanup.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff;
  };

  const fetchTasks = async () => {
    const { data: tasksData, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
      toast({ title: "Error loading tasks", variant: "destructive" });
      return;
    }

    if (tasksData) {
      const tasksWithDetails = await Promise.all(
        tasksData.map(async (task) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, username")
            .eq("id", task.user_id)
            .maybeSingle();
          
          const { data: offer } = await supabase
            .from("offers")
            .select("title, reward")
            .eq("id", task.offer_id)
            .maybeSingle();

          return {
            ...task,
            user_email: profile?.username || profile?.email || "N/A",
            offer_title: offer?.title || "N/A",
            offer_reward: offer?.reward || 0,
            proof_url: task.proof_url ? (Array.isArray(task.proof_url) ? task.proof_url : [task.proof_url]) : undefined,
          } as Task;
        })
      );

      setTasks(tasksWithDetails);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", taskId);

    if (error) {
      toast({ title: "Error updating status", variant: "destructive" });
      return;
    }

    // If verified, move pending amount to total balance
    if (newStatus === "verified") {
      // Check if transaction already exists (for completed tasks)
      const { data: existingTransaction } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", task.user_id)
        .eq("description", `Pending: ${task.offer_title}`)
        .eq("status", "pending")
        .maybeSingle();

      if (existingTransaction) {
        // Update existing transaction to completed
        await supabase
          .from("transactions")
          .update({ 
            status: "completed",
            description: `Completed: ${task.offer_title}`
          })
          .eq("id", existingTransaction.id);
      } else {
        // Create new transaction for pending tasks approved directly
        await supabase
          .from("transactions")
          .insert({
            user_id: task.user_id,
            type: "earning",
            amount: task.offer_reward,
            status: "completed",
            description: `Completed: ${task.offer_title}`,
          });
      }

      // Get current wallet
      const { data: walletData } = await supabase
        .from("wallet")
        .select("*")
        .eq("user_id", task.user_id)
        .single();

      if (walletData) {
        const pendingAmount = existingTransaction ? Number(task.offer_reward) : 0;
        const newTotalBalance = Number(walletData.total_balance || 0) + Number(task.offer_reward);
        const newPendingBalance = Number(walletData.pending_balance || 0) - pendingAmount;

        await supabase
          .from("wallet")
          .update({
            total_balance: newTotalBalance,
            pending_balance: Math.max(0, newPendingBalance),
          })
          .eq("user_id", task.user_id);
      }

      toast({ title: `Task verified! ₹${task.offer_reward} added to user wallet` });
    } else if (newStatus === "rejected") {
      // Remove pending transaction if exists
      await supabase
        .from("transactions")
        .delete()
        .eq("user_id", task.user_id)
        .eq("description", `Pending: ${task.offer_title}`)
        .eq("status", "pending");

      // Deduct from pending balance
      const { data: walletData } = await supabase
        .from("wallet")
        .select("pending_balance")
        .eq("user_id", task.user_id)
        .single();

      if (walletData) {
        const newPendingBalance = Number(walletData.pending_balance || 0) - Number(task.offer_reward);
        await supabase
          .from("wallet")
          .update({
            pending_balance: Math.max(0, newPendingBalance),
          })
          .eq("user_id", task.user_id);
      }

      toast({ title: "Task rejected" });
    } else {
      toast({ title: `Task marked as ${newStatus}` });
    }

    fetchTasks();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Referrals Management</h2>
        {cleanupInfo && (
          <Card className="px-4 py-2">
            <p className="text-xs text-muted-foreground">Auto-cleanup status</p>
            <p className="text-sm font-medium">
              {getDaysSinceCleanup() === 0 ? "Cleaned today" : 
               getDaysSinceCleanup() === 1 ? "Cleaned yesterday" :
               `Cleaned ${getDaysSinceCleanup()} days ago`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Screenshots older than 7 days are auto-deleted daily at 2 AM
            </p>
          </Card>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Referral Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Offer</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.user_email}</TableCell>
                    <TableCell>{task.offer_title}</TableCell>
                    <TableCell>₹{task.offer_reward}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          task.status === "completed"
                            ? "bg-primary/20 text-primary"
                            : task.status === "verified"
                            ? "bg-success/20 text-success"
                            : task.status === "pending"
                            ? "bg-muted text-muted-foreground"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {task.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {task.proof_url && task.proof_url.length > 0 ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedProofs(task.proof_url!);
                            setCurrentProofIndex(0);
                          }}
                        >
                          <Image className="h-4 w-4" />
                          <span className="ml-1 text-xs">({task.proof_url.length})</span>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">No proof</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(task.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {(task.status === "pending" || task.status === "completed") && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateTaskStatus(task.id, "verified")}
                          >
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateTaskStatus(task.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={selectedProofs.length > 0} onOpenChange={() => {
        setSelectedProofs([]);
        setCurrentProofIndex(0);
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Task Proof Screenshots ({currentProofIndex + 1} of {selectedProofs.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4">
              {selectedProofs[currentProofIndex] && (
                <img 
                  src={selectedProofs[currentProofIndex]} 
                  alt={`Task proof ${currentProofIndex + 1}`}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              )}
            </div>
            {selectedProofs.length > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentProofIndex(Math.max(0, currentProofIndex - 1))}
                  disabled={currentProofIndex === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentProofIndex + 1} / {selectedProofs.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentProofIndex(Math.min(selectedProofs.length - 1, currentProofIndex + 1))}
                  disabled={currentProofIndex === selectedProofs.length - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferralsManagement;
