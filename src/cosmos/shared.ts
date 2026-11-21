import * as THREE from "three";
import type { Rgb } from "./types";

/**
 * Distance at which landmark point sprites render at their authored CSS-pixel size — about
 * where landmarks sit from the camera (see their placements), so sprites swell gently as the
 * camera approaches instead of being fixed decals.
 */
export const SPRITE_REF_DISTANCE = 650;

/**
 * A chapter hue as a THREE.Color, with the same raw 0..1 channel convention the nebula and
 * atmosphere tints use, so landmarks sit in exactly the palette the sky is already wearing.
 */
export function hueColor(hue: Rgb): THREE.Color {
  return new THREE.Color().setRGB(hue[0] / 255, hue[1] / 255, hue[2] / 255);
}

/** Additive, depth-tested but non-depth-writing — every glow in the cosmos blends this way. */
export function glowMaterial(
  params: Pick<THREE.ShaderMaterialParameters, "uniforms" | "vertexShader" | "fragmentShader">,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    ...params,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Disposes every geometry and material under `root`. */
export function disposeTree(root: THREE.Object3D): void {
  root.traverse((node) => {
    const { geometry, material } = node as THREE.Mesh;
    geometry?.dispose();
    if (Array.isArray(material)) material.forEach((m) => m.dispose());
    else material?.dispose();
  });
}

/** Cheap deterministic hash (Hoskins' hash11) — per-edge/per-node randomness without textures. */
export const GLSL_HASH = /* glsl */ `
  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }
`;

/**
 * Size for a point sprite authored in CSS pixels: device-pixel-ratio aware, and swelling with
 * proximity relative to SPRITE_REF_DISTANCE.
 */
export const GLSL_SPRITE_SIZE = /* glsl */ `
  uniform float uPixelRatio;
  float spriteSize(float cssPx, float viewZ) {
    return cssPx * uPixelRatio * (${SPRITE_REF_DISTANCE.toFixed(1)} / max(-viewZ, 1.0));
  }
`;

/**
 * The one star every landmark draws with, so they all read as part of the same sky: a tight
 * core, a soft halo, and optional four-point diffraction spikes (0..1) reserved for whatever
 * matters right now — the active role, the active project, the beacon.
 */
export const GLSL_STAR_SPRITE = /* glsl */ `
  float starSprite(vec2 uv, float spikes) {
    vec2 c = uv - 0.5;
    float d2 = dot(c, c);
    float core = exp(-d2 * 170.0);
    float halo = exp(-d2 * 24.0) * 0.3;
    vec2 a = abs(c);
    float rays = exp(-a.x * 80.0) * exp(-a.y * 6.5) + exp(-a.y * 80.0) * exp(-a.x * 6.5);
    float fade = 1.0 - smoothstep(0.36, 0.5, max(a.x, a.y));
    return (core + halo + rays * spikes * 0.5) * fade;
  }
`;
