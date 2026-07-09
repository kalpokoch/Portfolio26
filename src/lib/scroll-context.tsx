import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from "react";
import type Lenis from "lenis";
import { createLenis, ScrollTrigger } from "./lenis-setup";
import { SCENE_RANGES, TOTAL_WEIGHT, activeSceneIndex } from "./scenes-config";
import { useReducedMotion } from "./use-reduced-motion";

type ProgressListener = (progress: number) => void;

interface ScrollContextValue {
  progressRef: MutableRefObject<number>;
  pulseRef: MutableRefObject<number>;
  triggerPulse: () => void;
  activeScene: number;
  subscribe: (fn: ProgressListener) => () => void;
  scrollToScene: (index: number) => void;
  reportActiveScene: (index: number) => void;
  reducedMotion: boolean;
  trackRef: RefObject<HTMLDivElement | null>;
}

const ScrollContext = createContext<ScrollContextValue | null>(null);

export function useScrollContext(): ScrollContextValue {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error("useScrollContext must be used within ScrollProvider");
  return ctx;
}

export function ScrollProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const progressRef = useRef(0);
  const pulseRef = useRef(0);
  const [activeScene, setActiveScene] = useState(0);
  const listenersRef = useRef<Set<ProgressListener>>(new Set());
  const lenisRef = useRef<Lenis | null>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const subscribe = useCallback((fn: ProgressListener) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  }, []);

  const triggerPulse = useCallback(() => {
    pulseRef.current = 1;
  }, []);

  useEffect(() => {
    if (reducedMotion || !trackRef.current) return;

    const { lenis, destroy } = createLenis();
    lenisRef.current = lenis;

    const st = ScrollTrigger.create({
      trigger: trackRef.current,
      start: "top top",
      end: () => `+=${window.innerHeight * TOTAL_WEIGHT}`,
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        progressRef.current = self.progress;
        listenersRef.current.forEach((fn) => fn(self.progress));
        const idx = activeSceneIndex(self.progress);
        setActiveScene((prev) => (prev !== idx ? idx : prev));
      },
    });
    stRef.current = st;

    return () => {
      st.kill();
      destroy();
      lenisRef.current = null;
      stRef.current = null;
    };
  }, [reducedMotion]);

  const scrollToScene = useCallback((index: number) => {
    const range = SCENE_RANGES[index];
    if (!range) return;
    const st = stRef.current;
    if (st && lenisRef.current) {
      // land inside the scene's fully-visible zone, not its exact (still-fading-in) start
      const width = range.end - range.start;
      const settledStart = range.start + width * 0.28;
      const target = st.start + settledStart * (st.end - st.start);
      lenisRef.current.scrollTo(target, { duration: 1.2 });
      return;
    }
    document
      .getElementById(`scene-${range.id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const reportActiveScene = useCallback((index: number) => {
    setActiveScene((prev) => (prev !== index ? index : prev));
  }, []);

  const value = useMemo<ScrollContextValue>(
    () => ({
      progressRef,
      pulseRef,
      triggerPulse,
      activeScene,
      subscribe,
      scrollToScene,
      reportActiveScene,
      reducedMotion,
      trackRef,
    }),
    [activeScene, subscribe, scrollToScene, reportActiveScene, triggerPulse, reducedMotion],
  );

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
}
