import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
    children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98, filter: "blur(4px)" }}
            animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
                transition: {
                    duration: 0.8, // Slower, smoother
                    ease: [0.22, 1, 0.36, 1] // "Antigravity" ease
                }
            }}
            exit={{
                opacity: 0,
                y: -10,
                scale: 0.99,
                filter: "blur(2px)",
                transition: { duration: 0.3 }
            }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
