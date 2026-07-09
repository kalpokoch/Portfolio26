import { useEffect, useRef, useState } from "react";
import { experience } from "../../content/experience";
import { sceneLocalProgress } from "../../lib/scenes-config";
import { useScrollContext } from "../../lib/scroll-context";
import { useIsMobile } from "../../lib/use-is-mobile";
import MetricChip from "../MetricChip";

export default function Experience() {
  const { subscribe, triggerPulse, reducedMotion } = useScrollContext();
  const isMobile = useIsMobile();
  const immersive = !reducedMotion && !isMobile;
  const [activeStep, setActiveStep] = useState(0);
  const lastStep = useRef(0);

  useEffect(() => {
    if (!immersive) return;
    const unsub = subscribe((progress) => {
      const local = sceneLocalProgress(progress, "experience");
      const step = Math.min(
        experience.length - 1,
        Math.floor(local * experience.length),
      );
      if (step !== lastStep.current) {
        lastStep.current = step;
        setActiveStep(step);
        triggerPulse();
      }
    });
    return unsub;
  }, [subscribe, triggerPulse, immersive]);

  return (
    <section
      aria-label="Experience"
      className="mx-auto flex w-full max-w-3xl flex-col justify-center px-6"
    >
      <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-[#3FD0C9]">
        Experience
      </h2>

      <ol className="mt-6 flex flex-col gap-6">
        {experience.map((entry, i) => {
          const isActive = !immersive || i === activeStep;
          return (
            <li
              key={entry.role + entry.dates}
              className="transition-all duration-500"
              style={
                immersive
                  ? {
                      opacity: isActive ? 1 : 0.28,
                      transform: isActive ? "translateX(0)" : "translateX(-6px)",
                    }
                  : undefined
              }
              aria-current={immersive && isActive ? "step" : undefined}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-lg font-bold text-[#E8ECEF] sm:text-xl">
                  {entry.role}
                </h3>
                <span className="font-mono text-xs text-[#8A96A8]">
                  {entry.org} · {entry.location}
                </span>
                <span className="font-mono text-xs text-[#3FD0C9]">
                  {entry.dates}
                </span>
              </div>
              {isActive && (
                <>
                  <ul className="mt-2 flex flex-col gap-1 text-sm leading-relaxed text-[#8A96A8]">
                    {entry.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <MetricChip key={tag} label={tag} />
                    ))}
                  </div>
                  {entry.link && (
                    <a
                      href={entry.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block font-mono text-xs text-[#3FD0C9] underline decoration-[#3FD0C9]/40 underline-offset-4 hover:decoration-[#3FD0C9]"
                    >
                      {entry.link.replace("https://", "")}
                    </a>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
