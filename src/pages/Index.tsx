import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import OfferCard from "@/components/OfferCard";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Star, Shield, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    const { data } = await supabase
      .from("offers")
      .select("*")
      .eq("is_public", true)
      .eq("status", "active")
      .limit(6);
    
    if (data) setOffers(data);
  };

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={() => {
          setShowAuthModal(false);
          navigate("/dashboard");
        }}
      />
      <div className="min-h-screen bg-background pb-24">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent to-secondary">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm font-medium">500+ users already paid</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight">
                Download apps.
                <br />
                <span className="text-primary">Earn rewards.</span>
                <br />
                Simple.
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Complete simple tasks, earn real money. No hidden fees, no hassle.
              </p>
              
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              {/* Trust Chips */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Badge variant="secondary" className="px-4 py-2">
                  <Star className="w-4 h-4 text-primary mr-1" />
                  4.9/5 Rating
                </Badge>
                <Badge variant="secondary" className="px-4 py-2">
                  <Shield className="w-4 h-4 text-success mr-1" />
                  No Fees
                </Badge>
                <Badge variant="secondary" className="px-4 py-2">
                  <CheckCircle2 className="w-4 h-4 text-success mr-1" />
                  500+ Paid Users
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Top Offers Section */}
        <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="mb-8">
            <h2 className="text-3xl font-heading font-bold mb-2">Top Offers</h2>
            <p className="text-muted-foreground">Start earning with these popular offers</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer: any) => (
              <OfferCard
                key={offer.id}
                title={offer.title}
                description={offer.description}
                logoUrl={offer.logo_url}
                reward={offer.reward}
                category={offer.category}
                onStartTask={handleGetStarted}
              />
            ))}
          </div>
          
          {offers.length === 6 && (
            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleGetStarted}
                className="rounded-full"
              >
                View All Offers
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-heading font-bold mb-2">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know about earning with Refo</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2">How do I earn money?</h3>
              <p className="text-muted-foreground">Simply download apps from our offers, complete the required tasks, and upload proof. Once verified by our team, the reward is added to your wallet instantly.</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2">When can I withdraw my earnings?</h3>
              <p className="text-muted-foreground">You can request a payout anytime once your balance reaches the minimum withdrawal amount. Payouts are processed within 24-48 hours via UPI or bank transfer.</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2">What proof do I need to upload?</h3>
              <p className="text-muted-foreground">Each offer has specific instructions. Typically, you'll need screenshots showing app installation, account creation, or task completion. Make sure screenshots are clear and show all required information.</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2">Is there any fee to join?</h3>
              <p className="text-muted-foreground">No! Joining Refo is completely free. We don't charge any registration fees, and all payouts are processed without deductions.</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2">How does the referral program work?</h3>
              <p className="text-muted-foreground">Share your unique affiliate link with friends. When they sign up and complete tasks, you earn bonus rewards. Track your referrals and earnings in your dashboard.</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2">What if my task is rejected?</h3>
              <p className="text-muted-foreground">If your proof doesn't meet the requirements, our team will provide feedback. You can resubmit with correct proof. Make sure to follow all instructions carefully to avoid rejections.</p>
            </div>
          </div>
        </section>


        {/* Footer */}
        <footer className="bg-card border-t border-border mt-12">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-xl font-heading font-bold">Refo</h3>
                <p className="text-sm text-muted-foreground">
                  Download apps, earn rewards. The simplest way to make money online.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Secure
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    No Fees
                  </Badge>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Platform</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><button onClick={handleGetStarted} className="hover:text-foreground transition-colors">Browse Offers</button></li>
                  <li><button onClick={handleGetStarted} className="hover:text-foreground transition-colors">Dashboard</button></li>
                  <li><button onClick={handleGetStarted} className="hover:text-foreground transition-colors">Leaderboard</button></li>
                  <li><button onClick={handleGetStarted} className="hover:text-foreground transition-colors">Wallet</button></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">FAQs</a></li>
                  <li><button onClick={handleGetStarted} className="hover:text-foreground transition-colors">AI Assistant</button></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Refund Policy</a></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Refo. All rights reserved. Made with ❤️ for earners worldwide.
              </p>
            </div>
          </div>
        </footer>

        <BottomNav />
      </div>
    </>
  );
};

export default Index;
