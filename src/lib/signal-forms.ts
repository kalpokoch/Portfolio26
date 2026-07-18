/**
 * Each chapter's color temperature, as [r, g, b] — drives the cosmos background's nebula
 * and atmosphere tints, crossfaded through the same FADE window as the text dissolve.
 * Muted and close in luminance so text contrast never changes; Contact returns to the Hero
 * green so the arc ends where it began.
 */
const HUES: Record<string, readonly [number, number, number]> = {
  hero: [143, 191, 163], // clinical signal green
  journey: [196, 164, 132], // warm ember
  skills: [127, 181, 196], // cold teal
  projects: [154, 159, 201], // pale indigo
  contact: [143, 191, 163], // home again
};

const DEFAULT_HUE: readonly [number, number, number] = [143, 191, 163];

export function getHue(sceneId: string): readonly [number, number, number] {
  return HUES[sceneId] ?? DEFAULT_HUE;
}
