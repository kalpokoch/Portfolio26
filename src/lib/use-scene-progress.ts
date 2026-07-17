import { useEffect, useRef } from "react";
import { subscribeProgress } from "../store/timeline-store";
import { sceneLocalProgress } from "./scene-registry";

/**
 * Subscribes a scene to its own local progress slice (0..1 within that scene's range)
 * without ever knowing about neighboring scenes. The callback ref avoids resubscribing
 * on every render — only `sceneId`/`enabled` changes trigger a fresh subscription.
 */
export function useSceneProgress(
  sceneId: string,
  onProgress: (local: number, globalProgress: number) => void,
  enabled = true,
): void {
  const callbackRef = useRef(onProgress);
  callbackRef.current = onProgress;

  useEffect(() => {
    if (!enabled) return;
    return subscribeProgress((progress) => {
      callbackRef.current(sceneLocalProgress(progress, sceneId), progress);
    });
  }, [sceneId, enabled]);
}
