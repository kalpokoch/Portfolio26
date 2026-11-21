import * as THREE from "three";
import type { LandmarkFactory } from "./types";
import {
  GLSL_SPRITE_SIZE,
  GLSL_STAR_SPRITE,
  disposeTree,
  glowMaterial,
  hueColor,
} from "./shared";

/**
 * Projects — a dark world with one satellite per project in orbit around it: things built
 * and shipped, out there relaying the signal. The orbit count comes from the chapter's
 * `steps`, so adding a project to `projects.ts` adds an orbit. The active project's satellite
 * (same carousel value as the chapter) flares and lays a trail of light along its orbit; the
 * rest keep circling dimly. The planet is a true silhouette — it occludes the stars and the
 * far side of every orbit — lit only along one limb.
 */

const PLANET_RADIUS = 33;
const FIRST_ORBIT = 62;
const ORBIT_SPACING = 27;
const ORBIT_SEGMENTS = 192;

// The planet is a camera-facing disc shaded as a sphere, not a sphere mesh: this far off-axis
// at a 75° field of view, a true sphere projects visibly egg-shaped (wide-angle stretch of
// ~1/cos 38°). A disc parallel to the image plane always projects perfectly round.
const PLANET_VERTEX = /* glsl */ `
  uniform float uRadius;
  varying vec2 vDisc;
  void main() {
    vDisc = position.xy;
    vec4 center = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    gl_Position = projectionMatrix * (center + vec4(position.xy * uRadius, 0.0, 0.0));
  }
`;

const PLANET_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform vec3 uLight;
  varying vec2 vDisc;
  void main() {
    float r2 = dot(vDisc, vDisc);
    if (r2 > 1.0) discard;
    // View-space normal of the sphere this disc stands in for.
    vec3 n = vec3(vDisc, sqrt(1.0 - r2));
    vec3 light = normalize((viewMatrix * vec4(uLight, 0.0)).xyz);
    float rim = pow(1.0 - n.z, 2.6);
    float lit = dot(n, light) * 0.5 + 0.5;
    float crescent = rim * smoothstep(0.4, 1.0, lit);
    float dayside = smoothstep(0.55, 1.0, lit) * 0.035;
    // A dim, hue-tinted night side rather than black: clearly darker than the sky around it
    // without punching a hole in the frame.
    vec3 night = vec3(0.010, 0.013, 0.017) + uColor * 0.09;
    vec3 color = night + uColor * (crescent * 1.25 + rim * 0.1 + dayside);
    float limb = 1.0 - smoothstep(1.0 - fwidth(r2) * 1.5, 1.0, r2);
    gl_FragColor = vec4(color, uOpacity * limb);
  }
`;

const ORBIT_VERTEX = /* glsl */ `
  attribute float aAngle;
  varying float vAngle;
  void main() {
    vAngle = aAngle;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ORBIT_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uActive;
  uniform float uSatellite;
  varying float vAngle;
  void main() {
    // 0 right at the satellite, growing behind it — a trail that fades over ~a third of a lap.
    float behind = fract(uSatellite - vAngle);
    float trail = exp(-behind * 8.0) * (0.15 + 0.85 * uActive);
    float ring = 0.1 + 0.16 * uActive;
    gl_FragColor = vec4(uColor * (1.0 + trail * 1.5), (ring + trail) * uOpacity);
  }
`;

const SATELLITE_VERTEX = /* glsl */ `
  ${GLSL_SPRITE_SIZE}
  uniform float uActive;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = spriteSize(14.0 + uActive * 32.0, mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const SATELLITE_FRAGMENT = /* glsl */ `
  ${GLSL_STAR_SPRITE}
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uActive;
  void main() {
    float glow = starSprite(gl_PointCoord, uActive);
    vec3 color = mix(uColor, vec3(1.0), 0.4 + 0.35 * uActive) * (1.0 + uActive * 1.8);
    gl_FragColor = vec4(color, glow * (0.5 + 0.5 * uActive) * uOpacity);
  }
`;

interface Orbit {
  radius: number;
  /** Radians per second — outer orbits are slower, loosely Keplerian. */
  speed: number;
  phase: number;
  ring: THREE.ShaderMaterial;
  satellite: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
}

export const createOrbitalSystem: LandmarkFactory = (chapter, hue, ctx) => {
  const count = Math.max(1, chapter.steps ?? 1);
  const color = hueColor(hue);

  const group = new THREE.Group();
  // Orbital plane seen from a little above and rolled off-level, so the rings read as
  // ellipses wrapping in front of and behind the planet.
  group.rotation.set(0.5, 0, -0.24);

  const planetMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uOpacity: { value: 0 },
      // Lit from the upper left (world space) — the side the nebula's glow sits on.
      uLight: { value: new THREE.Vector3(-0.75, 0.55, 0.35).normalize() },
      uRadius: { value: PLANET_RADIUS },
    },
    vertexShader: PLANET_VERTEX,
    fragmentShader: PLANET_FRAGMENT,
    transparent: true,
  });
  const planet = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), planetMaterial);
  // Drawn after every default-order layer (stars, nebula, sky glow), so it reads as a solid
  // body in front of them. Left to distance sorting it can land under the additive glow and
  // come out lighter than the sky behind it.
  planet.renderOrder = 1;
  // Its geometry is a unit quad scaled in the shader, so its bounds would cull it wrongly.
  planet.frustumCulled = false;
  group.add(planet);

  // Spread extra orbits over the same overall span rather than letting the system grow
  // without bound if many projects are added.
  const spacing = count > 1 ? Math.min(ORBIT_SPACING, 72 / (count - 1)) : 0;
  const orbits: Orbit[] = Array.from({ length: count }, (_, i) => {
    const radius = FIRST_ORBIT + i * spacing;
    const tilt = new THREE.Group();
    tilt.rotation.set((i % 2 === 0 ? 1 : -1) * 0.07 * (i + 1), i * 0.9, 0);

    const positions = new Float32Array((ORBIT_SEGMENTS + 1) * 3);
    const angles = new Float32Array(ORBIT_SEGMENTS + 1);
    // An explicit closing vertex at angle 1.0 (rather than a LineLoop) so the angle varying
    // never interpolates backwards across the seam.
    for (let s = 0; s <= ORBIT_SEGMENTS; s++) {
      const a = (s / ORBIT_SEGMENTS) * Math.PI * 2;
      positions.set([Math.cos(a) * radius, 0, Math.sin(a) * radius], s * 3);
      angles[s] = s / ORBIT_SEGMENTS;
    }
    const ringGeometry = new THREE.BufferGeometry();
    ringGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    ringGeometry.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
    const ring = glowMaterial({
      uniforms: {
        uColor: { value: color },
        uOpacity: { value: 0 },
        uActive: { value: 0 },
        uSatellite: { value: 0 },
      },
      vertexShader: ORBIT_VERTEX,
      fragmentShader: ORBIT_FRAGMENT,
    });
    const ringLine = new THREE.Line(ringGeometry, ring);
    // Drawn after the planet so its depth hides the far side of the ring.
    ringLine.renderOrder = 2;
    tilt.add(ringLine);

    const satelliteGeometry = new THREE.BufferGeometry();
    satelliteGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
    const satellite = new THREE.Points(
      satelliteGeometry,
      glowMaterial({
        uniforms: {
          uColor: { value: color },
          uOpacity: { value: 0 },
          uActive: { value: 0 },
          uPixelRatio: { value: ctx.pixelRatio },
        },
        vertexShader: SATELLITE_VERTEX,
        fragmentShader: SATELLITE_FRAGMENT,
      }),
    );
    satellite.renderOrder = 2;
    // The point's position lives in its object transform, so the geometry never re-uploads.
    satellite.frustumCulled = false;
    tilt.add(satellite);

    group.add(tilt);
    return {
      radius,
      speed: 0.32 / Math.pow(radius / FIRST_ORBIT, 1.5),
      phase: i * 2.4 + 0.8,
      ring,
      satellite,
    };
  });

  return {
    object: group,
    placement: { offset: [400, 150, -620], follow: 0.66 },
    update({ time, presence, step }) {
      planetMaterial.uniforms.uOpacity.value = presence;
      // Only hide the far side of the orbits once the planet is solid — while it's still
      // half-faded, a ring passing behind it should show through like everything else.
      planetMaterial.depthWrite = presence > 0.98;

      for (let i = 0; i < orbits.length; i++) {
        const orbit = orbits[i];
        const angle = orbit.phase + time * orbit.speed;
        const active = Math.exp(-Math.pow((i - step) * 2.2, 2));
        orbit.satellite.position.set(Math.cos(angle) * orbit.radius, 0, Math.sin(angle) * orbit.radius);
        orbit.satellite.material.uniforms.uOpacity.value = presence;
        orbit.satellite.material.uniforms.uActive.value = active;
        orbit.ring.uniforms.uOpacity.value = presence;
        orbit.ring.uniforms.uActive.value = active;
        orbit.ring.uniforms.uSatellite.value = (((angle / (Math.PI * 2)) % 1) + 1) % 1;
      }
    },
    dispose() {
      disposeTree(group);
    },
  };
};
