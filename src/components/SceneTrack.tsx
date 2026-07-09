import { useEffect, useRef } from "react";
import { useScrollContext } from "../lib/scroll-context";
import { SCENE_RANGES, sceneLocalProgress } from "../lib/scenes-config";
import Hero from "./scenes/Hero";
import About from "./scenes/About";
import Experience from "./scenes/Experience";
import Projects from "./scenes/Projects";
import Contact from "./scenes/Contact";

const SCENE_COMPONENTS = [Hero, About, Experience, Projects, Contact];
const FADE = 0.12;

export default function SceneTrack() {
  const { trackRef, subscribe } = useScrollContext();
  const sceneElsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const unsub = subscribe((progress) => {
      SCENE_RANGES.forEach((range, i) => {
        const el = sceneElsRef.current[i];
        if (!el) return;
        const local = sceneLocalProgress(progress, range.id);
        const isFirst = i === 0;
        const isLast = i === SCENE_RANGES.length - 1;
        let opacity = 1;
        if (!isFirst && local < FADE) opacity = local / FADE;
        else if (!isLast && local > 1 - FADE) opacity = (1 - local) / FADE;
        if (progress < range.start - FADE || progress > range.end + FADE) opacity = 0;
        opacity = Math.max(0, Math.min(1, opacity));
        el.style.opacity = String(opacity);
        el.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
        el.style.transform = `translateY(${(1 - opacity) * 16}px) scale(${0.98 + opacity * 0.02})`;
      });
    });
    return unsub;
  }, [subscribe]);

  return (
    <div ref={trackRef} className="relative z-10 h-screen w-full overflow-hidden">
      {SCENE_RANGES.map((range, i) => {
        const SceneComponent = SCENE_COMPONENTS[i];
        return (
          <div
            key={range.id}
            ref={(el) => {
              sceneElsRef.current[i] = el;
            }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: i === 0 ? 1 : 0, willChange: "opacity, transform" }}
          >
            <SceneComponent />
          </div>
        );
      })}
    </div>
  );
}
