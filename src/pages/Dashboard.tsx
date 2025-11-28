import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check, Upload, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import OfferCard from "@/components/OfferCard";

const Dashboard = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [tasks, setTasks] = useState([]);
  const [offers, setOffers] = useState([]);
  const [affiliateLink, setAffiliateLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [agreedToInstructions, setAgreedToInstructions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadDashboardData(user.id);
    }
  }, [user]);

  const loadDashboardData = async (userId: string) => {
    // Load wallet
    const { data: walletData } = await supabase
      .from("wallet")
      .select("*")
      .eq("user_id", userId)
      .single();
    setWallet(walletData);

    // Load tasks
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*, offers(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setTasks(tasksData || []);

    // Load available offers
    const { data: offersData } = await supabase
      .from("offers")
      .select("*")
      .eq("is_public", true)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    setOffers(offersData || []);

    // Load affiliate link
    const { data: affiliateData } = await supabase
      .from("affiliate_links")
      .select("unique_code")
      .eq("user_id", userId)
      .single();
    
    if (affiliateData) {
      setAffiliateLink(`${window.location.origin}/?partner=${affiliateData.unique_code}`);
    }
  };

  const handleOfferClick = (offer: any) => {
    setSelectedOffer(offer);
    setAgreedToInstructions(false);
  };

  const handleContinue = async () => {
    if (!user || !selectedOffer) return;

    // Store the URL before any async operations for iOS compatibility
    const redirectUrl = selectedOffer.play_store_url;
    
    // Redirect immediately on iOS/Safari for better compatibility
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && redirectUrl) {
      window.location.href = redirectUrl;
    }

    // Check if task already exists
    const { data: existingTask } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("offer_id", selectedOffer.id)
      .maybeSingle();

    if (existingTask) {
      toast({
        title: "Task already started",
        description: "Redirecting to app download...",
      });
      // Redirect for non-iOS devices
      if (!isIOS && redirectUrl) {
        window.location.href = redirectUrl;
      }
      setSelectedOffer(null);
      return;
    }

    // Create new task
    const { error } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        offer_id: selectedOffer.id,
        status: "pending",
      });

    if (error) {
      toast({
        title: "Failed to start task",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Add pending transaction and update wallet
    const { error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "earning",
        amount: selectedOffer.reward,
        status: "pending",
        description: `Pending: ${selectedOffer.title}`,
      });

    if (!transactionError) {
      // Update wallet pending balance
      await supabase.rpc('increment_pending_balance' as any, {
        p_user_id: user.id,
        p_amount: selectedOffer.reward
      }).then((result) => {
        // If RPC doesn't exist, fallback to manual update
        if (result.error) {
          supabase
            .from("wallet")
            .select("pending_balance")
            .eq("user_id", user.id)
            .single()
            .then(({ data: walletData }) => {
              if (walletData) {
                supabase
                  .from("wallet")
                  .update({
                    pending_balance: Number(walletData.pending_balance || 0) + Number(selectedOffer.reward)
                  })
                  .eq("user_id", user.id);
              }
            });
        }
      });
    }

    toast({
      title: "Task started!",
      description: "Redirecting to app download...",
    });

    // Redirect for non-iOS devices
    if (!isIOS && redirectUrl) {
      window.location.href = redirectUrl;
    }

    setSelectedOffer(null);
    loadDashboardData(user.id);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Affiliate link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate all files
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isUnder5MB = file.size <= 5 * 1024 * 1024;
      
      if (!isImage) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file`,
          variant: "destructive"
        });
        return false;
      }
      
      if (!isUnder5MB) {
        toast({
          title: "File too large",
          description: `${file.name} must be under 5MB`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
    }
  };

  const handleUploadClick = (taskId: string) => {
    setUploadingTaskId(taskId);
    setSelectedFiles([]);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async () => {
    if (!uploadingTaskId || selectedFiles.length === 0 || !user) return;

    try {
      const uploadedUrls: string[] = [];
      
      // Upload all selected files
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${uploadingTaskId}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('task-proofs')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('task-proofs')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      // Get existing proof URLs
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('proof_url')
        .eq('id', uploadingTaskId)
        .single();

      // Ensure proof_url is always an array
      const existingUrls = existingTask?.proof_url 
        ? (Array.isArray(existingTask.proof_url) ? existingTask.proof_url : [existingTask.proof_url])
        : [];

      // Combine existing and new URLs
      const allUrls = [
        ...existingUrls,
        ...uploadedUrls
      ];

      // Update task with all proof URLs
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          proof_url: allUrls as any,
          proof_uploaded_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', uploadingTaskId);

      if (updateError) throw updateError;

      // Update gamification (streaks and badges)
      try {
        await supabase.functions.invoke('update-gamification', {
          body: { userId: user.id }
        });
      } catch (gamError) {
        console.log('Gamification update failed:', gamError);
        // Don't block task completion if gamification fails
      }

      toast({
        title: "Success!",
        description: `${selectedFiles.length} screenshot(s) uploaded successfully`
      });

      loadDashboardData(user.id);
      setSelectedFiles([]);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingTaskId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: "secondary",
      completed: "default",
      verified: "default",
      rejected: "destructive",
    };
    const colors: any = {
      pending: "bg-muted",
      completed: "bg-primary",
      verified: "bg-success",
      rejected: "bg-destructive",
    };
    
    return (
      <Badge className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
            {wallet && (
              <Card className="px-4 py-2 bg-primary/10">
                <span className="text-sm text-muted-foreground">Wallet Balance</span>
                <p className="text-xl font-heading font-bold text-primary">
                  ₹{wallet.total_balance?.toFixed(2)}
                </p>
              </Card>
            )}
          </div>
        </div>

        <Tabs defaultValue="offers" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="affiliate">Affiliate</TabsTrigger>
          </TabsList>

          <TabsContent value="offers" className="space-y-4">
            {offers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.map((offer: any) => (
                  <OfferCard
                    key={offer.id}
                    title={offer.title}
                    description={offer.description}
                    reward={offer.reward}
                    logoUrl={offer.logo_url}
                    category={offer.category}
                    status={offer.status}
                    onStartTask={() => handleOfferClick(offer)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  No offers available at the moment
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload proof screenshots for your tasks. Multiple images supported.
            </p>
            {tasks.length > 0 ? (
              tasks.map((task: any) => (
                <Card key={task.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{task.offers?.title}</h3>
                      <p className="text-sm text-muted-foreground">Reward: ₹{task.offers?.reward}</p>
                      {getStatusBadge(task.status)}
                      {task.proof_url && task.proof_url.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {task.proof_url.length} screenshot(s) uploaded
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUploadClick(task.id)}
                        disabled={uploadingTaskId === task.id}
                      >
                        {uploadingTaskId === task.id ? "Uploading..." : 
                         task.proof_url && task.proof_url.length > 0 ? "Add More" : "Upload Proof"}
                      </Button>
                      {selectedFiles.length > 0 && uploadingTaskId === task.id && (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs text-muted-foreground">
                            {selectedFiles.length} file(s) selected
                          </p>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={handleFileUpload}
                          >
                            Confirm Upload
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  No tasks yet. Start with an offer from the Home page!
                </p>
              </Card>
            )}
          </TabsContent>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          <TabsContent value="affiliate" className="space-y-4">
            <Card className="relative overflow-hidden p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 opacity-50" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-heading font-semibold text-2xl mb-2">Affiliate Program</h3>
                    <p className="text-sm text-muted-foreground">Exciting rewards coming your way!</p>
                  </div>
                  <Badge variant="secondary" className="text-xs px-3 py-1.5 font-semibold">
                    Coming Soon
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-6 text-center space-y-2">
                    <p className="text-lg font-medium">Share & Earn Program</p>
                    <p className="text-sm text-muted-foreground">
                      Our affiliate program is launching soon! Get ready to earn bonus rewards by inviting friends.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-card/50 p-4 rounded-lg border border-border/50 text-center">
                      <p className="font-semibold mb-1">📊 Track Referrals</p>
                      <p className="text-muted-foreground text-xs">Monitor your affiliate performance</p>
                    </div>
                    <div className="bg-card/50 p-4 rounded-lg border border-border/50 text-center">
                      <p className="font-semibold mb-1">💰 Earn Bonuses</p>
                      <p className="text-muted-foreground text-xs">Get rewarded for each conversion</p>
                    </div>
                    <div className="bg-card/50 p-4 rounded-lg border border-border/50 text-center">
                      <p className="font-semibold mb-1">🎁 Special Perks</p>
                      <p className="text-muted-foreground text-xs">Unlock exclusive benefits</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />

      {/* Instructions Dialog */}
      <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">{selectedOffer?.title}</DialogTitle>
            <DialogDescription>Complete the following steps to earn ₹{selectedOffer?.reward}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-semibold mb-3">Instructions:</h4>
              <ul className="space-y-2">
                {selectedOffer?.instructions && selectedOffer.instructions.length > 0 ? (
                  selectedOffer.instructions.map((instruction: string, index: number) => (
                    <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary font-semibold">{index + 1}.</span>
                      <span>{instruction}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary font-semibold">1.</span>
                      <span>Download and install the app from Play Store</span>
                    </li>
                    <li className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary font-semibold">2.</span>
                      <span>Complete the required action as specified</span>
                    </li>
                    <li className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary font-semibold">3.</span>
                      <span>Take a screenshot as proof of completion</span>
                    </li>
                    <li className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary font-semibold">4.</span>
                      <span>Upload the proof in 'My Tasks' tab</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-lg">
              <Checkbox 
                id="agree" 
                checked={agreedToInstructions}
                onCheckedChange={(checked) => setAgreedToInstructions(checked as boolean)}
              />
              <label 
                htmlFor="agree" 
                className="text-sm cursor-pointer leading-tight"
              >
                I agree with the instructions and will complete the task as specified
              </label>
            </div>

            <Button 
              className="w-full" 
              disabled={!agreedToInstructions}
              onClick={handleContinue}
            >
              Continue to Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
