import { useRef, useState } from "react";
import { experience } from "../content/experience";
import { education } from "../content/skills";
import { useSceneProgress } from "../lib/use-scene-progress";
import { sceneInnerLocal, steppedCarouselPosition } from "../lib/scene-registry";
import { useIsImmersive } from "../lib/use-immersive";
import SplitColumn from "../components/SplitColumn";
import Stat from "../components/Stat";

export default function JourneyScene() {
  const immersive = useIsImmersive();
  const [activeStep, setActiveStep] = useState(0);
  const lastStep = useRef(0);
  const windowRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLOListElement | null>(null);

  useSceneProgress(
    "journey",
    (local) => {
      const position = steppedCarouselPosition(sceneInnerLocal(local, "journey"), experience.length);
      const windowWidth = windowRef.current?.clientWidth ?? 0;
      const track = trackRef.current;
      if (track && windowWidth > 0) {
        track.style.transform = `translate3d(${-position * windowWidth}px, 0, 0)`;
      }
      const step = Math.round(position);
      if (step !== lastStep.current) {
        lastStep.current = step;
        setActiveStep(step);
      }
    },
    immersive,
  );

  return (
    <SplitColumn
      sceneId="journey"
      ariaLabel="Journey"
      railLabel="Journey"
      rail={
        <>
          <p className="type-meta">{education.institution}</p>
          <p className="type-meta">
            {education.degree} · {education.dates}
          </p>
          {immersive && (
            <p className="type-meta mt-4 text-[var(--color-muted-strong)]">
              {String(activeStep + 1).padStart(2, "0")} / {String(experience.length).padStart(2, "0")}
            </p>
          )}
        </>
      }
    >
      {immersive ? (
        <div ref={windowRef} className="overflow-hidden">
          <ol
            ref={trackRef}
            className="flex will-change-transform"
            style={{ transform: "translate3d(0, 0, 0)" }}
          >
            {experience.map((entry) => (
              <li key={entry.role + entry.dates} className="w-full shrink-0 pr-4">
                <h2 className="type-headline">{entry.role}</h2>
                <p className="type-meta mt-3">
                  {entry.org} · {entry.location}
                  <span className="divider">/</span>
                  {entry.dates}
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  {entry.bullets.map((b) => (
                    <p key={b} className="type-statement max-w-2xl">
                      {b}
                    </p>
                  ))}
                </div>
                <div className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
                  {entry.tags.map((tag) => (
                    <Stat key={tag} tag={tag} />
                  ))}
                </div>
                {entry.link && (
                  <a
                    href={entry.link}
                    target="_blank"
                    rel="noreferrer"
                    className="signal-link type-meta mt-6 inline-block text-[#8FBFA3]"
                  >
                    {entry.link.replace("https://", "")}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <ol className="flex flex-col gap-10">
          {experience.map((entry, i) => (
            <li key={entry.role + entry.dates} className={i > 0 ? "hairline pt-10" : ""}>
              <h2 className="type-headline">{entry.role}</h2>
              <p className="type-meta mt-3">
                {entry.org} · {entry.location}
                <span className="divider">/</span>
                {entry.dates}
              </p>
              <div className="mt-5 flex flex-col gap-2">
                {entry.bullets.map((b) => (
                  <p key={b} className="type-statement">
                    {b}
                  </p>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                {entry.tags.map((tag) => (
                  <Stat key={tag} tag={tag} />
                ))}
              </div>
              {entry.link && (
                <a
                  href={entry.link}
                  target="_blank"
                  rel="noreferrer"
                  className="signal-link type-meta mt-5 inline-block text-[#8FBFA3]"
                >
                  {entry.link.replace("https://", "")}
                </a>
              )}
            </li>
          ))}
        </ol>
      )}
    </SplitColumn>
  );
}
