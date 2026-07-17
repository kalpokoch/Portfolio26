import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export { ScrollTrigger };

export function createLenis(): { lenis: Lenis; destroy: () => void } {
  const lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
    syncTouch: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  const tick = (time: number) => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return {
    lenis,
    destroy: () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    },
  };
}
