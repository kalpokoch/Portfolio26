import type { ComponentType } from "react";

export interface SceneConfig {
  id: string;
  title: string;
  /** Relative scroll-length weight — bigger weight = more scroll runway for sub-progressions. */
  weight: number;
  component: ComponentType;
  /** Number of internal sub-steps (e.g. a carousel of entries) this scene pages through via local progress — omit for scenes with a single static view. */
  steps?: number;
}

export interface SceneRange {
  id: string;
  title: string;
  start: number;
  end: number;
}
