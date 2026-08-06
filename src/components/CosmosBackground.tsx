import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { getProgress, timelineStore, useTimelineStore } from "../store/timeline-store";
import {
  SCENES,
  activeSceneIndex,
  sceneLocalProgress,
  sceneMorphBlend,
} from "../lib/scene-registry";
import { getHue } from "../lib/signal-forms";

/**
 * Site-wide three.js backdrop (adapted from the "Horizon" cosmos hero): a shader starfield,
 * animated nebula, mountain silhouettes, and bloom, with the camera flying deeper as the
 * timeline progresses. Camera dollies and hue shifts happen through the same sceneMorphBlend
 * window as the text dissolve, so background and content move as one.
 * Reads progress imperatively in its own rAF loop; skipped entirely on low-tier devices.
 */

// Waypoints of one continuous flight: the camera is at a chapter's waypoint when that
// chapter begins and travels toward the next waypoint for the chapter's whole scroll span —
// every scroll tick moves you deeper through the scene (the Horizon source's model), rather
// than parking between transitions. Unknown scene ids fall back to the hero waypoint.
const CAMERA_PATH: Record<string, readonly [number, number, number]> = {
  hero: [0, 30, 300],
  journey: [0, 34, 100],
  skills: [0, 38, -80],
  projects: [0, 44, -280],
  contact: [0, 50, -600],
};
// Where the flight is still heading as the final chapter plays out.
const END_CAM: readonly [number, number, number] = [0, 54, -760];
const DEFAULT_CAM: readonly [number, number, number] = [0, 30, 300];
const CAMERA_SMOOTHING = 0.05;

const STAR_LAYERS = 3;
const STARS_PER_LAYER = 3000;

const STAR_VERTEX = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  uniform float time;
  uniform float depth;

  void main() {
    vColor = color;
    vec3 pos = position;
    float angle = time * 0.05 * (1.0 - depth * 0.3);
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    pos.xy = rot * pos.xy;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const STAR_FRAGMENT = `
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float opacity = 1.0 - smoothstep(0.0, 0.5, dist);
    gl_FragColor = vec4(vColor, opacity);
  }
`;

const NEBULA_VERTEX = `
  varying vec2 vUv;
  varying float vElevation;
  uniform float time;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float elevation = sin(pos.x * 0.01 + time) * cos(pos.y * 0.01 + time) * 20.0;
    pos.z += elevation;
    vElevation = elevation;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const NEBULA_FRAGMENT = `
  uniform vec3 color1;
  uniform vec3 color2;
  uniform float opacity;
  uniform float time;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    float mixFactor = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time);
    vec3 color = mix(color1, color2, mixFactor * 0.5 + 0.5);
    float alpha = opacity * (1.0 - length(vUv - 0.5) * 2.0);
    alpha *= 1.0 + vElevation * 0.01;
    gl_FragColor = vec4(color, alpha);
  }
`;

const ATMOSPHERE_VERTEX = `
  varying vec3 vNormal;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT = `
  varying vec3 vNormal;
  uniform float time;
  uniform vec3 tint;

  void main() {
    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    float pulse = sin(time * 2.0) * 0.1 + 0.9;
    gl_FragColor = vec4(tint * intensity * pulse, intensity * 0.06);
  }
`;

function buildStars(scene: THREE.Scene): THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>[] {
  const layers: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>[] = [];
  for (let i = 0; i < STAR_LAYERS; i++) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(STARS_PER_LAYER * 3);
    const colors = new Float32Array(STARS_PER_LAYER * 3);
    const sizes = new Float32Array(STARS_PER_LAYER);
    const color = new THREE.Color();

    for (let j = 0; j < STARS_PER_LAYER; j++) {
      const radius = 200 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[j * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[j * 3 + 2] = radius * Math.cos(phi);

      // Mostly neutral white; a small fraction carries the signal green so the field
      // belongs to the site's palette rather than the source's blue/orange cosmos.
      const roll = Math.random();
      if (roll < 0.85) color.setHSL(0, 0, 0.8 + Math.random() * 0.2);
      else color.setHSL(0.38, 0.35, 0.75);
      colors[j * 3] = color.r;
      colors[j * 3 + 1] = color.g;
      colors[j * 3 + 2] = color.b;
      // Min size ~1px on screen — smaller points crawl across the pixel grid as the field
      // rotates, which shows up as background shimmer/jitter.
      sizes[j] = Math.random() * 1.6 + 1;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, depth: { value: i } },
      vertexShader: STAR_VERTEX,
      fragmentShader: STAR_FRAGMENT,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
    layers.push(stars);
  }
  return layers;
}

function buildMountains(scene: THREE.Scene): THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>[] {
  const layers = [
    { distance: -50, height: 60, opacity: 1 },
    { distance: -100, height: 80, opacity: 0.8 },
    { distance: -150, height: 100, opacity: 0.6 },
    { distance: -200, height: 120, opacity: 0.4 },
  ];
  return layers.map((layer, index) => {
    const points: THREE.Vector2[] = [];
    const segments = 50;
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments - 0.5) * 1000;
      const y =
        Math.sin(i * 0.1) * layer.height +
        Math.sin(i * 0.05) * layer.height * 0.5 +
        Math.random() * layer.height * 0.2 -
        100;
      points.push(new THREE.Vector2(x, y));
    }
    points.push(new THREE.Vector2(5000, -300));
    points.push(new THREE.Vector2(-5000, -300));

    const geometry = new THREE.ShapeGeometry(new THREE.Shape(points));
    const material = new THREE.MeshBasicMaterial({
      color: 0x101418,
      transparent: true,
      opacity: layer.opacity,
      side: THREE.DoubleSide,
    });
    const mountain = new THREE.Mesh(geometry, material);
    mountain.position.z = layer.distance;
    mountain.userData = { baseOpacity: layer.opacity, index };
    scene.add(mountain);
    return mountain;
  });
}

export default function CosmosBackground() {
  const deviceTier = useTimelineStore((s) => s.deviceTier);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (deviceTier === "low") {
      // No background will render — don't leave the loader waiting for one.
      timelineStore.getState().setBackgroundReady(true);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    // WebGL context creation can throw outright — e.g. the browser's live-context limit
    // (mobile Safari/Android cap this per-page, sometimes as low as 8-16 across every open
    // tab) already being exhausted, or a GPU driver hiccup. Left uncaught, that error had no
    // boundary above it and silently killed the background for the rest of the session, with
    // no way to recover short of a full reload. Fail soft instead: log it, unblock the
    // loader, and simply render no background.
    let cleanup: (() => void) | null = null;
    try {
      cleanup = setupScene(canvas);
    } catch (err) {
      console.warn("CosmosBackground: WebGL setup failed, continuing without it.", err);
      timelineStore.getState().setBackgroundReady(true);
      return;
    }
    return cleanup ?? undefined;
  }, [deviceTier]);

  if (deviceTier === "low") return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}

function setupScene(canvas: HTMLCanvasElement): () => void {
  const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.00025);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000,
    );
    camera.position.set(DEFAULT_CAM[0], DEFAULT_CAM[1], DEFAULT_CAM[2]);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.38;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.3,
        0.4,
        0.9,
      ),
    );

    const stars = buildStars(scene);
    const mountains = buildMountains(scene);

    const nebulaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(0x8fbfa3) },
        color2: { value: new THREE.Color(0x22332b) },
        opacity: { value: 0.12 },
      },
      vertexShader: NEBULA_VERTEX,
      fragmentShader: NEBULA_FRAGMENT,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const nebula = new THREE.Mesh(new THREE.PlaneGeometry(8000, 4000, 100, 100), nebulaMaterial);
    nebula.position.z = -1050;
    scene.add(nebula);

    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, tint: { value: new THREE.Color(0x8fbfa3) } },
      vertexShader: ATMOSPHERE_VERTEX,
      fragmentShader: ATMOSPHERE_FRAGMENT,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 32), atmosphereMaterial);
    scene.add(atmosphere);

    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", resize);

    const smooth = { x: DEFAULT_CAM[0], y: DEFAULT_CAM[1], z: DEFAULT_CAM[2] };

    let raf = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const time = now / 1000;
      const progress = getProgress();
      const { from, to, t } = sceneMorphBlend(progress);

      const idx = activeSceneIndex(progress);
      const local = sceneLocalProgress(progress, SCENES[idx].id);
      const camA = CAMERA_PATH[SCENES[idx].id] ?? DEFAULT_CAM;
      const nextScene = SCENES[idx + 1];
      const camB = nextScene ? (CAMERA_PATH[nextScene.id] ?? DEFAULT_CAM) : END_CAM;
      smooth.x += (camA[0] + (camB[0] - camA[0]) * local - smooth.x) * CAMERA_SMOOTHING;
      smooth.y += (camA[1] + (camB[1] - camA[1]) * local - smooth.y) * CAMERA_SMOOTHING;
      smooth.z += (camA[2] + (camB[2] - camA[2]) * local - smooth.z) * CAMERA_SMOOTHING;
      camera.position.set(
        smooth.x + Math.sin(time * 0.1) * 2,
        smooth.y + Math.cos(time * 0.15),
        smooth.z,
      );
      camera.lookAt(0, 10, -600);

      const hueA = getHue(SCENES[from].id);
      const hueB = getHue(SCENES[to].id);
      const r = (hueA[0] + (hueB[0] - hueA[0]) * t) / 255;
      const g = (hueA[1] + (hueB[1] - hueA[1]) * t) / 255;
      const b = (hueA[2] + (hueB[2] - hueA[2]) * t) / 255;
      (nebulaMaterial.uniforms.color1.value as THREE.Color).setRGB(r, g, b);
      (nebulaMaterial.uniforms.color2.value as THREE.Color).setRGB(r * 0.25, g * 0.3, b * 0.45);
      (atmosphereMaterial.uniforms.tint.value as THREE.Color).setRGB(r, g, b);
      nebulaMaterial.uniforms.time.value = time * 0.5;
      atmosphereMaterial.uniforms.time.value = time;

      for (const starField of stars) starField.material.uniforms.time.value = time;

      mountains.forEach((mountain, i) => {
        const sway = 1 + i * 0.5;
        mountain.position.x = Math.sin(time * 0.1) * 2 * sway;
        mountain.position.y = 40 + Math.cos(time * 0.15) * sway;
        // Silhouettes carry a whisper of the chapter hue, and fade out before the camera
        // reaches their plane so it never clips through them (replaces the source's
        // teleport-to-z=600000 hack).
        mountain.material.color.setRGB(r * 0.1, g * 0.12, b * 0.16);
        const clearance = smooth.z - (mountain.position.z + 60);
        const fade = Math.min(1, Math.max(0, clearance / 120));
        mountain.material.opacity = (mountain.userData.baseOpacity as number) * fade;
      });

      composer.render();
      // First frame is on screen — the loader can start its fade-out over the live scene.
      if (!timelineStore.getState().backgroundReady) {
        timelineStore.getState().setBackgroundReady(true);
      }
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      for (const starField of stars) {
        starField.geometry.dispose();
        starField.material.dispose();
      }
      for (const mountain of mountains) {
        mountain.geometry.dispose();
        mountain.material.dispose();
      }
      nebula.geometry.dispose();
      nebulaMaterial.dispose();
      atmosphere.geometry.dispose();
      atmosphereMaterial.dispose();
      composer.dispose();
      renderer.dispose();
    };
}
