import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-6 md:px-12 py-4",
                isScrolled
                    ? "bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm py-3"
                    : "bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                        R
                    </div>
                    <span className="text-xl font-bold tracking-tight">Refo</span>
                </div>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    <a href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Home</a>
                    <a href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Earn</a>
                    <a href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Leaderboard</a>
                    <a href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About</a>
                </div>

                {/* CTA & Mobile Menu Toggle */}
                <div className="flex items-center gap-4">
                    <Button
                        variant={isScrolled ? "default" : "secondary"}
                        className="hidden md:flex rounded-full font-semibold"
                    >
                        Get App
                    </Button>

                    <button
                        className="md:hidden p-2 text-foreground"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/50 p-6 md:hidden animate-in slide-in-from-top-5">
                    <div className="flex flex-col gap-4">
                        <a href="#" className="text-lg font-medium">Home</a>
                        <a href="#" className="text-lg font-medium">Earn</a>
                        <a href="#" className="text-lg font-medium">Leaderboard</a>
                        <a href="#" className="text-lg font-medium">About</a>
                        <Button className="w-full rounded-full mt-2">Get App</Button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
