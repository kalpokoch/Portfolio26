import { useEffect, useRef } from "react";
import { timelineStore } from "../store/timeline-store";
import { SCENES } from "../lib/scene-registry";
import { getHue } from "../lib/signal-forms";

/**
 * Mobile's background: a plain Canvas2D starfield with a soft radial glow wash, no three.js
 * / WebGL at all. Cheap enough to just always run (near-zero battery/GPU cost), so unlike
 * the desktop cosmos there's no device-tier gate here — the whole point of this component is
 * to be affordable on anything. Colors ease toward whichever chapter is active
 * (`activeSceneIndex`, maintained by MobileStack's IntersectionObserver) using the same
 * per-chapter palette as the desktop cosmos (`getHue`), so the two experiences feel related
 * without sharing any GPU-heavy code.
 */

const HUE_SMOOTHING = 0.04;

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  speed: number;
  phase: number;
  tinted: boolean;
}

export default function MobileCosmosBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const glow2Ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let stars: Star[] = [];

    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round((width * height) / 5200);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.1 + 0.25,
        baseAlpha: Math.random() * 0.5 + 0.12,
        speed: Math.random() * 0.05 + 0.012,
        phase: Math.random() * Math.PI * 2,
        tinted: Math.random() < 0.3,
      }));
    };
    setup();
    window.addEventListener("resize", setup);

    const hueSmooth: [number, number, number] = [...getHue(SCENES[0].id)] as [number, number, number];
    let raf = 0;
    let frame = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      frame += 1;

      const activeId = SCENES[timelineStore.getState().activeSceneIndex]?.id ?? SCENES[0].id;
      const target = getHue(activeId);
      hueSmooth[0] += (target[0] - hueSmooth[0]) * HUE_SMOOTHING;
      hueSmooth[1] += (target[1] - hueSmooth[1]) * HUE_SMOOTHING;
      hueSmooth[2] += (target[2] - hueSmooth[2]) * HUE_SMOOTHING;
      const [r, g, b] = hueSmooth.map(Math.round);

      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(120% 60% at 22% 12%, rgba(${r},${g},${b},0.16) 0%, rgba(10,13,11,0) 62%)`;
      }
      if (glow2Ref.current) {
        glow2Ref.current.style.background = `radial-gradient(90% 45% at 85% 78%, rgba(${r},${g},${b},0.09) 0%, rgba(10,13,11,0) 65%)`;
      }

      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        star.y -= star.speed;
        if (star.y < -2) {
          star.y = height + 2;
          star.x = Math.random() * width;
        }
        const twinkle = 0.65 + 0.35 * Math.sin(frame * 0.012 + star.phase);
        const alpha = star.baseAlpha * twinkle;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = star.tinted
          ? `rgba(${r}, ${g}, ${b}, ${alpha})`
          : `rgba(237, 234, 226, ${alpha * 0.8})`;
        ctx.fill();
      }

      if (!timelineStore.getState().backgroundReady) {
        timelineStore.getState().setBackgroundReady(true);
      }
    };
    raf = requestAnimationFrame(draw);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", setup);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div ref={glowRef} className="absolute inset-0" />
      <div ref={glow2Ref} className="absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
