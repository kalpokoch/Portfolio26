export type DeviceTier = "low" | "high";

// How long we watch frame timings, bucketed into windows; the BEST window decides the tier,
// so startup jank (loader animation, font loads, lazy-chunk compile) can't misclassify a
// capable machine as low-tier — only a device that can't hit the bar even once counts as low.
const MEASURE_MS = 3500;
const WINDOW_MS = 500;
const MIN_FPS = 40;

/**
 * Cheap heuristic: few CPU cores or a narrow viewport skips straight to "low". Otherwise
 * measures frame rate over several windows and grades on the best one. `?tier=high|low` in
 * the URL forces a result (debugging / headless tooling, where rAF timing is meaningless).
 */
export function measureDeviceTier(onResult: (tier: DeviceTier) => void): () => void {
  const forced = new URLSearchParams(window.location.search).get("tier");
  if (forced === "high" || forced === "low") {
    onResult(forced);
    return () => {};
  }

  const cores = navigator.hardwareConcurrency ?? 4;
  const isNarrow = window.innerWidth < 768;
  if (cores <= 4 || isNarrow) {
    onResult("low");
    return () => {};
  }

  let rafId: number;
  const start = performance.now();
  let windowStart = start;
  let framesInWindow = 0;
  let bestFps = 0;

  const measure = (t: number) => {
    framesInWindow++;
    if (t - windowStart >= WINDOW_MS) {
      bestFps = Math.max(bestFps, (framesInWindow * 1000) / (t - windowStart));
      windowStart = t;
      framesInWindow = 0;
    }
    if (t - start < MEASURE_MS) {
      rafId = requestAnimationFrame(measure);
    } else {
      onResult(bestFps < MIN_FPS ? "low" : "high");
    }
  };
  rafId = requestAnimationFrame(measure);
  return () => cancelAnimationFrame(rafId);
}
