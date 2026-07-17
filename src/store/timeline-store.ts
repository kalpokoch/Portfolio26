import { createStore, useStore } from "zustand";

export type DeviceTier = "low" | "high";

interface TimelineState {
  /** 0..1 scroll progress. Mutates up to 60x/second — read via getProgress()/subscribeProgress(), never the reactive hook. */
  progress: number;
  activeSceneIndex: number;
  isLoading: boolean;
  reducedMotion: boolean;
  deviceTier: DeviceTier;
  setProgress: (p: number) => void;
  setActiveSceneIndex: (i: number) => void;
  setLoading: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  setDeviceTier: (t: DeviceTier) => void;
}

export const timelineStore = createStore<TimelineState>((set) => ({
  progress: 0,
  activeSceneIndex: 0,
  isLoading: true,
  reducedMotion: false,
  deviceTier: "high",
  setProgress: (p) => set({ progress: p }),
  setActiveSceneIndex: (i) =>
    set((s) => (s.activeSceneIndex === i ? s : { activeSceneIndex: i })),
  setLoading: (v) => set({ isLoading: v }),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  setDeviceTier: (t) => set({ deviceTier: t }),
}));

/**
 * Reactive hook for LOW-FREQUENCY fields only (activeSceneIndex, isLoading, reducedMotion,
 * deviceTier). Never select `progress` here — it changes up to 60x/second and would force
 * a re-render every scroll frame. For progress, use getProgress()/subscribeProgress() below.
 */
export function useTimelineStore<T>(selector: (state: TimelineState) => T): T {
  return useStore(timelineStore, selector);
}

export function getProgress(): number {
  return timelineStore.getState().progress;
}

/** Transient subscription — fires outside React's render cycle, no re-render triggered. */
export function subscribeProgress(fn: (progress: number) => void): () => void {
  let prev = timelineStore.getState().progress;
  return timelineStore.subscribe((state) => {
    if (state.progress !== prev) {
      prev = state.progress;
      fn(state.progress);
    }
  });
}
