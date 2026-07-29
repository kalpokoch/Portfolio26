import { useEffect, useRef, useState } from "react";
import { useTimelineStore } from "../store/timeline-store";
import { subscribeProgress } from "../store/timeline-store";
import { SCENES, sceneActiveStep } from "../lib/scene-registry";
import { useTimeline } from "./ScrollTimelineProvider";

export default function ChapterTracker() {
  const activeSceneIndex = useTimelineStore((s) => s.activeSceneIndex);
  const { scrollToScene, scrollToStep } = useTimeline();
  const [activeStep, setActiveStep] = useState(0);
  const lastStep = useRef(0);

  // Only the active chapter's step matters, and only chapters with `steps` have one — so
  // resubscribe on chapter change (rare) rather than computing every scene on every tick.
  useEffect(() => {
    const scene = SCENES[activeSceneIndex];
    if (!scene || (scene.steps ?? 1) <= 1) {
      lastStep.current = 0;
      setActiveStep(0);
      return;
    }
    return subscribeProgress((progress) => {
      const step = sceneActiveStep(progress, activeSceneIndex);
      if (step !== lastStep.current) {
        lastStep.current = step;
        setActiveStep(step);
      }
    });
  }, [activeSceneIndex]);

  return (
    <nav
      aria-label="Chapters"
      className="fixed right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-end gap-4 sm:flex"
    >
      {SCENES.map((scene, i) => {
        const active = i === activeSceneIndex;
        const steps = scene.steps ?? 1;
        const expanded = active && steps > 1;
        return (
          <div key={scene.id} className="flex flex-col items-end">
            <button
              type="button"
              onClick={() => scrollToScene(i)}
              aria-current={active ? "true" : undefined}
              aria-expanded={steps > 1 ? expanded : undefined}
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

            {steps > 1 && (
              <div
                className="grid transition-[grid-template-rows] duration-[var(--dur-reveal)] ease-[var(--ease-signal)]"
                style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
              >
                <div className="flex flex-col items-end gap-1.5 overflow-hidden pt-2">
                  {Array.from({ length: steps }, (_, s) => {
                    const isStepActive = expanded && s === activeStep;
                    return (
                      <button
                        key={s}
                        type="button"
                        tabIndex={expanded ? 0 : -1}
                        onClick={() => scrollToStep(i, s)}
                        aria-current={isStepActive ? "true" : undefined}
                        aria-label={`${scene.title} ${s + 1} of ${steps}`}
                        className={`font-mono text-[0.55rem] tracking-[0.2em] transition-colors duration-200 ease-[var(--ease-signal)] ${
                          isStepActive
                            ? "text-[var(--color-signal)]"
                            : "text-[var(--color-muted-strong)] hover:text-[#9AA39C]"
                        }`}
                      >
                        {String(s + 1).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
