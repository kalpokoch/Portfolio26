import { useEffect, useRef, useState } from "react";
import { timelineStore } from "../store/timeline-store";

interface LoaderProps {
  onDone: () => void;
}

const STAR_COUNT = 110;

/**
 * "The sky turning on": stars emerge one by one on the same near-black background and top
 * light as the page itself, so when the loader crossfades out over the live cosmos scene the
 * star field appears to simply continue. Dismissal waits for the cosmos background's first
 * rendered frame (`backgroundReady`) in addition to fonts + a minimum beat, so the 3D scene
 * never pops in after the loader has already left.
 */
export default function Loader({ onDone }: LoaderProps) {
  const [visible, setVisible] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.1 + 0.4,
      phase: Math.random() * Math.PI * 2,
      delay: (i / STAR_COUNT) * 1.3,
      green: Math.random() < 0.15,
    }));

    let raf = 0;
    const start = performance.now();
    const draw = (now: number) => {
      if (!reducedMotion) raf = requestAnimationFrame(draw);
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const born = reducedMotion ? 1 : Math.min(1, Math.max(0, (t - s.delay) / 0.9));
        if (born <= 0) continue;
        const twinkle = reducedMotion ? 0.85 : 0.75 + Math.sin(t * 1.8 + s.phase) * 0.25;
        ctx.globalAlpha = born * twinkle * (s.green ? 0.8 : 0.9);
        ctx.fillStyle = s.green ? "#8FBFA3" : "#EDEAE2";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);

    const minDuration = new Promise((resolve) => setTimeout(resolve, 1200));
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    const backgroundReady = new Promise<void>((resolve) => {
      if (timelineStore.getState().backgroundReady) {
        resolve();
        return;
      }
      const unsub = timelineStore.subscribe((s) => {
        if (s.backgroundReady) {
          unsub();
          resolve();
        }
      });
    });
    // Never trap the user behind the loader if something (chunk load, WebGL) stalls.
    const safetyTimeout = new Promise((resolve) => setTimeout(resolve, 6000));

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      setVisible(false);
      setTimeout(onDone, 700);
    };
    Promise.race([Promise.all([minDuration, fontsReady, backgroundReady]), safetyTimeout]).then(
      dismiss,
    );

    return () => {
      cancelAnimationFrame(raf);
      dismissed = true;
    };
  }, [onDone]);

  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0D0B] transition-opacity duration-700 ease-[var(--ease-signal)]"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      {/* Identical top light to body::before so the crossfade into the page is seamless. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 50% 6%, rgba(143, 191, 163, 0.09), transparent 62%)",
        }}
      />
      <p className="relative font-mono text-[0.65rem] uppercase tracking-[0.4em] text-[#5B6660]">
        Loading
      </p>
    </div>
  );
}
