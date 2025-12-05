import { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    originX: number;
    originY: number;
    radius: number;
    color: string;
    phase: number;
    speed: number;
    depth: number;
}

const NewdonBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scrollYRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        let particles: Particle[] = [];
        let mouseX = -1000;
        let mouseY = -1000;
        let time = 0;

        const colors = [
            "hsla(217, 91%, 40%, 0.6)", // Darker Blue
            "hsla(262, 83%, 45%, 0.6)", // Darker Purple
            "hsla(330, 81%, 45%, 0.5)", // Darker Pink
            "hsla(199, 89%, 35%, 0.6)", // Darker Cyan
            "hsla(173, 80%, 30%, 0.5)", // Darker Teal
            "hsla(271, 76%, 40%, 0.6)", // Darker Violet
        ];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = document.documentElement.scrollHeight;
            initParticles();
        };

        const initParticles = () => {
            const particleCount = Math.floor((canvas.width * canvas.height) / 8000);
            particles = [];

            for (let i = 0; i < particleCount; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const depth = Math.random();

                particles.push({
                    x,
                    y,
                    originX: x,
                    originY: y,
                    radius: Math.random() * 0.8 + 0.2 + depth * 0.5, // Tiny size
                    color: colors[Math.floor(Math.random() * colors.length)],
                    phase: Math.random() * Math.PI * 2,
                    speed: Math.random() * 0.3 + 0.2,
                    depth,
                });
            }
        };

        const drawParticle = (p: Particle) => {
            const parallaxFactor = 0.2 + p.depth * 0.3;
            const parallaxY = p.y - scrollYRef.current * parallaxFactor;

            if (parallaxY < scrollYRef.current - 100 || parallaxY > scrollYRef.current + window.innerHeight + 100) return;

            const opacity = 0.3 + p.depth * 0.4;
            const colorWithOpacity = p.color.replace(/[\d.]+\)$/, `${opacity})`);

            // Glow effect
            const gradient = ctx.createRadialGradient(p.x, parallaxY, 0, p.x, parallaxY, p.radius * 3);
            gradient.addColorStop(0, colorWithOpacity);
            gradient.addColorStop(1, "transparent");

            ctx.beginPath();
            ctx.arc(p.x, parallaxY, p.radius * 2, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(p.x, parallaxY, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = colorWithOpacity;
            ctx.fill();
        };

        const updateParticle = (p: Particle) => {
            const floatX = Math.sin(time * p.speed + p.phase) * 20;
            const floatY = Math.cos(time * p.speed * 0.7 + p.phase) * 15;

            let targetX = p.originX + floatX;
            let targetY = p.originY + floatY;

            const parallaxFactor = 0.2 + p.depth * 0.3;
            const adjustedY = p.y - scrollYRef.current * parallaxFactor;

            const dx = p.x - mouseX;
            const dy = adjustedY - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 150;

            if (dist < maxDist && dist > 0) {
                const force = (maxDist - dist) / maxDist;
                const pushX = (dx / dist) * force * 80;
                const pushY = (dy / dist) * force * 80;
                targetX += pushX;
                targetY += pushY;
            }

            p.x += (targetX - p.x) * 0.06;
            p.y += (targetY - p.y) * 0.06;
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 0.015;

            const sortedParticles = [...particles].sort((a, b) => a.depth - b.depth);

            sortedParticles.forEach((p) => {
                updateParticle(p);
                drawParticle(p);
            });

            animationId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY + scrollYRef.current;
        };

        const handleMouseLeave = () => {
            mouseX = -1000;
            mouseY = -1000;
        };

        const handleScroll = () => {
            scrollYRef.current = window.scrollY;
        };

        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);
        window.addEventListener("scroll", handleScroll, { passive: true });

        resize();
        animate();

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
            window.removeEventListener("scroll", handleScroll);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ background: "#ffffff" }}
        />
    );
};

export default NewdonBackground;
