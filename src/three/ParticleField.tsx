import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollContext } from "../lib/scroll-context";
import { useDeviceTier } from "../lib/use-device-tier";
import { FORMATION_GENERATORS } from "./formations";
import { getFormationBlend } from "./useParticleMorph";

const SIGNAL_COLOR = new THREE.Color("#3FD0C9");
const AMBER_COLOR = new THREE.Color("#F2A65A");

function ParticlePoints({ count }: { count: number }) {
  const { progressRef, pulseRef } = useScrollContext();
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const colorScratch = useRef(SIGNAL_COLOR.clone());

  const formations = useMemo(
    () => FORMATION_GENERATORS.map((gen) => gen(count)),
    [count],
  );

  const positionsAttr = useMemo(() => new Float32Array(count * 3), [count]);

  useFrame(() => {
    const { a, b, mix } = getFormationBlend(progressRef.current);
    const fa = formations[a];
    const fb = formations[b];
    const len = count * 3;
    for (let i = 0; i < len; i++) {
      positionsAttr[i] = fa[i] + (fb[i] - fa[i]) * mix;
    }

    const geom = pointsRef.current?.geometry;
    const attr = geom?.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (attr) {
      attr.needsUpdate = true;
    }

    if (materialRef.current) {
      colorScratch.current.copy(SIGNAL_COLOR).lerp(AMBER_COLOR, pulseRef.current);
      materialRef.current.color.copy(colorScratch.current);
    }
    pulseRef.current *= 0.92;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positionsAttr, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.035}
        color={SIGNAL_COLOR}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  );
}

export function ParticleField() {
  const tier = useDeviceTier();
  const count = tier === "low" ? 900 : 3000;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, tier === "low" ? 1 : 1.5]}
        gl={{ antialias: false, alpha: true }}
      >
        <ParticlePoints count={count} />
      </Canvas>
    </div>
  );
}
