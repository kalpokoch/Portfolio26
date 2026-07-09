import { useEffect } from "react";
import { SCENE_RANGES } from "../../lib/scenes-config";
import { useScrollContext } from "../../lib/scroll-context";

export default function KeyboardNav() {
  const { activeScene, scrollToScene } = useScrollContext();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      const last = SCENE_RANGES.length - 1;
      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          e.preventDefault();
          scrollToScene(Math.min(last, activeScene + 1));
          break;
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          scrollToScene(Math.max(0, activeScene - 1));
          break;
        case "Home":
          e.preventDefault();
          scrollToScene(0);
          break;
        case "End":
          e.preventDefault();
          scrollToScene(last);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeScene, scrollToScene]);

  return null;
}
