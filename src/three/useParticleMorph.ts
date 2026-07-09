import { SCENE_RANGES } from "../lib/scenes-config";

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const TRANSITION = 0.02;

export interface FormationBlend {
  a: number;
  b: number;
  mix: number;
}

/**
 * Maps global scroll progress to a continuous "formation position" so the
 * particle field always interpolates through boundaries rather than cutting.
 */
export function getFormationBlend(progress: number): FormationBlend {
  const boundaries = SCENE_RANGES.slice(0, -1).map((r) => r.end);
  let fPos = 0;
  for (const boundary of boundaries) {
    fPos += smoothstep(boundary - TRANSITION, boundary + TRANSITION, progress);
  }
  const last = SCENE_RANGES.length - 1;
  const a = Math.min(last, Math.floor(fPos));
  const b = Math.min(last, a + 1);
  const mix = fPos - a;
  return { a, b, mix };
}
