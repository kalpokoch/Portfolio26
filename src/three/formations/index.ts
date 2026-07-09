import { waveformFormation } from "./waveform";
import { networkFormation } from "./network";
import { pipelineFormation } from "./pipeline";
import { gridFormation } from "./grid";
import { convergenceFormation } from "./convergence";

// Order matches SCENES in scenes-config.ts: hero, about, experience, projects, contact.
export const FORMATION_GENERATORS = [
  waveformFormation,
  networkFormation,
  pipelineFormation,
  gridFormation,
  convergenceFormation,
] as const;

export { pipelineNodeX, PIPELINE_STEPS } from "./pipeline";
