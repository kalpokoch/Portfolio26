import { contact } from "../../content/profile";
import { education, certifications } from "../../content/skills";

const LINKS: { label: string; value: string; href: string }[] = [
  { label: "Email", value: contact.email, href: `mailto:${contact.email}` },
  { label: "Phone", value: contact.phone, href: `tel:${contact.phone.replace(/\s+/g, "")}` },
  { label: "Site", value: contact.site, href: `https://${contact.site}` },
  { label: "LinkedIn", value: contact.linkedin, href: contact.linkedinUrl },
  { label: "GitHub", value: contact.github, href: contact.githubUrl },
];

export default function Contact() {
  return (
    <section
      aria-label="Contact"
      className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-6 text-center"
    >
      <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-[#3FD0C9]">
        Contact
      </h2>
      <p className="mt-4 font-mono text-sm text-[#8A96A8]">{contact.location}</p>
      <dl className="mt-8 flex flex-col gap-4">
        {LINKS.map((link) => (
          <div key={link.label} className="flex items-baseline justify-center gap-4">
            <dt className="w-20 text-right font-mono text-xs uppercase tracking-wide text-[#8A96A8]">
              {link.label}
            </dt>
            <dd>
              <a
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                className="font-mono text-base text-[#E8ECEF] transition-colors hover:text-[#3FD0C9]"
              >
                {link.value}
              </a>
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-10 flex flex-col items-center gap-1 font-mono text-xs text-[#8A96A8]">
        <p>
          {education.institution} — {education.degree} — {education.dates}
        </p>
        {certifications.map((cert) => (
          <p key={cert.name}>
            {cert.name} — {cert.issuer} — {cert.date}
          </p>
        ))}
      </div>
    </section>
  );
}
