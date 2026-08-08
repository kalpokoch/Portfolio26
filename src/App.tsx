import { lazy, Suspense, useEffect, useState } from "react";
import { ScrollTimelineProvider } from "./components/ScrollTimelineProvider";
import SceneStage from "./components/SceneStage";
import ChapterTracker from "./components/ChapterTracker";
import KeyboardNav from "./components/KeyboardNav";
import FallbackStack from "./components/FallbackStack";
import MobileStack from "./components/MobileStack";
import Loader from "./components/Loader";
import CosmosErrorBoundary from "./components/CosmosErrorBoundary";
import { useIsImmersive, useIsMobileImmersive } from "./lib/use-immersive";
import { timelineStore, useTimelineStore } from "./store/timeline-store";

/**
 * A dynamic import can reject on a transient network blip (common on mobile connections) —
 * plain `lazy()` never retries, leaving the chunk permanently missing until a hard refresh.
 * One retry after a short delay recovers the common case; CosmosErrorBoundary is the
 * fallback for anything that still fails after that.
 */
function lazyWithRetry<T extends { default: React.ComponentType }>(
  factory: () => Promise<T>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return factory();
    }
  });
}

// Lazy so three.js ships as its own async chunk, loading behind the Loader
// instead of blocking first paint.
const CosmosBackground = lazyWithRetry(() => import("./components/CosmosBackground"));

function Experience() {
  const immersive = useIsImmersive();
  const mobileImmersive = useIsMobileImmersive();
  const reducedMotion = useTimelineStore((s) => s.reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      // The fully static fallback has no cosmos of its own — the loader shouldn't wait
      // for a background that's never coming.
      timelineStore.getState().setBackgroundReady(true);
      return;
    }
    if (immersive) {
      document.documentElement.classList.add("no-scrollbar");
      return () => document.documentElement.classList.remove("no-scrollbar");
    }
    // mobileImmersive: MobileCosmosBackground marks backgroundReady itself once its first
    // frame is on screen.
  }, [reducedMotion, immersive]);

  if (mobileImmersive) return <MobileStack />;
  if (!immersive) return <FallbackStack />;

  return (
    <>
      {/* Stable wrapper: the lazy chunk resolves AFTER ScrollTrigger's pin has re-parented
          SceneStage's element into a pin-spacer. Without this div, React would try to
          insertBefore against that moved node and crash the whole tree. */}
      <div>
        <CosmosErrorBoundary>
          <Suspense fallback={null}>
            <CosmosBackground />
          </Suspense>
        </CosmosErrorBoundary>
      </div>
      <SceneStage />
      <ChapterTracker />
      <KeyboardNav />
    </>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  return (
    <ScrollTimelineProvider>
      {loading && <Loader onDone={() => setLoading(false)} />}
      <Experience />
    </ScrollTimelineProvider>
  );
}

export default App;
