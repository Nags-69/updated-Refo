import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AntigravityBackground from "@/components/ui/AntigravityBackground";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import OfferCard from "@/components/OfferCard";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Star, Shield, ArrowRight, Smartphone, Coins, Users, Zap, TrendingUp, Gift, Download, Play, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, useScroll, useTransform } from "framer-motion";

const RevealText = ({ children, delay = 0, className = "" }: { children: string, delay?: number, className?: string }) => {
  const words = children.split(" ");
  return (
    <span className={`inline-block ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: delay + i * 0.05, ease: "easeOut" }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const { scrollY } = useScroll();

  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95]);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const { data } = await supabase
        .from("offers")
        .select("*")
        .eq("is_public", true)
        .eq("status", "active")
        .limit(6);

      if (data) setOffers(data);
    } finally {
      setLoading(false);
    }
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
      <div className="min-h-screen bg-transparent pb-0 selection:bg-primary/20 relative">
        <AntigravityBackground />

        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale }}
            className="relative z-20 max-w-7xl mx-auto px-4 py-10 md:py-16 text-center"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-secondary/50 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 shadow-xl"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 tracking-wide">
                  500+ users earning daily
                </span>
              </motion.div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tighter leading-[1.1]">
                <span className="block bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">
                  <RevealText>Download apps.</RevealText>
                </span>
                <span className="block text-primary relative mt-1">
                  <RevealText delay={0.3}>Earn rewards.</RevealText>
                  <svg className="absolute -bottom-2 left-0 w-full h-2.5 text-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed font-light tracking-wide"
              >
                The smartest way to monetize your free time. Complete simple tasks, get paid instantly. No hidden fees.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="pt-4"
              >
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="h-12 px-8 text-base rounded-full bg-primary hover:bg-primary/90 shadow-[0_0_30px_-10px_rgba(var(--primary),0.5)] hover:shadow-[0_0_50px_-15px_rgba(var(--primary),0.6)] transition-all duration-300"
                >
                  Start Earning Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>

              {/* Trust Chips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex flex-wrap items-center justify-center gap-5 pt-10 opacity-80"
              >
                {[
                  { icon: Star, text: "4.9/5 Rating" },
                  { icon: Shield, text: "Secure Payouts" },
                  { icon: Zap, text: "Instant Withdrawals" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <item.icon className="w-4 h-4 text-primary" />
                    {item.text}
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Endless Loop Marquee */}
        <div className="relative overflow-hidden bg-secondary/30 py-6 border-y border-border/50 backdrop-blur-sm">
          <div className="flex gap-12 animate-marquee whitespace-nowrap">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 text-base font-bold text-muted-foreground/80 tracking-wide">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>High Payouts</span>
                <span className="text-border mx-3">•</span>
                <Gift className="w-4 h-4 text-purple-500" />
                <span>Daily Bonuses</span>
                <span className="text-border mx-3">•</span>
                <Shield className="w-4 h-4 text-blue-500" />
                <span>100% Safe</span>
                <span className="text-border mx-3">•</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Stacking "How it Works" Section */}
        <section className="relative py-16">
          <div className="max-w-7xl mx-auto px-4 mb-12 text-center">
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4 tracking-tight">
              <RevealText>How it Works</RevealText>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto font-light leading-relaxed">
              Three simple steps to your first payout.
            </p>
          </div>

          <div className="max-w-4xl mx-auto px-4 relative">
            {[
              {
                step: "01",
                title: "Download & Install",
                desc: "Browse our curated list of trusted apps from top developers. Click to download directly from the official App Store or Play Store. We only partner with verified publishers to ensure your safety.",
                details: [
                  "Verified Apps Only",
                  "Direct Store Links",
                  "No Sideloading Required"
                ],
                icon: Download,
                color: "bg-blue-500",
                gradient: "from-blue-500/20 to-cyan-500/20"
              },
              {
                step: "02",
                title: "Complete Tasks",
                desc: "Follow the simple instructions provided for each app. Most tasks are as easy as 'Install and Open' or 'Reach Level 5'. Our system automatically tracks your progress in real-time.",
                details: [
                  "Real-time Tracking",
                  "Simple Instructions",
                  "Instant Verification"
                ],
                icon: Play,
                color: "bg-green-500",
                gradient: "from-green-500/20 to-emerald-500/20"
              },
              {
                step: "03",
                title: "Get Paid Instantly",
                desc: "Once your task is verified, the reward is instantly credited to your Refo wallet. Withdraw your earnings via UPI, Bank Transfer, or Gift Cards starting from just ₹50.",
                details: [
                  "Instant Withdrawals",
                  "Multiple Payment Methods",
                  "Low Minimum Payout"
                ],
                icon: CreditCard,
                color: "bg-purple-500",
                gradient: "from-purple-500/20 to-pink-500/20"
              }
            ].map((item, i) => (
              <div key={i} className="sticky top-20 mb-10 last:mb-0">
                <motion.div
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="relative min-h-[60vh] rounded-[2rem] bg-card/90 backdrop-blur-2xl border border-white/10 shadow-xl overflow-hidden flex flex-col md:flex-row group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />

                  {/* Content Side */}
                  <div className="flex-1 p-6 md:p-12 flex flex-col justify-center relative z-10">
                    <div className="inline-flex items-center gap-3 mb-4">
                      <span className={`flex items-center justify-center w-10 h-10 rounded-full ${item.color} text-white font-bold text-lg shadow-lg shadow-${item.color}/30`}>
                        {item.step}
                      </span>
                      <span className="text-base font-semibold text-muted-foreground tracking-[0.2em] uppercase">Step</span>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-bold mb-4 leading-[1.1] tracking-tight">
                      {item.title}
                    </h3>

                    <p className="text-base text-muted-foreground leading-relaxed mb-6 max-w-md font-light">
                      {item.desc}
                    </p>

                    <div className="space-y-3">
                      {item.details.map((detail, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-base font-medium">
                          <CheckCircle2 className={`w-5 h-5 ${item.color.replace('bg-', 'text-')}`} />
                          {detail}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual Side (Icon/Graphic) */}
                  <div className="flex-1 bg-black/5 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-tl ${item.gradient} opacity-20`} />
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className={`w-40 h-40 md:w-56 md:h-56 rounded-[1.5rem] ${item.color} flex items-center justify-center shadow-2xl shadow-${item.color}/40 relative z-10`}
                    >
                      <item.icon className="w-20 h-20 md:w-28 md:h-28 text-white" />
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Offers Section */}
        <section className="py-16 bg-secondary/20 relative z-10">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10 flex flex-col md:flex-row justify-between items-end gap-5"
            >
              <div>
                <h2 className="text-3xl font-heading font-bold mb-3 tracking-tight">Top Offers</h2>
                <p className="text-muted-foreground text-lg font-light">Start earning with these popular tasks</p>
              </div>
              <Button variant="outline" onClick={handleGetStarted} className="hidden md:flex rounded-full px-5 py-4 text-sm">
                View All Offers <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="p-5 border rounded-[1.25rem] space-y-3 bg-card/50">
                    <div className="flex gap-3">
                      <Skeleton className="w-14 h-14 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-full rounded-full" />
                  </div>
                ))
              ) : (
                offers.map((offer: any, i) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <OfferCard
                      title={offer.title}
                      description={offer.description}
                      logoUrl={offer.logo_url}
                      reward={offer.reward}
                      category={offer.category}
                      onStartTask={handleGetStarted}
                    />
                  </motion.div>
                ))
              )}
            </div>

            <div className="mt-10 text-center md:hidden">
              <Button variant="outline" onClick={handleGetStarted} className="w-full rounded-full py-5 text-sm">
                View All Offers <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto px-4 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <h2 className="text-3xl font-heading font-bold mb-4 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg font-light">Everything you need to know about earning with Refo</p>
          </motion.div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {[
              {
                q: "How do I earn money?",
                a: "Simply download apps from our offers, complete the required tasks (like installing and opening the app), and upload a screenshot as proof. Once verified by our team, the reward is added to your wallet instantly."
              },
              {
                q: "When can I withdraw my earnings?",
                a: "You can request a payout anytime once your balance reaches the minimum withdrawal amount (usually ₹50). Payouts are processed within 24-48 hours via UPI or bank transfer directly to your account."
              },
              {
                q: "Is there any fee to join?",
                a: "No! Joining Refo is completely free. We don't charge any registration fees, and all payouts are processed without any hidden deductions. You keep what you earn."
              },
              {
                q: "What if my task is rejected?",
                a: "If your proof doesn't meet the requirements (e.g., blurry screenshot, wrong app), our team will provide specific feedback. You can fix the issue and resubmit. Always read the task instructions carefully!"
              },
              {
                q: "How does the referral program work?",
                a: "Share your unique affiliate link with friends. When they sign up and complete their first task, you earn a bonus reward! There's no limit to how many friends you can invite."
              }
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <AccordionItem value={`item-${i}`} className="border-none bg-secondary/30 backdrop-blur-sm rounded-lg px-5 data-[state=open]:bg-secondary/50 transition-all duration-300">
                  <AccordionTrigger className="text-left font-semibold text-base hover:no-underline hover:text-primary transition-colors py-5 [&[data-state=open]>svg]:rotate-180">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed text-sm font-light">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Index;