import { useEffect, useRef, useState } from "react";

interface LoaderProps {
  onDone: () => void;
}

/** An ECG-style sweep — ties the preload moment to the Bio-Signal identity instead of a generic spinner. */
export default function Loader({ onDone }: LoaderProps) {
  const [visible, setVisible] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = 280;
    const height = 80;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let raf = 0;
    let t = 0;
    const draw = () => {
      t += 3;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "#8FBFA3";
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(143,191,163,0.6)";
      ctx.beginPath();
      const spikeStart = width * 0.55;
      for (let x = 0; x <= width; x++) {
        const phase = (x + t) % width;
        let y = height / 2;
        if (phase > spikeStart && phase < spikeStart + 26) {
          const local = phase - spikeStart;
          if (local < 6) y -= local * 3;
          else if (local < 14) y += (local - 6) * 7.5 - 18;
          else if (local < 20) y -= (local - 14) * 8 - 42;
          else y += (local - 20) * 3.5 - 6;
        } else {
          y += Math.sin(phase * 0.06) * 1.5;
        }
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const minDuration = new Promise((resolve) => setTimeout(resolve, 900));
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    const safetyTimeout = new Promise((resolve) => setTimeout(resolve, 4000));

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      setVisible(false);
      setTimeout(onDone, 500);
    };
    Promise.race([Promise.all([minDuration, fontsReady]), safetyTimeout]).then(dismiss);

    return () => {
      cancelAnimationFrame(raf);
      dismissed = true;
    };
  }, [onDone]);

  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0D0B]/95 backdrop-blur-sm transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
    >
      <canvas ref={canvasRef} className="h-20 w-[280px]" />
      <p className="mt-6 font-mono text-[0.65rem] uppercase tracking-[0.4em] text-[#5B6660]">
        Loading
      </p>
    </div>
  );
}
