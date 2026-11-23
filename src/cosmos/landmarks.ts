import type { LandmarkFactory } from "./types";
import { createCareerConstellation } from "./career-constellation";
import { createNeuralLattice } from "./neural-lattice";
import { createOrbitalSystem } from "./orbital-system";
import { createContactBeacon } from "./contact-beacon";

/**
 * One landmark in the sky per chapter, keyed by scene id (like CAMERA_PATH and the hues in
 * signal-forms.ts). The camera flies toward each one during its chapter, and it fades in and
 * out with that chapter's text, so the flight passes a sequence of sights that tell the same
 * story as the content: a career constellation → a neural network → projects in orbit → a
 * transmitting beacon. Hero has none on purpose — its mountains and horizon are the
 * landmark. A chapter without an entry simply has none.
 *
 * Only CosmosBackground imports this, so all of it ships in the lazy three.js chunk.
 */
export const LANDMARKS: Partial<Record<string, LandmarkFactory>> = {
  journey: createCareerConstellation,
  skills: createNeuralLattice,
  projects: createOrbitalSystem,
  contact: createContactBeacon,
};
