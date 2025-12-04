import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const Preloader = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2500); // Show for 2.5 seconds

        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden"
                >
                    <div className="relative flex flex-col items-center justify-center">
                        {/* Floating Particles */}
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 rounded-full bg-primary/40"
                                initial={{
                                    x: (Math.random() - 0.5) * 200,
                                    y: 100,
                                    opacity: 0,
                                    scale: 0
                                }}
                                animate={{
                                    y: -100,
                                    opacity: [0, 1, 0],
                                    scale: [0, 1.5, 0],
                                    x: (Math.random() - 0.5) * 100
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: "easeOut"
                                }}
                            />
                        ))}

                        {/* Main Text Animation */}
                        <motion.div
                            initial={{ y: 40, opacity: 0, filter: "blur(10px)" }}
                            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                            transition={{
                                duration: 1.2,
                                ease: [0.22, 1, 0.36, 1] // Custom spring-like bezier
                            }}
                            className="relative z-10"
                        >
                            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/50">
                                REFO
                            </h1>
                        </motion.div>

                        {/* Subtext */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{
                                delay: 0.4,
                                duration: 0.8,
                                ease: "easeOut"
                            }}
                            className="mt-4 text-sm md:text-base text-muted-foreground tracking-widest uppercase"
                        >
                            Antigravity Rewards
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Preloader;
