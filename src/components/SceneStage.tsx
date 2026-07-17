import { useEffect, useRef } from "react";
import { useTimeline } from "./ScrollTimelineProvider";
import { SCENES, SCENE_RANGES, sceneOpacity } from "../lib/scene-registry";
import { subscribeProgress } from "../store/timeline-store";

interface CachedStyle {
  opacity: string;
  pointerEvents: string;
  transform: string;
  filter: string;
}

// Max blur applied to a scene the further it sits from fully in/out — a rack-focus dissolve
// instead of a plain opacity cross-fade, so two chapters' dense text never overlap sharply
// legible at the same time mid-transition.
const MAX_BLUR_PX = 10;

/**
 * The only place scene-transition logic lives. Individual scenes never know about
 * neighboring scenes — they only read their own local progress slice (via scene-registry
 * helpers). This shared cross-fade + parallax-depth + scale keeps every chapter transition
 * consistent instead of scene-specific one-off animation code.
 */
export default function SceneStage() {
  const { trackRef } = useTimeline();
  const sceneElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const lastStylesRef = useRef<Array<CachedStyle | undefined>>([]);

  useEffect(() => {
    return subscribeProgress((progress) => {
      SCENE_RANGES.forEach((_range, i) => {
        const el = sceneElsRef.current[i];
        if (!el) return;
        const opacity = sceneOpacity(progress, i);
        const blur = (1 - opacity) * MAX_BLUR_PX;
        const nextStyles: CachedStyle = {
          opacity: String(opacity),
          pointerEvents: opacity > 0.5 ? "auto" : "none",
          transform: `translateY(${(1 - opacity) * 16}px) scale(${0.985 + opacity * 0.015})`,
          filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : "none",
        };
        const prev = lastStylesRef.current[i];
        if (
          prev &&
          prev.opacity === nextStyles.opacity &&
          prev.pointerEvents === nextStyles.pointerEvents &&
          prev.transform === nextStyles.transform &&
          prev.filter === nextStyles.filter
        ) {
          return;
        }
        lastStylesRef.current[i] = nextStyles;
        el.style.opacity = nextStyles.opacity;
        el.style.pointerEvents = nextStyles.pointerEvents;
        el.style.transform = nextStyles.transform;
        el.style.filter = nextStyles.filter;

        const hidden = opacity < 0.05;
        el.setAttribute("aria-hidden", hidden ? "true" : "false");
        if (hidden) el.setAttribute("inert", "");
        else el.removeAttribute("inert");
      });
    });
  }, []);

  return (
    <div
      ref={trackRef}
      className="relative z-10 h-screen w-full overflow-hidden px-3 sm:px-6"
    >
      {SCENE_RANGES.map((range, i) => {
        const SceneComponent = SCENES[i].component;
        return (
          <div
            key={range.id}
            id={`scene-${range.id}`}
            ref={(el) => {
              sceneElsRef.current[i] = el;
            }}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: i === 0 ? 1 : 0,
              willChange: "opacity, transform, filter",
              contain: "layout paint",
            }}
          >
            <SceneComponent />
          </div>
        );
      })}
    </div>
  );
}
