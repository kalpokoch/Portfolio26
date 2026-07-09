import { profile, contact } from "../../content/profile";

export default function Hero() {
  return (
    <section
      aria-label="Hero"
      className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-6 text-center"
    >
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#8A96A8]">
        {profile.role}
      </p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#E8ECEF] sm:text-6xl md:text-7xl">
        {profile.name}
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#8A96A8] sm:text-lg">
        {profile.thesis.split(profile.heroStandout)[0]}
        <span className="font-mono text-[#3FD0C9]">{profile.heroStandout}</span>
        {profile.thesis.split(profile.heroStandout)[1]}
      </p>
      <nav aria-label="Contact links" className="mt-10 flex flex-wrap items-center justify-center gap-6 font-mono text-sm">
        <a
          href={`mailto:${contact.email}`}
          className="text-[#8A96A8] transition-colors hover:text-[#3FD0C9]"
        >
          {contact.email}
        </a>
        <a
          href={contact.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[#8A96A8] transition-colors hover:text-[#3FD0C9]"
        >
          {contact.github}
        </a>
        <a
          href={contact.linkedinUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[#8A96A8] transition-colors hover:text-[#3FD0C9]"
        >
          {contact.linkedin}
        </a>
      </nav>
    </section>
  );
}
