import { useState } from "react";
import { ScrollProvider, useScrollContext } from "./lib/scroll-context";
import { useIsMobile } from "./lib/use-is-mobile";
import { ParticleField } from "./three/ParticleField";
import SceneTrack from "./components/SceneTrack";
import FallbackLayout from "./components/FallbackLayout";
import SideNav from "./components/Nav/SideNav";
import KeyboardNav from "./components/Nav/KeyboardNav";
import Loader from "./components/Loader";

function Experience() {
  const { reducedMotion } = useScrollContext();
  const isMobile = useIsMobile();
  const immersive = !reducedMotion && !isMobile;

  return (
    <>
      {!reducedMotion && <ParticleField />}
      {immersive ? <SceneTrack /> : <FallbackLayout />}
      <SideNav />
      <KeyboardNav />
    </>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  return (
    <ScrollProvider>
      {loading && <Loader onDone={() => setLoading(false)} />}
      <Experience />
    </ScrollProvider>
  );
}

export default App;
