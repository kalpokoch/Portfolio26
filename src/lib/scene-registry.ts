import type { SceneConfig, SceneRange } from "../types/scene";
import { smoothstep } from "./scroll-reveal";
import { experience } from "../content/experience";
import { projects } from "../content/projects";
import HeroScene from "../scenes/HeroScene";
import JourneyScene from "../scenes/JourneyScene";
import SkillsScene from "../scenes/SkillsScene";
import ProjectsScene from "../scenes/ProjectsScene";
import ContactScene from "../scenes/ContactScene";

// Single source of truth: reorder/add/remove chapters here only. Nothing else needs to change.
// (No Research/Writing chapter — omitted until real content exists, per the brief's own rule.)
// `steps` marks chapters with an internal carousel (Journey/Projects page through entries via
// local progress) so auto-snap/scrollToScene can settle onto a clean step boundary instead of
// an arbitrary fraction that might land mid-slide between two entries.
export const SCENES: SceneConfig[] = [
  { id: "hero", title: "Hero", weight: 1, component: HeroScene },
  { id: "journey", title: "Journey", weight: 2.2, component: JourneyScene, steps: experience.length },
  { id: "skills", title: "Skills", weight: 1, component: SkillsScene },
  { id: "projects", title: "Projects", weight: 1.6, component: ProjectsScene, steps: projects.length },
  { id: "contact", title: "Contact", weight: 1, component: ContactScene },
];

export const TOTAL_WEIGHT = SCENES.reduce((sum, s) => sum + s.weight, 0);

export const SCENE_RANGES: SceneRange[] = (() => {
  let cursor = 0;
  return SCENES.map((s) => {
    const start = cursor / TOTAL_WEIGHT;
    cursor += s.weight;
    const end = cursor / TOTAL_WEIGHT;
    return { id: s.id, title: s.title, start, end };
  });
})();

export function sceneLocalProgress(globalProgress: number, sceneId: string): number {
  const range = SCENE_RANGES.find((r) => r.id === sceneId);
  if (!range) return 0;
  if (globalProgress <= range.start) return 0;
  if (globalProgress >= range.end) return 1;
  return (globalProgress - range.start) / (range.end - range.start);
}

export function activeSceneIndex(globalProgress: number): number {
  const idx = SCENE_RANGES.findIndex(
    (r) => globalProgress >= r.start && globalProgress < r.end,
  );
  if (idx !== -1) return idx;
  return globalProgress >= 1 ? SCENE_RANGES.length - 1 : 0;
}

// Fade width in GLOBAL progress units (not a fraction of each scene's own span) — every
// boundary gets the same fade runway regardless of chapter weight, so short and long
// chapters transition at the same felt speed instead of some cutting abruptly.
// The outgoing scene finishes fading out *before* the incoming one starts fading in
// (a dip-through-background dissolve), so two chapters' text is never visible at once.
const FADE = 0.035;

/**
 * Each scene's local-progress margins consumed by its boundary fades: the scene is only
 * fully visible for local progress in [inM, 1 - outM]. First/last scenes have no fade on
 * their outer edge.
 */
function sceneFadeMargins(rangeIndex: number): { inM: number; outM: number } {
  const range = SCENE_RANGES[rangeIndex];
  const width = range ? range.end - range.start : 0;
  const m = width > 0 ? FADE / width : 0;
  return {
    inM: rangeIndex === 0 ? 0 : m,
    outM: rangeIndex === SCENE_RANGES.length - 1 ? 0 : m,
  };
}

/**
 * Remaps a scene's raw local progress so 0..1 spans only its fully-visible window between
 * the boundary fades. Carousel scenes drive their sub-progression off this, so step 0 is
 * fully on screen the moment the fade-in completes (instead of half its runway being spent
 * invisible inside the fade), and settle targets from `sceneSettledProgress` land exactly
 * on step boundaries in the same frame.
 */
export function sceneInnerLocal(local: number, sceneId: string): number {
  const idx = SCENE_RANGES.findIndex((r) => r.id === sceneId);
  if (idx === -1) return 0;
  const { inM, outM } = sceneFadeMargins(idx);
  const span = 1 - inM - outM;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (local - inM) / span));
}

// Portion of each inter-step segment spent actually sliding; the rest is dwell on either
// side, so every card holds still long enough to read before easing to the next.
const SLIDE_FRAC = 0.45;

/**
 * Maps an inner-local progress (see `sceneInnerLocal`) to a carousel position in
 * 0..steps-1 that dwells on each step and only slides through the middle of each segment,
 * with ease-in-out — instead of the track drifting linearly with every scroll pixel.
 */
export function steppedCarouselPosition(innerLocal: number, steps: number): number {
  if (steps <= 1) return 0;
  const pos = Math.min(1, Math.max(0, innerLocal)) * (steps - 1);
  const i = Math.min(steps - 2, Math.floor(pos));
  const f = pos - i;
  const slideStart = (1 - SLIDE_FRAC) / 2;
  return i + smoothstep(slideStart, slideStart + SLIDE_FRAC, f);
}

/**
 * The local-progress positions (within the scene's fully-visible window, see
 * `sceneInnerLocal`) a chapter can rest at: one per carousel step, or a single center point
 * for chapters with no internal carousel. Shared by `sceneSettledProgress` (nearest-boundary
 * snap) and `sceneStepProgress` (jump to an exact step).
 */
function sceneStepBoundaries(rangeIndex: number): number[] {
  const scene = SCENES[rangeIndex];
  if (!scene) return [0.5];
  const { inM, outM } = sceneFadeMargins(rangeIndex);
  const span = Math.max(0, 1 - inM - outM);
  const steps = scene.steps ?? 1;
  const boundaries =
    steps <= 1
      ? [inM + span * 0.5]
      : Array.from({ length: steps }, (_, i) => inM + span * (i / (steps - 1)));
  // The final chapter may also rest at the very bottom of the page — otherwise scrolling to
  // the end and pausing snaps the view back up mid-chapter, which reads as a glitch.
  if (rangeIndex === SCENE_RANGES.length - 1) boundaries.push(1);
  return boundaries;
}

/**
 * The progress value where a chapter is fully settled — the shared target for both manual
 * chapter-jumps and scroll auto-snap. For chapters with an internal carousel (`steps`), this
 * is the nearest step boundary to `currentLocal`; for single-view chapters, the center.
 *
 * Boundaries live in the scene's fully-visible window (see `sceneInnerLocal`), clear of the
 * boundary fades — every step, including the first and last, is a valid resting point, and
 * a settled position always shows exactly one card with the scene at full opacity.
 */
export function sceneSettledProgress(rangeIndex: number, currentLocal = 0): number {
  const range = SCENE_RANGES[rangeIndex];
  if (!range) return 0;
  const width = range.end - range.start;
  const boundaries = sceneStepBoundaries(rangeIndex);

  let localTarget = boundaries[0];
  for (const b of boundaries) {
    if (Math.abs(b - currentLocal) < Math.abs(localTarget - currentLocal)) {
      localTarget = b;
    }
  }

  return range.start + localTarget * width;
}

/**
 * The global progress value for an EXACT step within a chapter's carousel (as opposed to
 * `sceneSettledProgress`'s nearest-to-current lookup) — used to jump straight to a specific
 * sub-item, e.g. clicking "03" in the chapter tracker's expanded step list.
 */
export function sceneStepProgress(rangeIndex: number, stepIndex: number): number {
  const range = SCENE_RANGES[rangeIndex];
  const scene = SCENES[rangeIndex];
  if (!range || !scene) return 0;
  const width = range.end - range.start;
  const boundaries = sceneStepBoundaries(rangeIndex);
  const steps = scene.steps ?? 1;
  const clamped = Math.min(Math.max(stepIndex, 0), steps - 1);
  return range.start + boundaries[clamped] * width;
}

/** Which carousel step (0-based) a chapter's own local progress currently sits on. */
export function sceneActiveStep(globalProgress: number, rangeIndex: number): number {
  const scene = SCENES[rangeIndex];
  if (!scene) return 0;
  const steps = scene.steps ?? 1;
  if (steps <= 1) return 0;
  const local = sceneLocalProgress(globalProgress, scene.id);
  const inner = sceneInnerLocal(local, scene.id);
  return Math.round(steppedCarouselPosition(inner, steps));
}

/**
 * Which two scenes the background signal is morphing between, and how far along (0..1).
 * Uses the exact same FADE window as `sceneOpacity`, so the canvas morph is locked to the
 * text dissolve by construction: the shape transforms precisely while the text dips out.
 */
export function sceneMorphBlend(globalProgress: number): { from: number; to: number; t: number } {
  for (let i = 0; i < SCENE_RANGES.length - 1; i++) {
    const boundary = SCENE_RANGES[i].end;
    if (globalProgress >= boundary - FADE && globalProgress <= boundary + FADE) {
      return { from: i, to: i + 1, t: smoothstep(boundary - FADE, boundary + FADE, globalProgress) };
    }
  }
  const idx = activeSceneIndex(globalProgress);
  return { from: idx, to: idx, t: 0 };
}

/**
 * Sequential dissolve: 1 inside a scene's steady zone, ramping to 0 entirely *within* the
 * scene's own range at each boundary. The outgoing scene reaches 0 exactly where the
 * incoming one starts from 0 — a brief dip through the dark background instead of a
 * 50/50 overlap where both chapters' text is legible at once.
 */
export function sceneOpacity(globalProgress: number, rangeIndex: number): number {
  const range = SCENE_RANGES[rangeIndex];
  if (!range) return 0;
  const isFirst = rangeIndex === 0;
  const isLast = rangeIndex === SCENE_RANGES.length - 1;

  let opacity = 1;
  if (!isFirst && globalProgress < range.start + FADE) {
    opacity = Math.min(opacity, (globalProgress - range.start) / FADE);
  }
  if (!isLast && globalProgress > range.end - FADE) {
    opacity = Math.min(opacity, (range.end - globalProgress) / FADE);
  }

  return Math.max(0, Math.min(1, opacity));
}
