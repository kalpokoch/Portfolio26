import { useRef } from "react";
import { skills } from "../content/skills";
import { useSceneProgress } from "../lib/use-scene-progress";
import { scrollReveal } from "../lib/scroll-reveal";
import { sceneInnerLocal } from "../lib/scene-registry";
import { useIsImmersive } from "../lib/use-immersive";
import SplitColumn from "../components/SplitColumn";

const GROUPS = Object.entries(skills) as [string, readonly string[]][];

export default function SkillsScene() {
  const immersive = useIsImmersive();
  const groupRefs = useRef<(HTMLDivElement | null)[]>([]);

  useSceneProgress(
    "skills",
    (local) => {
      const inner = sceneInnerLocal(local, "skills");
      GROUPS.forEach((_, i) => scrollReveal(groupRefs.current[i], inner, i, GROUPS.length, 22));
    },
    immersive,
  );

  return (
    <SplitColumn sceneId="skills" ariaLabel="Skills" railLabel="Skills">
      <div className="flex flex-col gap-10">
        {GROUPS.map(([group, items], i) => (
          <div
            key={group}
            ref={(el) => {
              groupRefs.current[i] = el;
            }}
            className={i > 0 ? "hairline pt-10" : ""}
          >
            <h2 className="type-headline">{group}</h2>
            <p className="type-statement mt-4 max-w-3xl !text-[#EDEAE2]">
              {items.map((item, j) => (
                <span key={item}>
                  {item}
                  {j < items.length - 1 && <span className="divider">/</span>}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>
    </SplitColumn>
  );
}
