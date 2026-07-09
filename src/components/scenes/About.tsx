import { profile } from "../../content/profile";
import { skills } from "../../content/skills";

export default function About() {
  const allSkills = Object.values(skills).flat();

  return (
    <section
      aria-label="About"
      className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-6 text-center"
    >
      <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-[#3FD0C9]">
        About
      </h2>
      <p className="mt-6 text-xl font-medium leading-relaxed text-[#E8ECEF] sm:text-2xl md:text-3xl">
        {profile.thesis}
      </p>
      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-xs text-[#8A96A8]">
        {allSkills.map((skill, i) => (
          <li key={skill}>
            {skill}
            {i < allSkills.length - 1 && <span className="ml-4 text-[#3FD0C9]/40">/</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
