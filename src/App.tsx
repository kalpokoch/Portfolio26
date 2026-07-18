import { lazy, Suspense, useEffect, useState } from "react";
import { ScrollTimelineProvider } from "./components/ScrollTimelineProvider";
import SceneStage from "./components/SceneStage";
import ChapterTracker from "./components/ChapterTracker";
import KeyboardNav from "./components/KeyboardNav";
import FallbackStack from "./components/FallbackStack";
import Loader from "./components/Loader";

// Lazy so three.js ships as its own async chunk, loading behind the Loader
// instead of blocking first paint.
const CosmosBackground = lazy(() => import("./components/CosmosBackground"));
import { useIsImmersive } from "./lib/use-immersive";
import { timelineStore } from "./store/timeline-store";

function Experience() {
  const immersive = useIsImmersive();

  useEffect(() => {
    if (!immersive) {
      // Fallback path has no cosmos — the loader shouldn't wait for one.
      timelineStore.getState().setBackgroundReady(true);
      return;
    }
    document.documentElement.classList.add("no-scrollbar");
    return () => document.documentElement.classList.remove("no-scrollbar");
  }, [immersive]);

  if (!immersive) return <FallbackStack />;

  return (
    <>
      {/* Stable wrapper: the lazy chunk resolves AFTER ScrollTrigger's pin has re-parented
          SceneStage's element into a pin-spacer. Without this div, React would try to
          insertBefore against that moved node and crash the whole tree. */}
      <div>
        <Suspense fallback={null}>
          <CosmosBackground />
        </Suspense>
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
