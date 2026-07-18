import type { ReactNode } from "react";
import { SCENES } from "../lib/scene-registry";

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
      <div className="flex min-w-0 flex-col justify-center px-6 pb-10 pt-2 sm:h-full sm:px-10 sm:pb-14 sm:pt-10">
        {children}
      </div>
    </section>
  );
}
