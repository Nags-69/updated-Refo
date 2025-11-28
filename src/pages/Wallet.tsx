import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet as WalletIcon, TrendingUp, Clock, CheckCircle2, Banknote, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

const Wallet = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [payoutMethod, setPayoutMethod] = useState<"upi" | "bank">("upi");
  const [upiId, setUpiId] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    accountHolder: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load wallet
    const { data: walletData } = await supabase
      .from("wallet")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setWallet(walletData);

    // Load transactions
    const { data: transactionsData } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTransactions(transactionsData || []);

    // Load payout requests
    const { data: payoutData } = await supabase
      .from("payout_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setPayoutRequests(payoutData || []);

    // Set up realtime subscription for payout updates
    const channel = supabase
      .channel('payout-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payout_requests',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedRequest = payload.new as any;
          if (updatedRequest.status === 'completed') {
            toast({
              title: "Payment Successful! 💸",
              description: `₹${updatedRequest.amount} has been paid to your account`,
            });
            loadWalletData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleWithdrawalRequest = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!wallet || wallet.total_balance < 200) {
      toast({
        title: "Insufficient Balance",
        description: "You need at least ₹200 to request a withdrawal.",
        variant: "destructive",
      });
      return;
    }

    if (payoutMethod === "upi" && !upiId) {
      toast({
        title: "Missing Information",
        description: "Please enter your UPI ID.",
        variant: "destructive",
      });
      return;
    }

    if (payoutMethod === "bank" && (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolder)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all bank details.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("payout_requests").insert({
      user_id: user.id,
      amount: wallet.total_balance,
      payout_method: payoutMethod,
      upi_id: payoutMethod === "upi" ? upiId : null,
      bank_account_number: payoutMethod === "bank" ? bankDetails.accountNumber : null,
      bank_ifsc_code: payoutMethod === "bank" ? bankDetails.ifscCode : null,
      bank_account_holder: payoutMethod === "bank" ? bankDetails.accountHolder : null,
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Request Failed",
        description: "Failed to submit withdrawal request. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Withdrawal Requested!",
      description: `You'll receive ₹${wallet.total_balance.toFixed(2)} within 48 hours.`,
    });

    setShowWithdrawalForm(false);
    setUpiId("");
    setBankDetails({ accountNumber: "", ifscCode: "", accountHolder: "" });
    loadWalletData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-warning" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "pending":
        return "🕒";
      case "completed":
        return "✅";
      case "processing":
        return "💸";
      default:
        return "🕒";
    }
  };

  const filterTransactions = (type?: string) => {
    if (!type) return [...transactions, ...payoutRequests.map(p => ({
      ...p,
      type: "withdrawal",
      description: `Withdrawal via ${p.payout_method}`,
    }))];
    
    if (type === "earnings") {
      return transactions.filter((t: any) => 
        t.type === "earning" || t.type === "bonus"
      );
    }
    
    if (type === "withdrawals") {
      return [...payoutRequests.map(p => ({
        ...p,
        type: "withdrawal",
        description: `Withdrawal via ${p.payout_method}`,
      })), ...transactions.filter((t: any) => t.type === "deduction")];
    }
    
    return [];
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-heading font-bold mb-8">Wallet</h1>

        {/* Balance Cards */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card className="p-6 bg-gradient-to-br from-primary/20 to-primary/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/20 rounded-2xl">
                <WalletIcon className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Total Balance
              </span>
            </div>
            <p className="text-3xl font-heading font-bold text-primary">
              ₹{wallet?.total_balance?.toFixed(2) || "0.00"}
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-muted/50 to-muted/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-muted rounded-2xl">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Pending Balance
              </span>
            </div>
            <p className="text-3xl font-heading font-bold">
              ₹{wallet?.pending_balance?.toFixed(2) || "0.00"}
            </p>
          </Card>
        </div>

        {/* Payout Info & Withdrawal Button */}
        <Card className="p-4 mb-8 bg-accent/50 border-accent">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Payout Information</h3>
                <p className="text-sm text-muted-foreground">
                  Payouts are processed within 48 hours once your balance reaches ₹200
                </p>
              </div>
            </div>
            {wallet && wallet.total_balance >= 200 && (
              <Button
                onClick={() => setShowWithdrawalForm(!showWithdrawalForm)}
                className="shrink-0"
              >
                Request Withdrawal
              </Button>
            )}
          </div>
        </Card>

        {/* Withdrawal Form */}
        {showWithdrawalForm && (
          <Card className="p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Request Withdrawal</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="mb-3 block">Choose Payout Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={payoutMethod === "upi" ? "default" : "outline"}
                    onClick={() => setPayoutMethod("upi")}
                    className="h-auto py-4 flex-col gap-2"
                  >
                    <Banknote className="h-6 w-6" />
                    UPI
                  </Button>
                  <Button
                    variant={payoutMethod === "bank" ? "default" : "outline"}
                    onClick={() => setPayoutMethod("bank")}
                    className="h-auto py-4 flex-col gap-2"
                  >
                    <CreditCard className="h-6 w-6" />
                    Bank Transfer
                  </Button>
                </div>
              </div>

              {payoutMethod === "upi" ? (
                <div>
                  <Label htmlFor="upi">UPI ID</Label>
                  <Input
                    id="upi"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="accountHolder">Account Holder Name</Label>
                    <Input
                      id="accountHolder"
                      placeholder="Full name as per bank"
                      value={bankDetails.accountHolder}
                      onChange={(e) =>
                        setBankDetails({ ...bankDetails, accountHolder: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      placeholder="Enter account number"
                      value={bankDetails.accountNumber}
                      onChange={(e) =>
                        setBankDetails({ ...bankDetails, accountNumber: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ifsc">IFSC Code</Label>
                    <Input
                      id="ifsc"
                      placeholder="Enter IFSC code"
                      value={bankDetails.ifscCode}
                      onChange={(e) =>
                        setBankDetails({ ...bankDetails, ifscCode: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              <Card className="p-4 bg-muted/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Withdrawal Amount</span>
                  <span className="text-lg font-bold text-primary">
                    ₹{wallet?.total_balance?.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  This amount will be credited to your {payoutMethod === "upi" ? "UPI" : "bank"} account within 48 hours
                </p>
              </Card>

              <Button
                onClick={handleWithdrawalRequest}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? "Processing..." : "Confirm Withdrawal"}
              </Button>
            </div>
          </Card>
        )}

        {/* Transaction History */}
        <div>
          <h2 className="text-xl font-heading font-semibold mb-4">Transaction History</h2>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="earnings" className="flex-1">Earnings</TabsTrigger>
              <TabsTrigger value="withdrawals" className="flex-1">Withdrawals</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {filterTransactions().length > 0 ? (
                <div className="space-y-3">
                  {filterTransactions().map((item: any) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-2xl ${
                            item.type === "earning" || item.type === "bonus" ? "bg-success/20" : 
                            item.type === "withdrawal" || item.type === "deduction" ? "bg-primary/20" : "bg-destructive/20"
                          }`}>
                            {getStatusIcon(item.status)}
                          </div>
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(item.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-heading font-bold ${
                            item.type === "earning" || item.type === "bonus" ? "text-success" : "text-primary"
                          }`}>
                            {item.type === "earning" || item.type === "bonus" ? "+" : "-"}₹{item.amount}
                          </p>
                          <div className="flex items-center gap-1">
                            <span>{getStatusEmoji(item.status)}</span>
                            <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No transactions yet</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="earnings" className="mt-4">
              {filterTransactions("earnings").length > 0 ? (
                <div className="space-y-3">
                  {filterTransactions("earnings").map((transaction: any) => (
                    <Card key={transaction.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-2xl bg-success/20">
                            {getStatusIcon(transaction.status)}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(transaction.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-heading font-bold text-success">
                            +₹{transaction.amount}
                          </p>
                          <div className="flex items-center gap-1">
                            <span>{getStatusEmoji(transaction.status)}</span>
                            <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No earnings yet</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="withdrawals" className="mt-4">
              {filterTransactions("withdrawals").length > 0 ? (
                <div className="space-y-3">
                  {filterTransactions("withdrawals").map((payout: any) => (
                    <Card key={payout.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-2xl bg-primary/20">
                            {getStatusIcon(payout.status)}
                          </div>
                          <div>
                            <p className="font-medium">{payout.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(payout.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-heading font-bold text-primary">
                            -₹{payout.amount}
                          </p>
                          <div className="flex items-center gap-1">
                            <span>{getStatusEmoji(payout.status)}</span>
                            <Badge variant={payout.status === "completed" ? "default" : "secondary"}>
                              {payout.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No withdrawals yet</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Wallet;
