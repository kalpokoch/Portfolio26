import { useEffect, useRef } from "react";
import { SCENE_RANGES } from "../lib/scenes-config";
import { useScrollContext } from "../lib/scroll-context";
import Hero from "./scenes/Hero";
import About from "./scenes/About";
import Experience from "./scenes/Experience";
import Projects from "./scenes/Projects";
import Contact from "./scenes/Contact";

const SCENE_COMPONENTS = [Hero, About, Experience, Projects, Contact];

const GRADIENTS = [
  "radial-gradient(circle at 50% 40%, rgba(63,208,201,0.14), transparent 60%)",
  "radial-gradient(circle at 30% 60%, rgba(63,208,201,0.12), transparent 60%)",
  "radial-gradient(circle at 70% 30%, rgba(242,166,90,0.10), transparent 60%)",
  "radial-gradient(circle at 40% 70%, rgba(63,208,201,0.12), transparent 60%)",
  "radial-gradient(circle at 50% 50%, rgba(242,166,90,0.14), transparent 55%)",
];

export default function FallbackLayout() {
  const { reportActiveScene } = useScrollContext();
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number((entry.target as HTMLElement).dataset.index);
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            reportActiveScene(idx);
          }
        });
      },
      { threshold: 0.4 },
    );

    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [reportActiveScene]);

  return (
    <div className="relative z-10 w-full">
      {SCENE_RANGES.map((range, i) => {
        const SceneComponent = SCENE_COMPONENTS[i];
        return (
          <section
            key={range.id}
            id={`scene-${range.id}`}
            ref={(el) => {
              sectionRefs.current[i] = el;
            }}
            data-index={i}
            className="fallback-scene relative flex min-h-screen w-full items-center justify-center py-20 opacity-0 transition-opacity duration-700"
            style={{ backgroundImage: GRADIENTS[i] }}
          >
            <SceneComponent />
          </section>
        );
      })}
      <style>{`.fallback-scene.is-visible { opacity: 1; }`}</style>
    </div>
  );
}
