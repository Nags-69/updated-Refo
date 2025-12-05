import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, Star, Shield, ArrowRight, Download,
  Smartphone, Wallet, Users, Trophy, Zap, Clock,
  CreditCard, Gift, TrendingUp, Sparkles
} from "lucide-react";
import NewdonBackground from "@/components/NewdonBackground";
import ScrollCard from "@/components/ScrollCard";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Animated section wrapper component
const AnimatedSection = ({
  children,
  className = "",
  delay = 0,
  threshold = 0.1
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold, rootMargin: "50px" }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-smooth",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Animated counter component
const AnimatedCounter = ({ value, label }: { value: string; label: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "text-center group transition-all duration-500 ease-smooth",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
      )}
    >
      <div className="text-3xl md:text-4xl font-extrabold text-foreground group-hover:text-primary transition-colors duration-300">
        {value}
      </div>
      <div className="text-sm text-muted-foreground mt-1 font-medium">{label}</div>
    </div>
  );
};

const Newdon = () => {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [featuredOffers, setFeaturedOffers] = useState<any[]>([]);
  const [heroVisible, setHeroVisible] = useState(false);
  const { user } = useAuth();

  // Trigger hero animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchFeaturedOffers = async () => {
      const { data } = await supabase
        .from("offers")
        .select("*")
        .eq("is_public", true)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6);

      if (data) {
        setFeaturedOffers(data);
      }
    };
    fetchFeaturedOffers();
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      setShowAuthModal(true);
    }
  };

  const appCategories = [
    { name: "Finance Apps", count: "25+", icon: CreditCard, color: "text-emerald-500" },
    { name: "Gaming Apps", count: "40+", icon: Trophy, color: "text-amber-500" },
    { name: "Shopping Apps", count: "30+", icon: Gift, color: "text-pink-500" },
    { name: "Social Apps", count: "20+", icon: Users, color: "text-blue-500" },
  ];

  const stats = [
    { value: "₹5L+", label: "Total Paid Out" },
    { value: "500+", label: "Happy Users" },
    { value: "100+", label: "Active Offers" },
    { value: "24hrs", label: "Avg Payout Time" },
  ];

  const howItWorksSteps = [
    {
      step: "01",
      icon: Download,
      title: "Browse & Download",
      desc: "Explore our curated list of high-paying apps. Pick any offer that interests you and download the app.",
    },
    {
      step: "02",
      icon: Smartphone,
      title: "Complete Tasks",
      desc: "Follow simple instructions like signing up, making a first transaction, or reaching a game level.",
    },
    {
      step: "03",
      icon: Wallet,
      title: "Get Paid Instantly",
      desc: "Upload your proof, get verified within 24 hours, and withdraw to UPI or bank account.",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "100% Secure",
      desc: "Your data is encrypted. We never share your information with third parties.",
      color: "text-emerald-500",
    },
    {
      icon: Clock,
      title: "Fast Payouts",
      desc: "Get paid within 24-48 hours. No minimum waiting period for withdrawals.",
      color: "text-blue-500",
    },
    {
      icon: CreditCard,
      title: "Zero Fees",
      desc: "Keep 100% of your earnings. No hidden charges, no deductions ever.",
      color: "text-amber-500",
    },
    {
      icon: Users,
      title: "Refer & Earn",
      desc: "Invite friends and earn bonus rewards when they complete tasks.",
      color: "text-pink-500",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      desc: "Real-time dashboard showing your earnings, tasks, and leaderboard rank.",
      color: "text-purple-500",
    },
    {
      icon: Gift,
      title: "Daily Bonuses",
      desc: "Streak rewards, badges, and surprise bonuses for active users.",
      color: "text-red-500",
    },
  ];

  const faqs = [
    {
      q: "How do I earn money on Refo?",
      a: "Simply browse our offers, download the recommended apps, complete the specified tasks (like signing up or making a transaction), and submit proof. Once verified, the reward is credited to your wallet.",
    },
    {
      q: "Is Refo free to use?",
      a: "Yes! Refo is 100% free. There are no hidden fees, no subscription charges, and no deductions from your earnings. You keep everything you earn.",
    },
    {
      q: "How quickly will I get paid?",
      a: "Most tasks are verified within 24-48 hours. Once verified, you can withdraw your earnings instantly to your UPI ID or bank account.",
    },
    {
      q: "What kind of tasks do I need to complete?",
      a: "Tasks vary by app. Common tasks include: signing up, completing KYC, making a first deposit, playing games, or shopping. Each offer clearly mentions the required task.",
    },
    {
      q: "Is my data safe with Refo?",
      a: "Absolutely. We use industry-standard encryption and never share your personal information with third parties. Your privacy and security are our top priorities.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-background">
      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />

      {/* Animated Background */}
      <NewdonBackground />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen ">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            {/* Badge */}
            <div
              className={cn(
                "inline-flex items-center gap-2 glass px-5 py-2.5 rounded-full shadow-lg transition-all duration-700 ease-smooth",
                heroVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-4"
              )}
            >
              <Sparkles className="w-4 h-4 text-primary animate-pulse-soft" />
              <span className="text-sm font-medium tracking-wide">Join 500+ users earning daily</span>
            </div>

            {/* Main Heading */}
            <h1
              className={cn(
                "text-5xl md:text-7xl lg:text-8xl font-heading font-extrabold tracking-tighter leading-[0.95] transition-all duration-2000 ease-smooth",
                heroVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: "200ms" }}
            >
              Download.
              <br />
              <span className="bg-gradient-to-r from-primary via-violet-500 to-pink-500 bg-clip-text text-transparent animate-pulse-soft">
                Earn.
              </span>
              <br />
              Repeat.
            </h1>

            {/* Subtitle */}
            <p
              className={cn(
                "text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed transition-all duration-700 ease-smooth",
                heroVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: "300ms" }}
            >
              Turn your smartphone into a money machine. Download apps, complete simple tasks,
              and watch your earnings grow. <span className="text-foreground font-semibold">No fees. No hassle. Just rewards.</span>
            </p>

            {/* CTA Buttons */}
            <div
              className={cn(
                "flex flex-col sm:flex-row gap-4 justify-center items-center pt-2 transition-all duration-700 ease-smooth",
                heroVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: "450ms" }}
            >
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-10 py-7 text-lg font-bold shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300 ease-smooth group"
              >
                Start Earning Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <p className="text-sm text-muted-foreground font-medium">Free forever • No credit card</p>
            </div>

            {/* Stats Row */}
            <div
              className={cn(
                "grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 max-w-3xl mx-auto transition-all duration-700 ease-smooth",
                heroVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: "600ms" }}
            >
              {stats.map((stat, i) => (
                <AnimatedCounter key={i} value={stat.value} label={stat.label} />
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            className={cn(
              "absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-1000 ease-smooth",
              heroVisible ? "opacity-100" : "opacity-0"
            )}
            style={{ transitionDelay: "1000ms" }}
          >
            <div className="animate-float">
              <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-2">
                <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full animate-pulse-soft" />
              </div>
            </div>
          </div>
        </section>

        {/* --- STACKED CARDS SECTION --- */}
        {/* We use pb-[20vh] to ensure the last card has room to finish scrolling/animating before the section ends */}
        <section className="relative px-4 pb-[20vh] bg-background">
          <div className="max-w-6xl mx-auto w-full">

            {/* Card 1: How It Works */}
            <ScrollCard index={0} totalCards={3}>
              <div className="bg-card/90 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl p-8 md:p-12 lg:p-16 min-h-[60vh] flex flex-col justify-center">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <AnimatedSection>
                    <div className="space-y-6">
                      <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 animate-fade-in">
                        <Zap className="w-3 h-3 mr-1" />
                        How It Works
                      </Badge>
                      <h2 className="text-4xl md:text-5xl font-heading font-bold">
                        Three Simple Steps to
                        <span className="text-primary"> Start Earning</span>
                      </h2>
                      <p className="text-lg text-muted-foreground">
                        No experience needed. No investment required. Just follow these easy steps
                        and start making money from your phone today.
                      </p>
                      <Button
                        onClick={handleGetStarted}
                        size="lg"
                        className="rounded-full group hover:scale-105 transition-all duration-300"
                      >
                        Get Started <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </div>
                  </AnimatedSection>

                  <div className="space-y-6">
                    {howItWorksSteps.map((item, i) => (
                      <AnimatedSection key={i} delay={i * 150}>
                        <div className="flex gap-4 p-4 rounded-2xl bg-background/50 border border-border/30 hover:border-primary/30 hover:bg-background/80 transition-all duration-300 group cursor-default">
                          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                            <item.icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-primary">{item.step}</span>
                              <h3 className="font-semibold text-lg">{item.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                      </AnimatedSection>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollCard>

            {/* Card 2: App Categories */}
            <ScrollCard index={1} totalCards={3}>
              <div className="bg-gradient-to-br from-card/95 via-card/90 to-primary/5 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl mb-24 p-8 md:p-12 lg:p-16 min-h-[60vh] flex flex-col justify-center">
                <AnimatedSection className="text-center mb-12">
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-4 py-1.5 mb-4">
                    <Trophy className="w-3 h-3 mr-1" />
                    Top Earning Categories
                  </Badge>
                  <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                    100+ Apps Waiting
                    <span className="text-primary"> For You</span>
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    From finance to gaming, shopping to social — earn rewards from apps you'd probably use anyway.
                  </p>
                </AnimatedSection>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {appCategories.map((cat, i) => (
                    <AnimatedSection key={i} delay={i * 100}>
                      <div
                        className="group p-6 rounded-2xl bg-background/60 border border-border/30 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                      >
                        <cat.icon className={`w-10 h-10 ${cat.color} mb-4 group-hover:scale-110 transition-transform duration-300`} />
                        <h3 className="font-semibold text-lg mb-1">{cat.name}</h3>
                        <p className="text-2xl font-bold text-primary">{cat.count}</p>
                        <p className="text-xs text-muted-foreground">Active Offers</p>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>

                <AnimatedSection delay={400}>
                  <div className="bg-background/50 rounded-2xl p-6 md:p-8 border border-border/30 hover:border-primary/20 transition-all duration-300">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-center md:text-left">
                        <h3 className="text-2xl font-bold mb-2">Popular Apps Right Now</h3>
                        <p className="text-muted-foreground">
                          PhonePe, Google Pay, Groww, Upstox, Dream11, MPL, Amazon, Flipkart & many more...
                        </p>
                      </div>
                      <Button
                        onClick={handleGetStarted}
                        size="lg"
                        className="rounded-full whitespace-nowrap group hover:scale-105 transition-all duration-300"
                      >
                        View All Offers <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </ScrollCard>

            {/* Card 3: Why Choose Us */}
            <ScrollCard index={2} totalCards={3}>
              <div className="bg-card/90 backdrop-blur-xl rounded-3xl border border-border/50 mt-4 shadow-2xl p-8 md:p-12 lg:p-16 min-h-[60vh] flex flex-col justify-center">
                <AnimatedSection className="text-center mb-12">
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-4 py-1.5 mb-4">
                    <Shield className="w-3 h-3 mr-1" />
                    Why Refo
                  </Badge>
                  <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                    Built for
                    <span className="text-primary"> Earners Like You</span>
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    We're not just another rewards app. We're your partner in building a side income stream.
                  </p>
                </AnimatedSection>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {features.map((feature, i) => (
                    <AnimatedSection key={i} delay={i * 100}>
                      <div className="p-6 rounded-2xl bg-background/50 border border-border/30 hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
                        <feature.icon className={`w-8 h-8 ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`} />
                        <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.desc}</p>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>

                {/* Trust Badges */}
                <AnimatedSection delay={600}>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <Badge variant="secondary" className="px-5 py-2.5 text-sm hover:scale-105 transition-transform duration-300 cursor-default">
                      <Star className="w-4 h-4 text-amber-500 mr-2" />
                      4.9/5 User Rating
                    </Badge>
                    <Badge variant="secondary" className="px-5 py-2.5 text-sm hover:scale-105 transition-transform duration-300 cursor-default">
                      <Shield className="w-4 h-4 text-emerald-500 mr-2" />
                      Verified Payments
                    </Badge>
                    <Badge variant="secondary" className="px-5 py-2.5 text-sm hover:scale-105 transition-transform duration-300 cursor-default">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mr-2" />
                      500+ Users Paid
                    </Badge>
                  </div>
                </AnimatedSection>
              </div>
            </ScrollCard>
          </div>
        </section>

        {/* Featured Apps Section */}
        <section className="px-4 py-14">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-8">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                Featured Apps
              </Badge>
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                Start Earning
                <span className="text-primary"> Today</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Here are some of our top-paying apps to get you started right away.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {featuredOffers.map((offer, index) => (
                <AnimatedSection key={offer.id} delay={index * 100}>
                  <Card
                    className="p-5 hover-lift border-border/50 cursor-pointer group glass"
                    onClick={handleGetStarted}
                  >
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 ease-smooth overflow-hidden">
                        {offer.logo_url ? (
                          <img src={offer.logo_url} alt={offer.title} className="w-12 h-12 object-contain" />
                        ) : (
                          <span className="text-2xl font-heading font-bold text-primary">
                            {offer.title.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-heading font-bold text-base line-clamp-1">{offer.title}</h3>
                          <Badge className="bg-success text-success-foreground whitespace-nowrap font-bold">
                            ₹{offer.reward}
                          </Badge>
                        </div>

                        {offer.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {offer.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          {offer.category && (
                            <Badge variant="secondary" className="text-xs font-medium">
                              {offer.category}
                            </Badge>
                          )}

                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5 font-semibold hover:scale-105 transition-transform duration-300 ease-smooth"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetStarted();
                            }}
                          >
                            Start Task
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection className="text-center" delay={600}>
              <Button
                onClick={handleGetStarted}
                variant="outline"
                size="lg"
                className="rounded-full font-semibold hover:scale-105 transition-transform duration-300 ease-smooth group"
              >
                View All 100+ Offers <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </AnimatedSection>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-16">
          <AnimatedSection className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
              Ready to Start
              <span className="text-primary"> Earning?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of users who are already making money with Refo. It takes less than 2 minutes to get started.
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-10 py-7 text-lg font-bold shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300 ease-smooth group"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </AnimatedSection>
        </section>

        {/* FAQ Section */}
        <section className="px-4 py-14 bg-card/30">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection className="text-center mb-8">
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-4 py-1.5 mb-4 font-medium">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                FAQs
              </Badge>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Frequently Asked
                <span className="text-primary"> Questions</span>
              </h2>
            </AnimatedSection>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <AnimatedSection key={i} delay={i * 100}>
                  <details
                    className="group glass rounded-xl overflow-hidden"
                  >
                    <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-muted/30 transition-all duration-300 ease-smooth">
                      <h3 className="font-semibold text-base pr-4">{faq.q}</h3>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform duration-300 ease-smooth flex-shrink-0" />
                    </summary>
                    <div className="px-5 pb-5 pt-0 text-muted-foreground text-sm leading-relaxed animate-fade-up">
                      {faq.a}
                    </div>
                  </details>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>



        {/* Footer */}
        <AnimatedSection>
          <footer className="glass border-t border-border/30">
            <div className="max-w-6xl mx-auto px-4 py-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-heading font-bold">Refo</h3>
                  <p className="text-sm text-muted-foreground">
                    India's most trusted rewards platform. Download apps, earn real money.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs hover:scale-105 transition-transform duration-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Secure
                    </Badge>
                    <Badge variant="secondary" className="text-xs hover:scale-105 transition-transform duration-300">
                      <Shield className="w-3 h-3 mr-1" />
                      No Fees
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Platform</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><button onClick={handleGetStarted} className="hover:text-foreground hover:translate-x-1 transition-all duration-300">Browse Offers</button></li>
                    <li><button onClick={handleGetStarted} className="hover:text-foreground hover:translate-x-1 transition-all duration-300">Dashboard</button></li>
                    <li><button onClick={handleGetStarted} className="hover:text-foreground hover:translate-x-1 transition-all duration-300">Leaderboard</button></li>
                    <li><button onClick={handleGetStarted} className="hover:text-foreground hover:translate-x-1 transition-all duration-300">Wallet</button></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Support</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><a href="#" className="hover:text-foreground hover:translate-x-1 inline-block transition-all duration-300">Help Center</a></li>
                    <li><a href="#" className="hover:text-foreground hover:translate-x-1 inline-block transition-all duration-300">Contact Us</a></li>
                    <li><a href="#" className="hover:text-foreground hover:translate-x-1 inline-block transition-all duration-300">FAQs</a></li>
                    <li><button onClick={handleGetStarted} className="hover:text-foreground hover:translate-x-1 transition-all duration-300">AI Assistant</button></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Legal</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><a href="#" className="hover:text-foreground hover:translate-x-1 inline-block transition-all duration-300">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-foreground hover:translate-x-1 inline-block transition-all duration-300">Terms of Service</a></li>
                    <li><a href="#" className="hover:text-foreground hover:translate-x-1 inline-block transition-all duration-300">Cookie Policy</a></li>
                    <li><a href="#" className="hover:text-foreground hover:translate-x-1 inline-block transition-all duration-300">Refund Policy</a></li>
                  </ul>
                </div>
              </div>

              <div className="pt-8 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} Refo. All rights reserved. Made with ❤️ for earners across India.
                </p>
              </div>
            </div>
          </footer>
        </AnimatedSection>

        <BottomNav />
      </div>
    </div>
  );
};

export default Newdon;