import { useTimelineStore } from "../store/timeline-store";
import { useIsMobile } from "./use-is-mobile";

/** Whether the desktop pinned scroll-timeline experience should run (vs. any fallback). */
export function useIsImmersive(): boolean {
  const reducedMotion = useTimelineStore((s) => s.reducedMotion);
  const isMobile = useIsMobile();
  return !reducedMotion && !isMobile;
}

/**
 * Mobile's own immersive mode: native document scroll (pinning is what's actually bad on
 * mobile — address-bar resize, momentum-scroll fights, GPU/battery budget — not motion
 * itself), with a lightweight Canvas2D starfield background and per-section reveal-on-scroll
 * instead of the desktop pin. Only for mobile visitors who haven't asked for reduced motion —
 * that signal always wins and gets the fully static FallbackStack, on any device.
 */
export function useIsMobileImmersive(): boolean {
  const reducedMotion = useTimelineStore((s) => s.reducedMotion);
  const isMobile = useIsMobile();
  return !reducedMotion && isMobile;
}
