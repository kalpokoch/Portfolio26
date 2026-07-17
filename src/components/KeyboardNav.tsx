import { useEffect } from "react";
import { useTimeline } from "./ScrollTimelineProvider";
import { timelineStore } from "../store/timeline-store";
import { SCENES } from "../lib/scene-registry";

export default function KeyboardNav() {
  const { scrollToScene } = useTimeline();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const current = timelineStore.getState().activeSceneIndex;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        scrollToScene(Math.min(SCENES.length - 1, current + 1));
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        scrollToScene(Math.max(0, current - 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        scrollToScene(0);
      } else if (e.key === "End") {
        e.preventDefault();
        scrollToScene(SCENES.length - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [scrollToScene]);

  return null;
}
