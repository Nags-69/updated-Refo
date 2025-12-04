import { Facebook, Twitter, Instagram, Linkedin, Heart, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative bg-card border-t border-border mt-24 overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 py-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-2xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent inline-block">
                                Refo
                            </h3>
                            <p className="text-muted-foreground mt-2 leading-relaxed">
                                The smartest way to earn rewards. Download apps, complete tasks, and get paid instantly.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                <Shield className="w-3 h-3 mr-1" /> Secure
                            </Badge>
                            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                            </Badge>
                        </div>

                        <div className="flex gap-4">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:-translate-y-1"
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold text-lg mb-6">Platform</h4>
                        <ul className="space-y-4 text-muted-foreground">
                            {['Browse Offers', 'How it Works', 'Leaderboard', 'Rewards Store'].map((item) => (
                                <li key={item}>
                                    <button className="hover:text-primary transition-colors flex items-center gap-2 group text-left w-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                        {item}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-semibold text-lg mb-6">Support</h4>
                        <ul className="space-y-4 text-muted-foreground">
                            {['Help Center', 'Contact Us', 'Terms of Service', 'Privacy Policy'].map((item) => (
                                <li key={item}>
                                    <button className="hover:text-primary transition-colors flex items-center gap-2 group text-left w-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                        {item}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="font-semibold text-lg mb-6">Stay Updated</h4>
                        <p className="text-muted-foreground mb-4">
                            Subscribe to get the latest high-paying offers directly to your inbox.
                        </p>
                        <div className="space-y-3">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                            <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                Subscribe
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <p>&copy; {currentYear} Refo. All rights reserved.</p>
                    <div className="flex items-center gap-2">
                        <span>Made with</span>
                        <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                        <span>for earners worldwide</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
