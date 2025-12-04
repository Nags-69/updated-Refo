import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "next-themes";

const ParticleField = () => {
    const ref = useRef<THREE.Points>(null);
    const { theme } = useTheme();
    const { mouse, viewport } = useThree();

    const count = 3000;

    // Generate a SHARP circle texture (no blur)
    const sharpTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        if (context) {
            // Solid circle with hard edge
            context.beginPath();
            context.arc(16, 16, 14, 0, Math.PI * 2);
            context.fillStyle = "white";
            context.fill();
        }
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }, []);

    // Initial positions, velocities, and colors
    const [positions, originalPositions, colors] = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const originalPositions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const color = new THREE.Color();

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 25;
            const y = (Math.random() - 0.5) * 25;
            const z = (Math.random() - 0.5) * 10;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            originalPositions[i * 3] = x;
            originalPositions[i * 3 + 1] = y;
            originalPositions[i * 3 + 2] = z;

            // Antigravity Palette: Cyan, Blue, White
            const r = Math.random();
            if (r > 0.6) {
                color.setHSL(0.6, 0.9, 0.7); // Blue
            } else if (r > 0.3) {
                color.setHSL(0.5, 0.9, 0.7); // Cyan
            } else {
                color.setHSL(0.6, 0.1, 0.9); // White/Blueish
            }

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        return [positions, originalPositions, colors];
    }, []);

    useFrame((state, delta) => {
        if (!ref.current) return;

        const positionsAttribute = ref.current.geometry.attributes.position;
        const currentPositions = positionsAttribute.array;

        // Mouse position in world space
        const mouseX = (mouse.x * viewport.width) / 2;
        const mouseY = (mouse.y * viewport.height) / 2;

        // Physics constants
        const repulsionRadius = 5.0;
        const repulsionRadiusSq = repulsionRadius * repulsionRadius;
        const dt = Math.min(delta, 0.05);

        for (let i = 0; i < count; i++) {
            const ix = i * 3;
            const iy = i * 3 + 1;

            const px = currentPositions[ix];
            const py = currentPositions[iy];

            // 1. Mouse Repulsion
            const dx = mouseX - px;
            const dy = mouseY - py;
            const distSq = dx * dx + dy * dy;

            let tx = originalPositions[ix];
            let ty = originalPositions[iy];

            if (distSq < repulsionRadiusSq) {
                const dist = Math.sqrt(distSq);
                const force = (1 - dist / repulsionRadius) * 6.0;
                const angle = Math.atan2(dy, dx);

                tx -= Math.cos(angle) * force;
                ty -= Math.sin(angle) * force;
            }

            // 2. Smooth Movement (Elasticity)
            currentPositions[ix] += (tx - currentPositions[ix]) * 5 * dt;
            currentPositions[iy] += (ty - currentPositions[iy]) * 5 * dt;

            // 3. Gentle Float
            currentPositions[iy] += Math.sin(state.clock.elapsedTime * 0.5 + originalPositions[ix]) * 0.005;
        }

        positionsAttribute.needsUpdate = true;

        // Slow global rotation
        ref.current.rotation.z += dt * 0.03;
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false}>
                <PointMaterial
                    map={sharpTexture} // Use sharp texture
                    transparent
                    vertexColors
                    size={0.12} // Slightly smaller for sharpness
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.9}
                    blending={THREE.AdditiveBlending}
                />
            </Points>
        </group>
    );
};

const AntigravityBackground = () => {
    return (
        <div className="fixed inset-0 -z-50 h-full w-full bg-background/5 pointer-events-none">
            <Canvas
                camera={{ position: [0, 0, 5], fov: 60 }}
                style={{ pointerEvents: 'auto' }}
                dpr={[1, 2]}
                gl={{
                    antialias: false,
                    powerPreference: "high-performance",
                    alpha: true
                }}
            >
                <ParticleField />
            </Canvas>
        </div>
    );
};

export default AntigravityBackground;
