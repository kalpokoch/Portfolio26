import type * as THREE from "three";
import type { SceneConfig } from "../types/scene";

export type Rgb = readonly [number, number, number];

/**
 * Everything a landmark reads from the timeline for one frame, already derived — a landmark
 * never touches scroll math itself, so it can't drift out of sync with the chapter it belongs
 * to.
 */
export interface LandmarkFrame {
  /** Seconds on the rAF clock. */
  time: number;
  /**
   * 0..1 — the chapter text's own opacity (`sceneOpacity`), so a landmark arrives and leaves
   * exactly with its text, dipping through empty sky at each boundary like the text does.
   */
  presence: number;
  /** Local progress inside the chapter's fully-visible window (`sceneInnerLocal`). */
  inner: number;
  /**
   * Continuous carousel position, 0..steps-1 (`steppedCarouselPosition` — the exact value the
   * chapter's own carousel uses), or 0 for single-view chapters.
   */
  step: number;
}

export interface LandmarkPlacement {
  /**
   * Offset from the chapter's camera waypoint, in world units. `x` is authored for a 16:10
   * frame and scaled with the viewport aspect, so a landmark holds the same spot in frame
   * (the open sky right of the text column) on any desktop shape.
   */
  offset: readonly [number, number, number];
  /**
   * How much of the camera's travel the landmark rides along with: 0 = fixed in the world
   * (the camera flies straight at it), 1 = locked to the camera. In between reads as "very far
   * away" — a slow, steady approach across the chapter instead of a fly-by.
   */
  follow: number;
}

export interface LandmarkContext {
  /** Renderer pixel ratio, so point sprites keep the same CSS-pixel size on every display. */
  pixelRatio: number;
}

export interface Landmark {
  /** Root object. CosmosBackground positions it along the flight path and toggles visibility. */
  readonly object: THREE.Object3D;
  readonly placement: LandmarkPlacement;
  /** Called only while the landmark is visible (presence > 0). */
  update(frame: LandmarkFrame): void;
  dispose(): void;
}

export type LandmarkFactory = (chapter: SceneConfig, hue: Rgb, ctx: LandmarkContext) => Landmark;
