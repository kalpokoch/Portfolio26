import * as THREE from "three";
import type { LandmarkFactory } from "./types";
import { timelineStore } from "../store/timeline-store";
import {
  GLSL_SPRITE_SIZE,
  GLSL_STAR_SPRITE,
  disposeTree,
  glowMaterial,
  hueColor,
} from "./shared";

/**
 * Contact — the end of the flight: a beacon transmitting rings out across a tilted plane,
 * "the signal, end to end". Besides its steady rhythm it answers the visitor: arriving at
 * the chapter sends a ping, and so does pointing at (or tabbing to) any contact link —
 * `sendSignalPing` in the timeline store — so reaching out visibly sends a signal.
 */

const RADIUS = 115;
const RING_PERIOD = 3.6;
/** Seconds a ping ring takes to reach the edge. */
const PING_DURATION = 1.8;
/** Concurrent pings tracked, so quick successive hovers overlap instead of cutting each other off. */
const MAX_PINGS = 3;
const NO_PING = 1e4;

const RIPPLE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RIPPLE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform vec3 uPingAges;
  varying vec2 vUv;
  const float RING_PERIOD = ${RING_PERIOD.toFixed(2)};
  const float PING_DURATION = ${PING_DURATION.toFixed(2)};

  // A crisp ring at the given radius, anti-aliased by its own screen-space footprint, so it
  // stays a clean hairline even where perspective squashes the plane.
  float ring(float r, float radius, float width) {
    float aa = fwidth(r) * 1.2;
    return 1.0 - smoothstep(width, width + aa, abs(r - radius));
  }

  // An answering ping is a different shape, not just a brighter ring: tone mapping squeezes
  // highlights, so a hairline twice as bright as the steady rings reads as barely brighter.
  // Instead it's a soft glowing wavefront with a crisp crest and a faint wake of light behind
  // it — a shockwave — so it's unmistakably a response rather than part of the rhythm.
  float ping(float r, float age) {
    float p = age / PING_DURATION;
    if (p < 0.0 || p > 1.0) return 0.0;
    float radius = 1.0 - pow(1.0 - p, 1.6);
    float band = exp(-pow((r - radius) / 0.045, 2.0));
    float crest = ring(r, radius, 0.006);
    float wake = smoothstep(radius - 0.35, radius, r) * step(r, radius) * 0.2;
    return (band * 0.9 + crest * 1.2 + wake) * pow(1.0 - p, 1.3);
  }

  void main() {
    float r = length(vUv * 2.0 - 1.0);
    if (r > 1.0) discard;
    float steady = 0.0;
    // The steady transmission: three rings in flight, easing out as they spread and fade.
    for (int k = 0; k < 3; k++) {
      float phase = fract(uTime / RING_PERIOD + float(k) / 3.0);
      float radius = 1.0 - pow(1.0 - phase, 1.35);
      steady += ring(r, radius, 0.003) * pow(1.0 - phase, 1.6) * smoothstep(0.0, 0.06, phase);
    }
    // One faint fixed range ring for structure.
    steady += ring(r, 0.62, 0.0015) * 0.12;
    float pings = ping(r, uPingAges.x) + ping(r, uPingAges.y) + ping(r, uPingAges.z);
    float total = steady + pings;
    vec3 color = (uColor * steady + mix(uColor, vec3(1.0), 0.6) * pings) / max(total, 1e-4);
    gl_FragColor = vec4(color, total * uOpacity);
  }
`;

const CORE_VERTEX = /* glsl */ `
  ${GLSL_SPRITE_SIZE}
  uniform float uPulse;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = spriteSize(34.0 + uPulse * 24.0, mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const CORE_FRAGMENT = /* glsl */ `
  ${GLSL_STAR_SPRITE}
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uPulse;
  void main() {
    float glow = starSprite(gl_PointCoord, 0.6 + 0.4 * uPulse);
    vec3 color = mix(uColor, vec3(1.0), 0.55) * (1.6 + uPulse * 2.2);
    gl_FragColor = vec4(color, glow * uOpacity);
  }
`;

export const createContactBeacon: LandmarkFactory = (_chapter, hue, ctx) => {
  const color = hueColor(hue);
  const group = new THREE.Group();

  const rippleMaterial = glowMaterial({
    uniforms: {
      uColor: { value: color },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uPingAges: { value: new THREE.Vector3(NO_PING, NO_PING, NO_PING) },
    },
    vertexShader: RIPPLE_VERTEX,
    fragmentShader: RIPPLE_FRAGMENT,
  });
  const ripples = new THREE.Mesh(new THREE.PlaneGeometry(RADIUS * 2, RADIUS * 2), rippleMaterial);
  // Laid back toward the horizon so the rings spread like a signal across a surface.
  ripples.rotation.set(-1.05, 0, 0.08);
  group.add(ripples);

  const coreGeometry = new THREE.BufferGeometry();
  coreGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
  const coreMaterial = glowMaterial({
    uniforms: {
      uColor: { value: color },
      uOpacity: { value: 0 },
      uPulse: { value: 0 },
      uPixelRatio: { value: ctx.pixelRatio },
    },
    vertexShader: CORE_VERTEX,
    fragmentShader: CORE_FRAGMENT,
  });
  const core = new THREE.Points(coreGeometry, coreMaterial);
  core.frustumCulled = false;
  group.add(core);

  // rAF-clock seconds of the most recent pings, newest last.
  const pings: number[] = [];
  let lastStorePing = timelineStore.getState().signalPingAt;
  let arrived = false;
  let lastUpdate = Number.NEGATIVE_INFINITY;
  const pushPing = (at: number) => {
    pings.push(at);
    if (pings.length > MAX_PINGS) pings.shift();
  };

  return {
    object: group,
    placement: { offset: [370, 145, -560], follow: 0.6 },
    update({ time, presence }) {
      // Hidden landmarks aren't updated, so a gap means the chapter was left — even if a fast
      // jump skipped every faded-out frame — and the next arrival should ping again. (A full
      // second: far longer than any frame, far shorter than leaving and coming back.)
      if (time - lastUpdate > 1) arrived = false;
      lastUpdate = time;
      // Arriving at the chapter sends a ping; leaving re-arms it.
      if (!arrived && presence > 0.65) {
        arrived = true;
        pushPing(time);
      } else if (arrived && presence < 0.2) {
        arrived = false;
      }
      const storePing = timelineStore.getState().signalPingAt;
      if (storePing !== lastStorePing) {
        lastStorePing = storePing;
        pushPing(Math.min(storePing, time));
      }

      const ages = rippleMaterial.uniforms.uPingAges.value as THREE.Vector3;
      ages.set(
        pings.length > 0 ? time - pings[pings.length - 1] : NO_PING,
        pings.length > 1 ? time - pings[pings.length - 2] : NO_PING,
        pings.length > 2 ? time - pings[pings.length - 3] : NO_PING,
      );
      rippleMaterial.uniforms.uOpacity.value = presence;
      rippleMaterial.uniforms.uTime.value = time;

      // The core swells as each steady ring leaves it, and harder for a ping.
      const sinceRing = (time % (RING_PERIOD / 3)) / (RING_PERIOD / 3);
      const sincePing = pings.length > 0 ? (time - pings[pings.length - 1]) / 0.6 : NO_PING;
      const pulse = Math.max(Math.exp(-sinceRing * 6) * 0.5, sincePing < 1 ? 1 - sincePing : 0);
      coreMaterial.uniforms.uPulse.value = pulse;
      coreMaterial.uniforms.uOpacity.value = presence;
    },
    dispose() {
      disposeTree(group);
    },
  };
};
