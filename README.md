# Signal Flow — Cinematic Scroll-Timeline Portfolio

A single continuous scene sequence, not a scrolling document: scroll position drives a
narrative timeline through five chapters — Hero, Journey, Skills, Projects, Contact.

## Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check (tsc -b) + production build
npm run preview  # preview the production build
npm run lint     # oxlint
```

## How the timeline works

- **`src/store/timeline-store.ts`** — a Zustand store. `progress` (0–1, up to 60fps) is
  written on every scroll tick but should **never** be read with the reactive `useTimelineStore`
  hook — use `getProgress()`/`subscribeProgress()` instead, which don't trigger React re-renders.
  `activeSceneIndex`, `isLoading`, `reducedMotion`, and `deviceTier` change rarely and are fine
  to read reactively via `useTimelineStore(s => s.field)`.
- **`src/components/ScrollTimelineProvider.tsx`** — owns the Lenis instance and one GSAP
  `ScrollTrigger` that pins a track element for `innerHeight * totalWeight` of scroll distance,
  writing normalized progress into the store on every update. Also exposes `scrollToScene(index)`
  via context, used by both the chapter tracker and keyboard nav.
- **`src/components/SceneStage.tsx`** — the *only* place cross-fade/parallax/scale transition
  logic lives. It renders every scene from the registry, all mounted at once (so screen-reader
  and keyboard order always match narrative order), and imperatively fades between them based on
  each scene's local progress. Individual scene components never reference each other.
- **`src/lib/scene-registry.ts`** — the single source of truth for chapters (see below).
- **`src/lib/use-scene-progress.ts`** — the hook every scene component uses to read its own
  local progress slice (0–1 within its own range) without knowing about neighboring scenes.

### Accessibility & fallback

If `prefers-reduced-motion` is set, or the viewport is mobile-width, the pinned/scrubbed
mechanic never engages — the entire scroll-timeline `ScrollTrigger` is skipped, and
**`src/components/FallbackStack.tsx`** renders every scene as a normal stacked `<section>` in
document flow instead: same content, real native scroll, no motion. This split is decided by
**`src/lib/use-immersive.ts`**.

## Adding a new chapter

1. Create the scene component in `src/scenes/YourScene.tsx`. Read your own local progress with:
   ```tsx
   import { useSceneProgress } from "../lib/use-scene-progress";
   import { useIsImmersive } from "../lib/use-immersive";

   const immersive = useIsImmersive();
   useSceneProgress("your-scene-id", (local) => { /* imperative style/ref mutation */ }, immersive);
   ```
2. Add one line to the `SCENES` array in `src/lib/scene-registry.ts`:
   ```ts
   { id: "your-scene-id", title: "Your Title", weight: 1, component: YourScene },
   ```
   That's the only file that needs to change — `SceneStage`, `FallbackStack`, `ChapterTracker`,
   and `KeyboardNav` all derive from this array automatically.

## Adjusting progress ranges

Chapters don't use hand-typed 0–1 numbers — each gets a `weight` in `SCENES`, and
`scene-registry.ts` derives proportional `start`/`end` ranges from the total. A chapter with
`weight: 2` gets twice the scroll runway of a `weight: 1` chapter (useful for chapters with their
own sub-progression, like Journey's experience carousel or Projects' per-project mini-scenes).
To change the pacing, edit the `weight` values in `src/lib/scene-registry.ts` — nothing else
needs to change.

## The cosmos background

On capable desktops, **`src/components/CosmosBackground.tsx`** (three.js, lazy-loaded) flies a
camera through a starfield past mountain silhouettes as you scroll, tinting the sky per chapter.
Along the way each chapter has a landmark in the sky, defined in **`src/cosmos/`** and registered
by scene id in `src/cosmos/landmarks.ts`:

| Chapter | Landmark | Tied to the content |
| --- | --- | --- |
| Journey | Career constellation, one star per role | Route draws itself to the active carousel card |
| Skills | Feed-forward neural network | Layers assemble with the skill groups; forward passes pulse through it |
| Projects | Dark planet with one orbit per project | The active project's satellite flares and trails light |
| Contact | Transmitting beacon | Pings when you arrive, and when you hover/focus a contact link |

Landmarks fade exactly with their chapter's text and are placed relative to that chapter's
camera waypoint. To give a chapter one, write a factory in `src/cosmos/` (see `types.ts`) and add
it to `LANDMARKS`. Mobile gets a lightweight 2D starfield instead, and reduced-motion gets no
background motion at all.

## Content

Real content lives in `src/content/*.ts` (`profile`, `skills`, `experience`, `projects`).
Known gaps, intentionally not fabricated:
- Only 2 real projects exist today (`ProjectsScene` mini-scene carousel supports more —
  just add entries to `src/content/projects.ts`).
- No Research/Writing chapter — omitted until real content exists.
- No resume PDF or headshot — Contact notes "resume available on request" rather than a dead link.

## Known manual-verification items

No browser-automation tool was available while building this, so the following need a human
check rather than an automated one:
- Actual motion feel/timing of the cross-fade and per-chapter scroll choreography.
- Real touch-device momentum behavior (Lenis `syncTouch`) doesn't fight native scroll on an
  actual phone/tablet — only desktop devtools emulation was checked.
