import * as THREE from "three";
import type { LandmarkFactory } from "./types";
import { smoothstep } from "../lib/scroll-reveal";
import {
  GLSL_HASH,
  GLSL_SPRITE_SIZE,
  GLSL_STAR_SPRITE,
  disposeTree,
  glowMaterial,
  hueColor,
} from "./shared";

/**
 * Skills — a small feed-forward network drawn in the sky's own vocabulary (stars and
 * hairlines). Its layers assemble as the skill groups rise in (same 0..0.5 inner-progress
 * window as `scrollReveal`), then forward passes run through it on a loop: a wave of pulses
 * leaves the input layer, crosses one layer gap at a time along a sparse, changing set of
 * connections, and each layer's neurons flash as it arrives. All of it runs in the shaders —
 * the CPU only advances a clock.
 */

const LAYERS = [4, 6, 6, 3];
const HALF_WIDTH = 103;
const NODE_GAP = 29;
/** Seconds between forward passes, and per layer gap within one. */
const PASS_PERIOD = 3.4;
const GAP_DURATION = 0.55;
/** Inner progress by which the network is fully assembled — matches scroll-reveal's REVEAL_COMPLETE. */
const BUILD_COMPLETE = 0.5;

const PASS_GLSL = /* glsl */ `
  uniform float uTime;
  const float PASS_PERIOD = ${PASS_PERIOD.toFixed(2)};
  const float GAP_DURATION = ${GAP_DURATION.toFixed(2)};
  float passClock() { return mod(uTime, PASS_PERIOD); }
  float passIndex() { return floor(uTime / PASS_PERIOD); }
`;

const EDGE_VERTEX = /* glsl */ `
  attribute float aT;
  attribute float aGap;
  attribute float aSeed;
  varying float vT;
  varying float vGap;
  varying float vSeed;
  void main() {
    vT = aT;
    vGap = aGap;
    vSeed = aSeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const EDGE_FRAGMENT = /* glsl */ `
  ${GLSL_HASH}
  ${PASS_GLSL}
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uBuild;
  varying float vT;
  varying float vGap;
  varying float vSeed;
  void main() {
    // A connection appears once the layer it feeds into has assembled.
    float built = clamp(uBuild - (vGap + 1.0), 0.0, 1.0);
    if (built <= 0.0) discard;
    // Where this pass's pulse is along this gap (0..1 while crossing it), and whether this
    // connection carries it — a different sparse subset on every pass.
    float s = (passClock() - vGap * GAP_DURATION) / GAP_DURATION;
    float fires = step(0.58, hash11(vSeed * 7.13 + passIndex() * 17.31));
    float window = smoothstep(-0.2, 0.0, s) * (1.0 - smoothstep(1.0, 1.2, s));
    float pulse = fires * window * exp(-pow((vT - s) * 7.0, 2.0));
    gl_FragColor = vec4(uColor * (1.0 + pulse * 1.8), (0.09 + pulse * 0.9) * built * uOpacity);
  }
`;

const NODE_VERTEX = /* glsl */ `
  ${GLSL_HASH}
  ${GLSL_SPRITE_SIZE}
  ${PASS_GLSL}
  attribute float aLayer;
  attribute float aSeed;
  uniform float uBuild;
  varying float vBuilt;
  varying float vFlash;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vBuilt = clamp(uBuild - aLayer, 0.0, 1.0);
    // Flash when this pass reaches the neuron's layer; inputs always fire, deeper neurons
    // only some of the time.
    float arrive = aLayer * GAP_DURATION;
    float fires = aLayer < 0.5 ? 1.0 : step(0.35, hash11(aSeed * 3.71 + passIndex() * 11.7));
    vFlash = fires * exp(-pow((passClock() - arrive) / 0.2, 2.0));
    gl_PointSize = spriteSize(15.0 + vFlash * 9.0, mv.z) * vBuilt;
    gl_Position = projectionMatrix * mv;
  }
`;

const NODE_FRAGMENT = /* glsl */ `
  ${GLSL_STAR_SPRITE}
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vBuilt;
  varying float vFlash;
  void main() {
    float glow = starSprite(gl_PointCoord, 0.0);
    vec3 color = mix(uColor, vec3(1.0), 0.35 + 0.4 * vFlash) * (1.0 + vFlash * 1.8);
    gl_FragColor = vec4(color, glow * (0.55 + vFlash * 0.45) * vBuilt * uOpacity);
  }
`;

export const createNeuralLattice: LandmarkFactory = (_chapter, hue, ctx) => {
  const color = hueColor(hue);
  const group = new THREE.Group();

  // Node layout: layers left→right (input→output), each a column bowed gently back at its
  // ends, with a fixed small wobble so it doesn't read as a rigid grid.
  const layerNodes: THREE.Vector3[][] = LAYERS.map((n, l) => {
    const x = ((l / (LAYERS.length - 1)) * 2 - 1) * HALF_WIDTH;
    return Array.from({ length: n }, (_, k) => {
      const y = (k - (n - 1) / 2) * NODE_GAP;
      const z = -Math.pow(y / (NODE_GAP * 3), 2) * 22 + Math.sin(l * 2.3 + k * 1.1) * 6;
      return new THREE.Vector3(x, y, z);
    });
  });

  const nodeCount = LAYERS.reduce((a, b) => a + b, 0);
  const nodePositions = new Float32Array(nodeCount * 3);
  const nodeLayer = new Float32Array(nodeCount);
  const nodeSeed = new Float32Array(nodeCount);
  let n = 0;
  layerNodes.forEach((nodes, l) =>
    nodes.forEach((p) => {
      nodePositions.set([p.x, p.y, p.z], n * 3);
      nodeLayer[n] = l;
      nodeSeed[n] = n + 1;
      n += 1;
    }),
  );

  // Fully connected between adjacent layers; each edge is a 0→1 segment along the signal's
  // direction of travel.
  const edgePositions: number[] = [];
  const edgeT: number[] = [];
  const edgeGap: number[] = [];
  const edgeSeed: number[] = [];
  let e = 0;
  for (let l = 0; l < layerNodes.length - 1; l++) {
    for (const a of layerNodes[l]) {
      for (const b of layerNodes[l + 1]) {
        edgePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        edgeT.push(0, 1);
        edgeGap.push(l, l);
        edgeSeed.push(e + 1, e + 1);
        e += 1;
      }
    }
  }

  const uniforms = {
    uColor: { value: color },
    uOpacity: { value: 0 },
    uBuild: { value: 0 },
    uTime: { value: 0 },
    uPixelRatio: { value: ctx.pixelRatio },
  };

  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));
  edgeGeometry.setAttribute("aT", new THREE.Float32BufferAttribute(edgeT, 1));
  edgeGeometry.setAttribute("aGap", new THREE.Float32BufferAttribute(edgeGap, 1));
  edgeGeometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(edgeSeed, 1));
  group.add(
    new THREE.LineSegments(
      edgeGeometry,
      glowMaterial({ uniforms, vertexShader: EDGE_VERTEX, fragmentShader: EDGE_FRAGMENT }),
    ),
  );

  const nodeGeometry = new THREE.BufferGeometry();
  nodeGeometry.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
  nodeGeometry.setAttribute("aLayer", new THREE.BufferAttribute(nodeLayer, 1));
  nodeGeometry.setAttribute("aSeed", new THREE.BufferAttribute(nodeSeed, 1));
  group.add(
    new THREE.Points(
      nodeGeometry,
      glowMaterial({ uniforms, vertexShader: NODE_VERTEX, fragmentShader: NODE_FRAGMENT }),
    ),
  );

  return {
    object: group,
    placement: { offset: [330, 140, -520], follow: 0.65 },
    update({ time, presence, inner }) {
      uniforms.uOpacity.value = presence;
      uniforms.uTime.value = time;
      uniforms.uBuild.value = smoothstep(0, BUILD_COMPLETE, inner) * LAYERS.length;
      // Turned a little past face-on so the layers separate in depth, with a slow sway.
      group.rotation.y = -0.15 + Math.sin(time * 0.11) * 0.16;
      group.rotation.x = Math.sin(time * 0.07) * 0.05;
    },
    dispose() {
      disposeTree(group);
    },
  };
};
