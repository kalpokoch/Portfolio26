import { useState } from "react";
import { ScrollTimelineProvider } from "./components/ScrollTimelineProvider";
import SceneStage from "./components/SceneStage";
import ChapterTracker from "./components/ChapterTracker";
import KeyboardNav from "./components/KeyboardNav";
import FallbackStack from "./components/FallbackStack";
import Loader from "./components/Loader";
import { useIsImmersive } from "./lib/use-immersive";

function Experience() {
  const immersive = useIsImmersive();

  if (!immersive) return <FallbackStack />;

  return (
    <>
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
