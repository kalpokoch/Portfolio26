import { SCENE_RANGES } from "../../lib/scenes-config";
import { useScrollContext } from "../../lib/scroll-context";

export default function SideNav() {
  const { activeScene, scrollToScene } = useScrollContext();

  return (
    <nav
      aria-label="Scene navigation"
      className="fixed right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-end gap-4 sm:flex"
    >
      {SCENE_RANGES.map((range, i) => {
        const isActive = i === activeScene;
        return (
          <button
            key={range.id}
            type="button"
            onClick={() => scrollToScene(i)}
            aria-current={isActive ? "true" : undefined}
            aria-label={`Go to ${range.label} section`}
            className="group flex items-center gap-3"
          >
            <span
              className="font-mono text-xs tracking-wide transition-colors"
              style={{ color: isActive ? "#3FD0C9" : "#8A96A8" }}
            >
              {range.label}
            </span>
            <span
              className="block h-2 w-2 rounded-full border transition-all"
              style={{
                borderColor: isActive ? "#3FD0C9" : "#8A96A8",
                backgroundColor: isActive ? "#3FD0C9" : "transparent",
                transform: isActive ? "scale(1.4)" : "scale(1)",
              }}
            />
          </button>
        );
      })}
    </nav>
  );
}
