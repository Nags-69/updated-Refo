import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ScrollCardProps {
    children: React.ReactNode;
    index: number;
    totalCards: number;
}

const ScrollCard = ({ children, index, totalCards }: ScrollCardProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Track scroll progress for THIS specific card container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        // Animation range:
        // Starts when card hits top of viewport
        // Ends when the viewport has scrolled past the card's height
        offset: ["start start", "end end"],
    });

    // Dynamic Scale Calculation
    // We want the earlier cards to shrink MORE than the later cards.
    // Example for 3 cards:
    // Index 0 (Card 1): Target Scale = 1 - ((3 - 0) * 0.05) = 0.85
    // Index 1 (Card 2): Target Scale = 1 - ((3 - 1) * 0.05) = 0.90
    // Index 2 (Card 3): Target Scale = 1 - ((3 - 2) * 0.05) = 0.95
    const targetScale = 1 - ((totalCards - index) * 0.05);

    const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale]);

    // Optional: Add a slight opacity fade to cards as they get covered
    const opacity = useTransform(scrollYProgress, [0, 1], [1, index === totalCards - 1 ? 1 : 0.4]);

    return (
        <div
            ref={containerRef}
            // h-screen ensures there is "time" for the animation to play
            className="h-screen flex items-center justify-center sticky top-0"
            style={{
                // Create a small physical offset so they peek out from behind each other
                top: index * 30
            }}
        >
            <motion.div
                style={{
                    scale,
                    opacity,
                    // Important: Scale from the top so they stack upwards
                    transformOrigin: "top center",
                }}
                // 'relative' ensures it sits inside the sticky container
                className="relative w-full"
            >
                {children}
            </motion.div>
        </div>
    );
};

export default ScrollCard;