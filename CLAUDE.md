# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # local dev server (Vite)
npm run build    # type-check (tsc -b) + production build
npm run preview  # preview the production build
npm run lint     # oxlint
```

There is no test runner configured in this project.

## What this is

"Signal Flow" — a single-page portfolio built as one continuous cinematic scroll-timeline
(not a scrolling document). Scroll position drives a narrative progress value through five
chapters: Hero, Journey, Skills, Projects, Contact. Stack: React 19 + TypeScript, Vite, GSAP
(ScrollTrigger) + Lenis for smooth scroll, Zustand for state, Tailwind v4.

## Core architecture

- **`src/store/timeline-store.ts`** — Zustand store. `progress` (0–1, updates up to 60fps) is
  written on every scroll tick. **Never read `progress` with the reactive `useTimelineStore`
  hook** — it will cause excessive re-renders. Use `getProgress()` / `subscribeProgress()`
  instead. `activeSceneIndex`, `isLoading`, `reducedMotion`, and `deviceTier` change rarely and
  are safe to read reactively via `useTimelineStore(s => s.field)`.
- **`src/components/ScrollTimelineProvider.tsx`** — owns the Lenis instance and one GSAP
  `ScrollTrigger` that pins a track element for `innerHeight * totalWeight` of scroll distance,
  writing normalized progress into the store on every update. Exposes `scrollToScene(index)` via
  context, used by both the chapter tracker and keyboard nav.
- **`src/components/SceneStage.tsx`** — the *only* place cross-fade/parallax/scale transition
  logic lives. Renders every scene from the registry, all mounted at once (so screen-reader and
  keyboard order always match narrative order), and imperatively fades between scenes based on
  each scene's local progress. Scene components never reference each other.
- **`src/lib/scene-registry.ts`** — single source of truth for chapters (see below). Also holds
  the progress-range math: `sceneLocalProgress`, `activeSceneIndex`, `sceneSettledProgress`
  (snap targets, respecting per-chapter carousel step boundaries), and `sceneOpacity` (windowed
  cross-fade math shared by every chapter boundary).
- **`src/lib/use-scene-progress.ts`** — hook every scene component uses to read its own local
  progress slice (0–1 within its own range) without knowing about neighboring scenes.
- **`src/components/CosmosBackground.tsx`** — site-wide three.js backdrop (shader starfield,
  nebula, mountain silhouettes, bloom), lazy-loaded as its own chunk. The camera flies
  continuously deeper as the timeline progresses (`CAMERA_PATH` waypoints, keyed by scene id)
  and nebula/atmosphere hues track `getHue` (per-chapter palette in `src/lib/signal-forms.ts`)
  blended via `sceneMorphBlend`, in lockstep with the text dissolve. Skipped on low
  `deviceTier` (see `src/lib/device-tier.ts`; `?tier=high|low` URL override) and in the
  fallback path. Things that look arbitrary but aren't:
  - The look target slides ahead of the camera once it nears `LOOK_TARGET` (a fixed target
    made the camera tilt to the floor in Projects, snap 180° at the boundary, and face
    backwards through Contact). Hero→Skills framing is unaffected.
  - The atmosphere glow eases to `OPEN_SPACE_GLOW` once the camera clears the last mountain
    range: the mountains' depth (even fully faded) masks the glow below the ridge, and
    unmasked it washed Projects body text down to ~2.8:1. Don't "fix" the faded mountains'
    depth writes without re-checking text contrast in every chapter.
  - The scene renders into a 4× MSAA target on DPR < 1.5 (hairlines alias badly without it),
    and a one-time frame-time probe drops MSAA for the session on GPUs that can't hold ~45fps.

### Chapter landmarks are declarative too

Each chapter can have one landmark in the sky (`src/cosmos/`), registered by scene id in
`LANDMARKS` (`src/cosmos/landmarks.ts`): Journey's career constellation, Skills' neural
network, Projects' orbiting satellites, Contact's transmitting beacon (Hero has none — its
horizon is the landmark). A landmark is a factory returning `{ object, placement, update,
dispose }` (see `src/cosmos/types.ts`); CosmosBackground does all the positioning and fading:
- `placement.offset` is relative to the chapter's `CAMERA_PATH` waypoint, with `x` authored for
  a 16:10 frame and scaled by aspect; `follow` (0..1) sets how slowly the camera approaches it.
  Landmarks live in the open sky right of the text column — check 1280px-wide viewports, where
  the fixed-width text reaches furthest right.
- `presence` is exactly the chapter text's `sceneOpacity`, so landmarks dip through empty sky
  at boundaries like the text does (never a double exposure).
- `step` is the same `steppedCarouselPosition` the chapter's carousel uses, so step-linked
  landmarks (constellation, satellites) can't drift out of sync; counts come from `steps`.
- Everything in `src/cosmos/` must only be imported by CosmosBackground (keeps three.js in the
  lazy chunk), and the folder is excluded from Tailwind scanning (`@source not` in
  `index.css`) because GLSL words like `ring` otherwise generate dead utilities.
- Contact links call `sendSignalPing()` (timeline store) on hover/focus; the beacon answers
  with a shockwave ring. Tone mapping squashes highlights, so make such cues differ in
  *shape*, not just brightness.

### Chapters are declarative

Chapters don't use hand-typed 0–1 ranges — each entry in `SCENES` (in `scene-registry.ts`) gets
a `weight`, and ranges are derived proportionally from the total. A chapter with `weight: 2` gets
twice the scroll runway of a `weight: 1` chapter — useful for chapters with their own
sub-progression (Journey's experience carousel, Projects' per-project mini-scenes, both marked
with `steps`). To add a chapter: create the component in `src/scenes/`, read local progress via
`useSceneProgress(id, callback, immersive)`, and add one line to `SCENES`. `SceneStage`,
`FallbackStack`, `ChapterTracker`, and `KeyboardNav` all derive from that array automatically —
nothing else needs to change. To retime chapters, only edit `weight` values.

### Accessibility & fallback path

If `prefers-reduced-motion` is set, or the viewport is mobile-width
(`src/lib/use-immersive.ts` decides this), the pinned/scrubbed mechanic never engages — the
scroll-timeline `ScrollTrigger` is skipped entirely and **`src/components/FallbackStack.tsx`**
renders every scene as a normal stacked `<section>` in document flow instead: same content, real
native scroll, no motion. Any change to scene content/logic must work in both the immersive
(`SceneStage`) and fallback (`FallbackStack`) paths — check `useIsImmersive()` usage in a scene
before assuming imperative-ref-mutation style is always safe.

### Content

Real content lives in `src/content/*.ts` (`profile`, `skills`, `experience`, `projects`). Known,
intentional gaps — don't try to fill these with fabricated data:
- Only 2 real projects exist (the `ProjectsScene` carousel supports more — add entries to
  `src/content/projects.ts` if given real project data).
- No Research/Writing chapter — omitted until real content exists.
- No resume PDF or headshot — Contact says "resume available on request" rather than linking a
  dead file.

## Known manual-verification gaps

Most of this project was built without browser automation; the cosmos landmarks were checked
in headless Chromium (Playwright + SwiftShader, `?tier=high`). That renderer runs the cosmos at
~2–4fps, so the per-frame camera smoothing needs ~15s of waiting to settle before a screenshot
means anything, and short-lived effects can only be verified by state traces. Still needs a
human/real browser check rather than being assumed correct:
- Actual motion feel/timing of the cross-fade and per-chapter scroll choreography.
- Real-GPU frame rate with MSAA on (software GL trips the MSAA safeguard by design).
- Real touch-device momentum behavior (Lenis `syncTouch`) vs. native scroll — only desktop
  devtools emulation has been checked, not an actual phone/tablet.

## Path alias

`@/*` resolves to `./src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`).
