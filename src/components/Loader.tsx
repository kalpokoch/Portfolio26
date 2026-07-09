import { useEffect, useRef, useState } from "react";

interface LoaderProps {
  onDone: () => void;
}

export default function Loader({ onDone }: LoaderProps) {
  const [visible, setVisible] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 160;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const count = 80;
    const particles = Array.from({ length: count }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 40 + Math.random() * 40,
      speed: 0.3 + Math.random() * 0.5,
    }));

    let raf = 0;
    let t = 0;
    const draw = () => {
      t += 0.02;
      ctx.clearRect(0, 0, size, size);
      const assemble = Math.min(1, t / 1.4);
      particles.forEach((p) => {
        const r = p.radius * (1 - assemble * 0.85);
        const a = p.angle + t * p.speed;
        const x = size / 2 + Math.cos(a) * r;
        const y = size / 2 + Math.sin(a) * r;
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "#3FD0C9";
        ctx.globalAlpha = 0.5 + assemble * 0.5;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 500);
    }, 1300);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [onDone]);

  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B1120] transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
    >
      <canvas ref={canvasRef} className="h-40 w-40" />
      <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-[#8A96A8]">
        Signal Flow
      </p>
    </div>
  );
}
