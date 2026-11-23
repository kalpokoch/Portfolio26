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
 * Journey — a constellation with one star per role, in carousel order. The route between the
 * stars draws itself in lockstep with the experience carousel (it reads the same
 * `steppedCarouselPosition` value), a comet of light rides its head while a card slides, and
 * the active role's star flares. The sky becomes a second, ambient "you are here" for the
 * timeline; the route still ahead stays a faint dashed line.
 */

const HALF_WIDTH = 95;

/**
 * A fixed, hand-shaped zig-zag rather than random scatter, so it's the same figure on every
 * visit. Generated from `count`, so adding a role to `experience.ts` adds a star.
 */
function starLayout(count: number): THREE.Vector3[] {
  return Array.from({ length: count }, (_, i) => {
    const u = count === 1 ? 0.5 : i / (count - 1);
    const x = (u * 2 - 1 + 0.1 * Math.sin(i * 3.3)) * HALF_WIDTH;
    const y = ((i % 2 === 1 ? 0.36 : -0.08) + 0.08 * Math.sin(i * 1.7)) * HALF_WIDTH;
    const z = 0.25 * Math.sin(i * 2.1 + 0.4) * HALF_WIDTH;
    return new THREE.Vector3(x, y, z);
  });
}

const ROUTE_VERTEX = /* glsl */ `
  attribute float aT;
  attribute float aDist;
  varying float vT;
  varying float vDist;
  void main() {
    vT = aT;
    vDist = aDist;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ROUTE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uHead;
  varying float vT;
  varying float vDist;
  void main() {
    float travelled = 1.0 - smoothstep(uHead - 0.02, uHead + 0.02, vT);
    float dash = step(0.5, fract(vDist / 9.0));
    float line = mix(0.2 * dash, 0.55, travelled);
    float comet = exp(-pow((vT - uHead) * 6.0, 2.0));
    gl_FragColor = vec4(uColor * (1.0 + comet * 1.5), (line + comet * 0.8) * uOpacity);
  }
`;

const STAR_VERTEX = /* glsl */ `
  ${GLSL_SPRITE_SIZE}
  attribute float aIndex;
  attribute float aSize;
  uniform float uHead;
  uniform float uTime;
  varying float vActive;
  varying float vLevel;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vActive = exp(-pow((aIndex - uHead) * 2.2, 2.0));
    float visited = step(aIndex, uHead + 0.5);
    float twinkle = 0.85 + 0.15 * sin(uTime * 1.3 + aIndex * 2.7);
    vLevel = mix(0.45, 1.0, max(visited * 0.7, vActive)) * twinkle;
    gl_PointSize = spriteSize(aSize * (1.0 + vActive * 1.25), mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const STAR_FRAGMENT = /* glsl */ `
  ${GLSL_STAR_SPRITE}
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vActive;
  varying float vLevel;
  void main() {
    float glow = starSprite(gl_PointCoord, vActive);
    vec3 color = mix(uColor, vec3(1.0), 0.45 + 0.35 * vActive) * (1.0 + vActive * 1.2);
    gl_FragColor = vec4(color, glow * vLevel * uOpacity);
  }
`;

export const createCareerConstellation: LandmarkFactory = (chapter, hue, ctx) => {
  const count = Math.max(1, chapter.steps ?? 1);
  const stars = starLayout(count);
  const color = hueColor(hue);

  const group = new THREE.Group();
  // Turned to face the camera's line of sight, so the figure isn't foreshortened.
  group.rotation.y = -0.5;

  const positions = new Float32Array(count * 3);
  const index = new Float32Array(count);
  const dist = new Float32Array(count);
  const sizes = new Float32Array(count);
  let travelled = 0;
  stars.forEach((p, i) => {
    if (i > 0) travelled += p.distanceTo(stars[i - 1]);
    positions.set([p.x, p.y, p.z], i * 3);
    index[i] = i;
    dist[i] = travelled;
    sizes[i] = 20 + (i % 3) * 2.5;
  });

  // A single role has no route to draw — just its star.
  let routeMaterial: THREE.ShaderMaterial | null = null;
  if (count > 1) {
    routeMaterial = glowMaterial({
      uniforms: {
        uColor: { value: color },
        uOpacity: { value: 0 },
        uHead: { value: 0 },
      },
      vertexShader: ROUTE_VERTEX,
      fragmentShader: ROUTE_FRAGMENT,
    });
    const routeGeometry = new THREE.BufferGeometry();
    routeGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    routeGeometry.setAttribute("aT", new THREE.BufferAttribute(index, 1));
    routeGeometry.setAttribute("aDist", new THREE.BufferAttribute(dist, 1));
    group.add(new THREE.Line(routeGeometry, routeMaterial));
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute("aIndex", new THREE.BufferAttribute(index, 1));
  starGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  const starMaterial = glowMaterial({
    uniforms: {
      uColor: { value: color },
      uOpacity: { value: 0 },
      uHead: { value: 0 },
      uTime: { value: 0 },
      uPixelRatio: { value: ctx.pixelRatio },
    },
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
  });
  group.add(new THREE.Points(starGeometry, starMaterial));

  return {
    object: group,
    placement: { offset: [440, 190, -560], follow: 0.75 },
    update({ time, presence, step }) {
      if (routeMaterial) {
        routeMaterial.uniforms.uOpacity.value = presence;
        routeMaterial.uniforms.uHead.value = step;
      }
      starMaterial.uniforms.uOpacity.value = presence;
      starMaterial.uniforms.uHead.value = step;
      starMaterial.uniforms.uTime.value = time;
      // Barely-there drift so the figure never looks pasted onto the sky.
      group.rotation.z = Math.sin(time * 0.05) * 0.03;
    },
    dispose() {
      disposeTree(group);
    },
  };
};
