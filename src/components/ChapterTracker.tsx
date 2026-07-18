import { useTimelineStore } from "../store/timeline-store";
import { SCENES } from "../lib/scene-registry";
import { useTimeline } from "./ScrollTimelineProvider";

export default function ChapterTracker() {
  const activeSceneIndex = useTimelineStore((s) => s.activeSceneIndex);
  const { scrollToScene } = useTimeline();

  return (
    <nav
      aria-label="Chapters"
      className="fixed right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-end gap-4 sm:flex"
    >
      {SCENES.map((scene, i) => {
        const active = i === activeSceneIndex;
        return (
          <button
            key={scene.id}
            type="button"
            onClick={() => scrollToScene(i)}
            aria-current={active ? "true" : undefined}
            className="group flex items-center gap-3"
          >
            <span
              className={`font-mono text-[0.6rem] uppercase tracking-[0.28em] transition-colors duration-200 ease-[var(--ease-signal)] ${
                active ? "text-[#EDEAE2]" : "text-[#5B6660] group-hover:text-[#9AA39C]"
              }`}
            >
              {scene.title}
            </span>
            <span
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ease-[var(--ease-signal)] ${
                active ? "bg-[#8FBFA3]" : "bg-[#5B6660]"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
