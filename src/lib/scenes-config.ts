export interface SceneConfig {
  id: string;
  label: string;
  /** relative scroll length weight — bigger weight = more scroll distance for sub-progressions */
  weight: number;
}

export const SCENES: SceneConfig[] = [
  { id: "hero", label: "Hero", weight: 1 },
  { id: "about", label: "About", weight: 1 },
  { id: "experience", label: "Experience", weight: 2.4 },
  { id: "projects", label: "Projects", weight: 1.8 },
  { id: "contact", label: "Contact", weight: 1 },
];

export const TOTAL_WEIGHT = SCENES.reduce((sum, s) => sum + s.weight, 0);

export interface SceneRange {
  id: string;
  label: string;
  start: number;
  end: number;
}

export const SCENE_RANGES: SceneRange[] = (() => {
  let cursor = 0;
  return SCENES.map((s) => {
    const start = cursor / TOTAL_WEIGHT;
    cursor += s.weight;
    const end = cursor / TOTAL_WEIGHT;
    return { id: s.id, label: s.label, start, end };
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
