export type DeviceTier = "low" | "high";

/**
 * Cheap heuristic: few CPU cores or a narrow viewport skips straight to "low".
 * Otherwise measures first-half-second frame rate to catch weak GPUs.
 */
export function measureDeviceTier(onResult: (tier: DeviceTier) => void): () => void {
  const cores = navigator.hardwareConcurrency ?? 4;
  const isNarrow = window.innerWidth < 768;
  if (cores <= 4 || isNarrow) {
    onResult("low");
    return () => {};
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
      onResult(fps < 45 ? "low" : "high");
    }
  };
  rafId = requestAnimationFrame(measure);
  return () => cancelAnimationFrame(rafId);
}
