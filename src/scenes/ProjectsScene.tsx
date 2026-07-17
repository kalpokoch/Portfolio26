import { useRef, useState } from "react";
import { projects, type ProjectEntry } from "../content/projects";
import { useSceneProgress } from "../lib/use-scene-progress";
import { useIsImmersive } from "../lib/use-immersive";
import SplitColumn from "../components/SplitColumn";
import Stat from "../components/Stat";

function ProjectContent({ project }: { project: ProjectEntry }) {
  return (
    <div>
      <h2 className="type-headline max-w-[16ch]">{project.title}</h2>
      <div className="mt-6 flex flex-col gap-3">
        {project.bullets.map((b) => (
          <p key={b} className="type-statement max-w-2xl">
            {b}
          </p>
        ))}
      </div>
      <div className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
        {project.tags.map((tag) => (
          <Stat key={tag} tag={tag} />
        ))}
      </div>
      <a
        href={project.link}
        target="_blank"
        rel="noreferrer"
        className="type-meta mt-6 inline-block text-[#8FBFA3] underline decoration-[#8FBFA3]/40 underline-offset-4 hover:decoration-[#8FBFA3]"
      >
        {project.link.replace("https://", "")}
      </a>
    </div>
  );
}

export default function ProjectsScene() {
  const immersive = useIsImmersive();
  const [activeStep, setActiveStep] = useState(0);
  const lastStep = useRef(0);

  useSceneProgress(
    "projects",
    (local) => {
      const step = Math.min(projects.length - 1, Math.floor(local * projects.length));
      if (step !== lastStep.current) {
        lastStep.current = step;
        setActiveStep(step);
      }
    },
    immersive,
  );

  return (
    <SplitColumn
      sceneId="projects"
      ariaLabel="Projects"
      railLabel="Projects"
      rail={
        immersive ? (
          <p className="type-meta text-[#5B6660]">
            {String(activeStep + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
          </p>
        ) : undefined
      }
    >
      {immersive ? (
        <ProjectContent project={projects[activeStep]} />
      ) : (
        <div className="flex flex-col gap-12">
          {projects.map((project, i) => (
            <div key={project.title} className={i > 0 ? "hairline pt-12" : ""}>
              <ProjectContent project={project} />
            </div>
          ))}
        </div>
      )}
    </SplitColumn>
  );
}
