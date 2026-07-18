import { useRef } from "react";
import { contact } from "../content/profile";
import { education, certifications } from "../content/skills";
import { useSceneProgress } from "../lib/use-scene-progress";
import { scrollReveal, scrollSettle } from "../lib/scroll-reveal";
import { sceneInnerLocal } from "../lib/scene-registry";
import { useIsImmersive } from "../lib/use-immersive";
import SplitColumn from "../components/SplitColumn";

const LINKS: { label: string; value: string; href: string }[] = [
  { label: "Email", value: contact.email, href: `mailto:${contact.email}` },
  { label: "Phone", value: contact.phone, href: `tel:${contact.phone.replace(/\s+/g, "")}` },
  { label: "Site", value: contact.site, href: `https://${contact.site}` },
  { label: "LinkedIn", value: contact.linkedin, href: contact.linkedinUrl },
  { label: "GitHub", value: contact.github, href: contact.githubUrl },
];

export default function ContactScene() {
  const immersive = useIsImmersive();
  const linksRef = useRef<HTMLDivElement | null>(null);
  const educationRef = useRef<HTMLDivElement | null>(null);
  const certsRef = useRef<HTMLDivElement | null>(null);
  const closingRef = useRef<HTMLParagraphElement | null>(null);

  useSceneProgress(
    "contact",
    (local) => {
      const inner = sceneInnerLocal(local, "contact");
      scrollReveal(linksRef.current, inner, 0, 1, 14);
      scrollSettle(educationRef.current, inner);
      scrollSettle(certsRef.current, inner);
      scrollReveal(closingRef.current, inner, 1, 2, 10);
    },
    immersive,
  );

  return (
    <SplitColumn sceneId="contact" ariaLabel="Contact" railLabel="Contact" rail={<p className="type-meta">{contact.location}</p>}>
      <h1 className="type-headline">{contact.location}</h1>
      <p className="type-statement mt-5 max-w-md">
        Open to ML engineering roles, applied research, and product-focused AI work. Resume
        available on request.
      </p>

      <div ref={linksRef} className="mt-9 flex flex-col gap-2">
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={link.href.startsWith("http") ? "noreferrer" : undefined}
            className="signal-link type-meta inline-block w-fit text-[#EDEAE2]"
          >
            {link.label} <span className="divider">/</span> {link.value}
          </a>
        ))}
      </div>

      <div ref={educationRef} className="hairline mt-10 max-w-2xl pt-8">
        <p className="type-meta">Education</p>
        <p className="mt-3 type-headline !text-2xl">{education.institution}</p>
        <p className="type-meta mt-2">
          {education.degree} · {education.dates}
        </p>
        <p className="type-statement mt-4">
          {education.coursework.map((item, i) => (
            <span key={item}>
              {item}
              {i < education.coursework.length - 1 && <span className="divider">/</span>}
            </span>
          ))}
        </p>
      </div>

      <div ref={certsRef} className="hairline mt-8 max-w-2xl pt-6">
        <p className="type-meta">Certifications</p>
        <div className="mt-3 flex flex-col gap-2">
          {certifications.map((cert) => (
            <p key={cert.name} className="type-statement">
              {cert.name} <span className="divider">/</span> {cert.issuer} · {cert.date}
            </p>
          ))}
        </div>
      </div>

      <p ref={closingRef} className="hairline mt-10 max-w-2xl pt-6 type-meta">
        That's the signal, end to end. Thanks for scrolling this far.
      </p>
    </SplitColumn>
  );
}
