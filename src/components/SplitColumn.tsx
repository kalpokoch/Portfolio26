import type { ReactNode } from "react";
import { SCENES } from "../lib/scene-registry";
import { useIsImmersive, useIsMobileImmersive } from "../lib/use-immersive";

interface SplitColumnProps {
  sceneId: string;
  railLabel: string;
  rail?: ReactNode;
  ariaLabel: string;
  children: ReactNode;
}

/**
 * The one structural device shared by every chapter: a narrow left "spine" (chapter number,
 * a vertical running label, optional meta) divided by a single hairline from the main content
 * column. No borders, no fills, no rounded corners — separation comes from whitespace and one
 * hairline rule, per the editorial direction.
 */
export default function SplitColumn({ sceneId, railLabel, rail, ariaLabel, children }: SplitColumnProps) {
  const index = SCENES.findIndex((s) => s.id === sceneId);
  const chapterNumber = String(index + 1).padStart(2, "0");
  const immersive = useIsImmersive();
  const mobileImmersive = useIsMobileImmersive();

  return (
    <section
      aria-label={ariaLabel}
      className="grid h-full w-full grid-cols-1 sm:grid-cols-[minmax(9rem,22%)_1px_1fr]"
    >
      <div className="flex flex-col gap-3 px-6 pb-6 pt-8 sm:relative sm:h-full sm:justify-between sm:px-8 sm:pb-10 sm:pt-10">
        <p className="type-meta">Ch. {chapterNumber}</p>
        {/* Absolutely centered so the running label sits mid-column whether or not the
            chapter provides extra rail content below. */}
        <p className="type-meta hidden rotate-180 [writing-mode:vertical-rl] sm:absolute sm:left-1/2 sm:top-1/2 sm:block sm:-translate-x-1/2 sm:-translate-y-1/2">
          {railLabel}
        </p>
        {rail && <div className="mt-auto flex flex-col gap-2">{rail}</div>}
      </div>
      <div className="hidden bg-[#EDEAE2]/[0.12] sm:block" aria-hidden="true" />
      <div
        className={`relative flex min-w-0 flex-col justify-center overflow-hidden px-6 pb-10 pt-2 sm:h-full sm:px-10 sm:pb-14 sm:pt-10 ${
          // Reserve the ChapterTracker's gutter (right-6 + widest label + dot) only in the
          // immersive path, where a sliding carousel card can otherwise travel far enough
          // right to visually collide with the fixed nav — the fallback stack has no
          // tracker, so it keeps the full column width.
          immersive ? "sm:pr-36" : ""
        }`}
      >
        {/* Recedes the cosmos background right behind the text block without adding any new
            graphic — a plain legibility scrim, confined to this column only. Desktop's
            two-column layout gets a directional gradient (background is to the right);
            mobile's single stacked column has no "side" for it to lean toward, so it gets a
            flat backing panel instead, behind the same text block. */}
        {immersive && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-full sm:block"
            style={{
              background:
                "linear-gradient(90deg, rgba(10,13,11,0.4) 0%, rgba(10,13,11,0.16) 45%, transparent 72%)",
            }}
          />
        )}
        {mobileImmersive && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: "rgba(10,13,11,0.32)" }}
          />
        )}
        <div className="relative">{children}</div>
      </div>
    </section>
  );
}
