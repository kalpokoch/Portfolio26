import { SCENES } from "../lib/scene-registry";

/**
 * Reduced-motion / mobile fallback: every scene renders as a normal stacked <section> in
 * document flow — same content as the immersive path, no pinning, no scroll-driven transitions,
 * native scroll and screen-reader order both work exactly as expected.
 */
export default function FallbackStack() {
  return (
    <main className="flex flex-col gap-24 py-24">
      {SCENES.map((scene) => {
        const SceneComponent = scene.component;
        return (
          <div key={scene.id} id={`scene-${scene.id}`} className="min-h-screen w-full">
            <SceneComponent />
          </div>
        );
      })}
    </main>
  );
}
