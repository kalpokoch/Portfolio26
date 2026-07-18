function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** The one S-curve used for every scroll-scrubbed interpolation (reveals, carousel slides). */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

// Every reveal/settle finishes by this fraction of a scene's inner-local progress — at or
// before the scene's settled resting position (inner 0.5) — so nothing ever sits
// half-revealed when scrolling stops. Callers pass `sceneInnerLocal`, not raw local, so the
// runway excludes the boundary fades where the scene is invisible anyway.
const REVEAL_COMPLETE = 0.5;

/** Staggered entrance: element `index` of `count` fades/rises in during its own slice of local progress. */
export function staggeredReveal(local: number, index: number, count: number): number {
  const stagger = count > 1 ? 0.09 : 0;
  const duration = 0.4;
  // Normalize so the LAST element's reveal completes exactly at REVEAL_COMPLETE.
  const scale = REVEAL_COMPLETE / ((count - 1) * stagger + duration);
  const start = index * stagger * scale;
  return smoothstep(start, start + duration * scale, local);
}

export function revealTransform(reveal: number, riseBy = 22): string {
  return `translateY(${(1 - reveal) * riseBy}px)`;
}

/** Imperatively applies a staggered fade/rise to a ref'd element — avoids per-frame setState. */
export function scrollReveal(
  el: HTMLElement | null,
  local: number,
  index: number,
  count: number,
  riseBy = 22,
): void {
  if (!el) return;
  const reveal = staggeredReveal(local, index, count);
  el.style.opacity = String(reveal);
  el.style.transform = revealTransform(reveal, riseBy);
}

/**
 * Subtle depth parallax for content already visible at local=0 (e.g. the first scene,
 * which SceneStage never fades in from zero) — drifts instead of fading, so it never
 * pops in/out of existence.
 */
export function scrollParallax(el: HTMLElement | null, local: number, depth: number): void {
  if (!el) return;
  el.style.transform = `translateY(${-local * depth}px)`;
}

/** Settles a ref'd element into place (slight scale + rise) as the scene arrives at rest. */
export function scrollSettle(el: HTMLElement | null, local: number): void {
  if (!el) return;
  const settle = smoothstep(0.12, REVEAL_COMPLETE, local);
  const scale = 0.97 + settle * 0.03;
  el.style.transform = `translateY(${(1 - settle) * 10}px) scale(${scale})`;
}
