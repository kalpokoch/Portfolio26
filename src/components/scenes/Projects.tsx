import { useEffect, useRef, useState } from "react";
import { projects } from "../../content/projects";
import { sceneLocalProgress } from "../../lib/scenes-config";
import { useScrollContext } from "../../lib/scroll-context";
import { useIsMobile } from "../../lib/use-is-mobile";
import MetricChip from "../MetricChip";

export default function Projects() {
  const { subscribe, triggerPulse, reducedMotion } = useScrollContext();
  const isMobile = useIsMobile();
  const immersive = !reducedMotion && !isMobile;
  const [activeStep, setActiveStep] = useState(0);
  const lastStep = useRef(0);

  useEffect(() => {
    if (!immersive) return;
    const unsub = subscribe((progress) => {
      const local = sceneLocalProgress(progress, "projects");
      const step = Math.min(
        projects.length - 1,
        Math.floor(local * projects.length),
      );
      if (step !== lastStep.current) {
        lastStep.current = step;
        setActiveStep(step);
        triggerPulse();
      }
    });
    return unsub;
  }, [subscribe, triggerPulse, immersive]);

  const visibleProjects = immersive ? [projects[activeStep]] : projects;

  return (
    <section
      aria-label="Projects"
      className="mx-auto flex w-full max-w-3xl flex-col justify-center px-6"
    >
      <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-[#3FD0C9]">
        Projects
        {immersive && (
          <span className="ml-3 text-[#8A96A8]">
            {activeStep + 1} / {projects.length}
          </span>
        )}
      </h2>

      <div className="mt-6 flex flex-col gap-10">
        {visibleProjects.map((project) => (
          <div key={project.title}>
            <h3 className="text-2xl font-bold text-[#E8ECEF] sm:text-3xl">
              {project.title}
            </h3>
            <ul className="mt-4 flex flex-col gap-2 text-sm leading-relaxed text-[#8A96A8] sm:text-base">
              {project.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <MetricChip key={tag} label={tag} />
              ))}
            </div>
            <a
              href={project.link}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block font-mono text-xs text-[#3FD0C9] underline decoration-[#3FD0C9]/40 underline-offset-4 hover:decoration-[#3FD0C9]"
            >
              {project.link.replace("https://", "")}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
