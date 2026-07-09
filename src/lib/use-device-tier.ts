import { useEffect, useState } from "react";

export type DeviceTier = "low" | "high";

/**
 * Cheap heuristic: few CPU cores or a narrow viewport skips straight to "low".
 * Otherwise measures first-half-second frame rate to catch weak GPUs.
 */
export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>("high");

  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 4;
    const isNarrow = window.innerWidth < 768;
    if (cores <= 4 || isNarrow) {
      setTier("low");
      return;
    }

    let rafId: number;
    const start = performance.now();
    let frames = 0;
    const measure = (t: number) => {
      frames++;
      if (t - start < 500) {
        rafId = requestAnimationFrame(measure);
      } else {
        const fps = (frames * 1000) / (t - start);
        setTier(fps < 45 ? "low" : "high");
      }
    };
    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return tier;
}
