import { useEffect, useRef, useState } from "react";
import { SCENES } from "../lib/scene-registry";
import { timelineStore } from "../store/timeline-store";
import MobileCosmosBackground from "./MobileCosmosBackground";

/**
 * Mobile's own immersive mode: real document scroll (no pin — see use-immersive.ts for why),
 * a lightweight Canvas2D cosmos behind the content, and a one-shot fade/rise per section as
 * it enters the viewport instead of desktop's continuous scroll-scrub, which has nothing to
 * scrub against on a natively-scrolling page.
 */
export default function MobileStack() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Once a section has entered, it stays revealed — no re-hiding on scroll-back-up.
    const revealObserver = new IntersectionObserver(
      (entries) => {
        const newlyRevealed = entries.filter((e) => e.isIntersecting).map((e) => e.target.id);
        if (newlyRevealed.length === 0) return;
        setRevealedIds((prev) => {
          if (newlyRevealed.every((id) => prev.has(id))) return prev;
          const next = new Set(prev);
          for (const id of newlyRevealed) next.add(id);
          return next;
        });
      },
      { threshold: 0.15 },
    );

    // A thin band through the vertical center of the viewport — whichever section crosses it
    // becomes "active", driving the cosmos hue exactly like the desktop tracker does off the
    // pinned progress value.
    const activeObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = SCENES.findIndex((s) => `scene-${s.id}` === entry.target.id);
          if (idx !== -1) timelineStore.getState().setActiveSceneIndex(idx);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    const sections = container.querySelectorAll("[data-scene-section]");
    for (const el of sections) {
      revealObserver.observe(el);
      activeObserver.observe(el);
    }
    return () => {
      revealObserver.disconnect();
      activeObserver.disconnect();
    };
  }, []);

  return (
    <>
      <MobileCosmosBackground />
      <main ref={containerRef} className="relative z-10 flex flex-col gap-20 py-16">
        {SCENES.map((scene) => {
          const SceneComponent = scene.component;
          const isRevealed = revealedIds.has(`scene-${scene.id}`);
          return (
            <div
              key={scene.id}
              id={`scene-${scene.id}`}
              data-scene-section
              className={`min-h-screen w-full transition-[opacity,transform] duration-700 ease-[var(--ease-signal)] ${
                isRevealed ? "opacity-100" : "translate-y-6 opacity-0"
              }`}
            >
              <SceneComponent />
            </div>
          );
        })}
      </main>
    </>
  );
}
