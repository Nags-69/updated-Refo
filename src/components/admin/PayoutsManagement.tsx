import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus } from "lucide-react";

type Payout = {
  user_id: string;
  user_email?: string;
  total_earnings: number;
  pending_balance: number;
  completed_payouts: number;
};

type PayoutRequest = {
  id: string;
  user_id: string;
  user_email?: string;
  amount: number;
  payout_method: string;
  upi_id?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_account_holder?: string;
  status: string;
  created_at: string;
};

const PayoutsManagement = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [selectedPayoutDetails, setSelectedPayoutDetails] = useState<PayoutRequest | null>(null);
  const [adjustmentDialog, setAdjustmentDialog] = useState<{
    open: boolean;
    userId: string;
    userEmail: string;
    type: "add" | "reduce";
  }>({ open: false, userId: "", userEmail: "", type: "add" });
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPayouts();
    fetchPayoutRequests();
  }, []);

  const fetchPayoutRequests = async () => {
    const { data, error } = await supabase
      .from("payout_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payout requests:", error);
      return;
    }

    if (data) {
      const requestsWithDetails = await Promise.all(
        data.map(async (request) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, username")
            .eq("id", request.user_id)
            .maybeSingle();

          return {
            ...request,
            user_email: profile?.username || profile?.email || "N/A",
          };
        })
      );

      setPayoutRequests(requestsWithDetails);
    }
  };

  const fetchPayouts = async () => {
    const { data: wallets, error } = await supabase.from("wallet").select("*");

    if (error) {
      console.error("Error fetching wallets:", error);
      toast({ title: "Error loading payouts", variant: "destructive" });
      return;
    }

    if (wallets) {
      const payoutsWithDetails = await Promise.all(
        wallets.map(async (wallet) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, username")
            .eq("id", wallet.user_id)
            .maybeSingle();

          const { data: transactions } = await supabase
            .from("transactions")
            .select("amount")
            .eq("user_id", wallet.user_id)
            .eq("status", "completed");

          const completedPayouts = transactions?.reduce(
            (sum, t) => sum + Number(t.amount),
            0
          ) || 0;

          return {
            user_id: wallet.user_id,
            user_email: profile?.username || profile?.email || "N/A",
            total_earnings: Number(wallet.total_balance || 0),
            pending_balance: Number(wallet.pending_balance || 0),
            completed_payouts: completedPayouts,
          };
        })
      );

      setPayouts(payoutsWithDetails);
    }
  };

  const handlePayoutRequest = async (requestId: string, action: "approve" | "reject") => {
    const request = payoutRequests.find((r) => r.id === requestId);
    if (!request) return;

    if (action === "approve") {
      // Get current wallet balance
      const { data: walletData } = await supabase
        .from("wallet")
        .select("total_balance")
        .eq("user_id", request.user_id)
        .single();

      if (!walletData) {
        toast({ title: "Error: User wallet not found", variant: "destructive" });
        return;
      }

      if (Number(walletData.total_balance) < Number(request.amount)) {
        toast({ title: "Error: Insufficient balance", variant: "destructive" });
        return;
      }

      // Create withdrawal transaction
      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: request.user_id,
        type: "withdrawal",
        amount: request.amount,
        status: "completed",
        description: `Withdrawal via ${request.payout_method}`,
      });

      if (transactionError) {
        toast({ title: "Error creating transaction", variant: "destructive" });
        return;
      }

      // Deduct from wallet
      const newBalance = Number(walletData.total_balance) - Number(request.amount);
      const { error: walletError } = await supabase
        .from("wallet")
        .update({ total_balance: Math.max(0, newBalance) })
        .eq("user_id", request.user_id);

      if (walletError) {
        toast({ title: "Error updating wallet", variant: "destructive" });
        return;
      }

      // Update payout request status
      const { error: updateError } = await supabase
        .from("payout_requests")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        toast({ title: "Error updating payout request", variant: "destructive" });
      } else {
        toast({ title: `Payout approved! ₹${request.amount} paid to ${request.user_email}` });
        fetchPayouts();
        fetchPayoutRequests();
      }
    } else {
      // Reject payout
      const { error } = await supabase
        .from("payout_requests")
        .update({
          status: "rejected",
          processed_at: new Date().toISOString(),
          rejection_reason: "Rejected by admin",
        })
        .eq("id", requestId);

      if (error) {
        toast({ title: "Error rejecting payout", variant: "destructive" });
      } else {
        toast({ title: "Payout request rejected" });
        fetchPayoutRequests();
      }
    }
  };

  const handleBalanceAdjustment = async () => {
    const amount = parseFloat(adjustmentAmount);
    
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      });
      return;
    }

    if (!adjustmentReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for this adjustment",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current wallet balance
      const { data: walletData } = await supabase
        .from("wallet")
        .select("total_balance")
        .eq("user_id", adjustmentDialog.userId)
        .single();

      if (!walletData) {
        toast({ title: "User wallet not found", variant: "destructive" });
        return;
      }

      let newBalance: number;
      let transactionType: string;
      let description: string;

      if (adjustmentDialog.type === "add") {
        newBalance = Number(walletData.total_balance) + amount;
        transactionType = "bonus";
        description = `Bonus: ${adjustmentReason}`;
      } else {
        newBalance = Number(walletData.total_balance) - amount;
        transactionType = "deduction";
        description = `Deduction: ${adjustmentReason}`;

        if (newBalance < 0) {
          toast({
            title: "Insufficient balance",
            description: "Cannot reduce more than current balance",
            variant: "destructive",
          });
          return;
        }
      }

      // Update wallet balance
      const { error: walletError } = await supabase
        .from("wallet")
        .update({ total_balance: newBalance })
        .eq("user_id", adjustmentDialog.userId);

      if (walletError) throw walletError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: adjustmentDialog.userId,
          type: transactionType,
          amount: amount,
          status: "completed",
          description: description,
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Balance adjusted successfully",
        description: `${adjustmentDialog.type === "add" ? "Added" : "Reduced"} ₹${amount} ${
          adjustmentDialog.type === "add" ? "to" : "from"
        } ${adjustmentDialog.userEmail}'s wallet`,
      });

      // Reset form and close dialog
      setAdjustmentDialog({ open: false, userId: "", userEmail: "", type: "add" });
      setAdjustmentAmount("");
      setAdjustmentReason("");
      fetchPayouts();
      fetchPayoutRequests();
    } catch (error: any) {
      toast({
        title: "Error adjusting balance",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Payouts Management</h2>
      
      {/* Payout Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.user_email}</TableCell>
                    <TableCell>₹{Number(request.amount).toFixed(2)}</TableCell>
                    <TableCell>{request.payout_method}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          request.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-500"
                            : request.status === "completed"
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        {request.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {request.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPayoutDetails(request)}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handlePayoutRequest(request.id, "approve")}
                          >
                            Pay
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handlePayoutRequest(request.id, "reject")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {request.status !== "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedPayoutDetails(request)}
                        >
                          View Details
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Wallets Overview */}
      <Card>
        <CardHeader>
          <CardTitle>User Earnings & Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Total Earnings</TableHead>
                  <TableHead>Pending Balance</TableHead>
                  <TableHead>Completed Payouts</TableHead>
                  <TableHead className="text-right">Adjust Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.user_id}>
                  <TableCell className="font-medium">{payout.user_email}</TableCell>
                    <TableCell>₹{payout.total_earnings.toFixed(2)}</TableCell>
                    <TableCell>₹{payout.pending_balance.toFixed(2)}</TableCell>
                    <TableCell>₹{payout.completed_payouts.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setAdjustmentDialog({
                              open: true,
                              userId: payout.user_id,
                              userEmail: payout.user_email || "",
                              type: "add",
                            })
                          }
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Bonus
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setAdjustmentDialog({
                              open: true,
                              userId: payout.user_id,
                              userEmail: payout.user_email || "",
                              type: "reduce",
                            })
                          }
                        >
                          <Minus className="h-4 w-4 mr-1" />
                          Deduct
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Balance Adjustment Dialog */}
      <Dialog open={adjustmentDialog.open} onOpenChange={(open) => {
        if (!open) {
          setAdjustmentDialog({ open: false, userId: "", userEmail: "", type: "add" });
          setAdjustmentAmount("");
          setAdjustmentReason("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentDialog.type === "add" ? "Add Bonus" : "Reduce Balance"}
            </DialogTitle>
            <DialogDescription>
              {adjustmentDialog.type === "add" 
                ? `Add bonus to ${adjustmentDialog.userEmail}'s wallet` 
                : `Reduce balance from ${adjustmentDialog.userEmail}'s wallet`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="Enter amount"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="e.g., Performance bonus, Correction, etc."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setAdjustmentDialog({ open: false, userId: "", userEmail: "", type: "add" });
                  setAdjustmentAmount("");
                  setAdjustmentReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBalanceAdjustment}
                variant={adjustmentDialog.type === "add" ? "default" : "destructive"}
              >
                {adjustmentDialog.type === "add" ? "Add Bonus" : "Deduct Amount"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bank Details Dialog */}
      <Dialog open={!!selectedPayoutDetails} onOpenChange={() => setSelectedPayoutDetails(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
            <DialogDescription>
              User: {selectedPayoutDetails?.user_email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Amount:</div>
              <div className="text-sm font-bold">₹{selectedPayoutDetails?.amount}</div>
              
              <div className="text-sm text-muted-foreground">Method:</div>
              <div className="text-sm font-medium">{selectedPayoutDetails?.payout_method}</div>
              
              <div className="text-sm text-muted-foreground">Status:</div>
              <div className="text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  selectedPayoutDetails?.status === "pending"
                    ? "bg-yellow-500/20 text-yellow-500"
                    : selectedPayoutDetails?.status === "completed"
                    ? "bg-green-500/20 text-green-500"
                    : "bg-red-500/20 text-red-500"
                }`}>
                  {selectedPayoutDetails?.status}
                </span>
              </div>
            </div>

            {selectedPayoutDetails?.payout_method === "UPI" ? (
              <div className="p-4 border rounded-lg bg-background">
                <h4 className="font-semibold mb-2">UPI Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">UPI ID:</span>
                    <span className="text-sm font-mono font-medium">{selectedPayoutDetails?.upi_id}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-background">
                <h4 className="font-semibold mb-3">Bank Account Details</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Account Holder Name</span>
                    <p className="text-sm font-medium mt-1">{selectedPayoutDetails?.bank_account_holder}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Account Number</span>
                    <p className="text-sm font-mono font-medium mt-1">{selectedPayoutDetails?.bank_account_number}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">IFSC Code</span>
                    <p className="text-sm font-mono font-medium mt-1">{selectedPayoutDetails?.bank_ifsc_code}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground text-center">
              Created: {selectedPayoutDetails && new Date(selectedPayoutDetails.created_at).toLocaleString()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayoutsManagement;
