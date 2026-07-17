import { useTimelineStore } from "../store/timeline-store";
import { useIsMobile } from "./use-is-mobile";

/** Whether the pinned scroll-timeline experience should run at all (vs. the plain stacked fallback). */
export function useIsImmersive(): boolean {
  const reducedMotion = useTimelineStore((s) => s.reducedMotion);
  const isMobile = useIsMobile();
  return !reducedMotion && !isMobile;
}
