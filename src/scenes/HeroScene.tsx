import { useRef } from "react";
import { profile, contact } from "../content/profile";
import { useSceneProgress } from "../lib/use-scene-progress";
import { scrollParallax } from "../lib/scroll-reveal";
import { useIsImmersive } from "../lib/use-immersive";
import SplitColumn from "../components/SplitColumn";

export default function HeroScene() {
  const immersive = useIsImmersive();

  const firstNameRef = useRef<HTMLSpanElement | null>(null);
  const lastNameRef = useRef<HTMLSpanElement | null>(null);
  const thesisRef = useRef<HTMLParagraphElement | null>(null);
  const tagsRef = useRef<HTMLParagraphElement | null>(null);

  // Hero is visible from local=0 (SceneStage never fades it in from zero), so scroll here
  // drives parallax drift, not a fade-in — the fade-in instead plays once, on mount, below.
  useSceneProgress(
    "hero",
    (local) => {
      scrollParallax(firstNameRef.current, local, 18);
      scrollParallax(lastNameRef.current, local, 30);
      scrollParallax(thesisRef.current, local, 14);
      scrollParallax(tagsRef.current, local, 8);
    },
    immersive,
  );

  const [beforeStandout, afterStandout] = profile.thesis.split(profile.heroStandout);
  const [firstName, ...restName] = profile.name.split(" ");

  return (
    <SplitColumn
      sceneId="hero"
      ariaLabel="Hero"
      railLabel={profile.role}
      rail={
        <>
          <a href={`mailto:${contact.email}`} className="type-meta rail-link">
            {contact.email}
          </a>
          <a href={contact.githubUrl} target="_blank" rel="noreferrer" className="type-meta rail-link">
            {contact.github}
          </a>
          <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" className="type-meta rail-link">
            {contact.linkedin}
          </a>
        </>
      }
    >
      <h1 className="type-display">
        <span ref={firstNameRef} className="mount-reveal block" style={{ animationDelay: "0.1s" }}>
          {firstName}
        </span>
        <span ref={lastNameRef} className="mount-reveal block" style={{ animationDelay: "0.24s" }}>
          {restName.join(" ")}
        </span>
      </h1>
      <p
        ref={thesisRef}
        className="type-statement mount-reveal mt-8 max-w-2xl"
        style={{ animationDelay: "0.42s" }}
      >
        {beforeStandout}
        <span className="text-[#8FBFA3]">{profile.heroStandout}</span>
        {afterStandout}
      </p>
      <p ref={tagsRef} className="type-meta mount-reveal mt-8" style={{ animationDelay: "0.56s" }}>
        Healthcare AI<span className="divider">/</span>Audio Intelligence
        <span className="divider">/</span>NLP Systems
      </p>
    </SplitColumn>
  );
}
