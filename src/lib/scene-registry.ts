import type { SceneConfig, SceneRange } from "../types/scene";
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
// boundary gets the same ~7%-of-total crossfade regardless of chapter weight, so short and
// long chapters transition at the same felt speed instead of some cutting abruptly.
const FADE = 0.035;

/**
 * The progress value where a chapter is fully settled — the shared target for both manual
 * chapter-jumps and scroll auto-snap. For chapters with an internal carousel (`steps`), this
 * is the nearest exact step boundary to `currentLocal` (matching the carousel's own slide math,
 * `i / (steps - 1)`), so settling never leaves it mid-slide between two entries. For chapters
 * with a single view, the center is the only candidate.
 *
 * Candidates are first filtered to whichever fall clear of this chapter's own cross-fade zone
 * with its neighbors — step 0's boundary, for instance, sits right at the previous chapter's
 * fade-out, so if it's excluded we settle on the next clean step instead (rather than clamping
 * the chosen boundary afterwards, which would land between two steps, matching neither).
 */
export function sceneSettledProgress(rangeIndex: number, currentLocal = 0): number {
  const range = SCENE_RANGES[rangeIndex];
  const scene = SCENES[rangeIndex];
  if (!range || !scene) return 0;

  const width = range.end - range.start;
  const safeMargin = width > 0 ? FADE / width : 0;
  const isFirst = rangeIndex === 0;
  const isLast = rangeIndex === SCENE_RANGES.length - 1;
  const safeMin = isFirst ? 0 : safeMargin;
  const safeMax = isLast ? 1 : 1 - safeMargin;

  const steps = scene.steps ?? 1;
  const boundaries =
    steps <= 1 ? [0.5] : Array.from({ length: steps }, (_, i) => i / (steps - 1));

  const validBoundaries = boundaries.filter((b) => b >= safeMin && b <= safeMax);
  const candidates =
    validBoundaries.length > 0 ? validBoundaries : [Math.min(Math.max(0.5, safeMin), safeMax)];

  let localTarget = candidates[0];
  for (const b of candidates) {
    if (Math.abs(b - currentLocal) < Math.abs(localTarget - currentLocal)) {
      localTarget = b;
    }
  }

  return range.start + localTarget * width;
}

/** Windowed cross-fade: 1 inside a scene's steady zone, ramping to 0 across a shared overlap with each neighbor. */
export function sceneOpacity(globalProgress: number, rangeIndex: number): number {
  const range = SCENE_RANGES[rangeIndex];
  if (!range) return 0;
  const isFirst = rangeIndex === 0;
  const isLast = rangeIndex === SCENE_RANGES.length - 1;

  let opacity = 1;
  if (!isFirst) {
    const fadeInEnd = range.start + FADE;
    if (globalProgress < fadeInEnd) {
      opacity = Math.min(opacity, (globalProgress - (range.start - FADE)) / (FADE * 2));
    }
  }
  if (!isLast) {
    const fadeOutStart = range.end - FADE;
    if (globalProgress > fadeOutStart) {
      opacity = Math.min(opacity, (range.end + FADE - globalProgress) / (FADE * 2));
    }
  }

  return Math.max(0, Math.min(1, opacity));
}
