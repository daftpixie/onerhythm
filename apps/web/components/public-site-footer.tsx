import Link from "next/link";

import { BrandLogo } from "./brand-logo";

const footerGroups = [
  {
    title: "Platform",
    links: [
      { href: "/about", label: "About" },
      { href: "/mission", label: "Mission" },
      { href: "/community", label: "Heart Mosaic" },
      { href: "/learn", label: "Educational Hub" },
    ],
  },
  {
    title: "Content",
    links: [
      { href: "/community/stories", label: "Stories" },
      { href: "/research/pulse", label: "Research Pulse" },
      { href: "/evidence", label: "Evidence & Provenance" },
      { href: "/learn", label: "Support Resources" },
    ],
  },
  {
    title: "Open source",
    links: [
      { href: "https://github.com/daftpixie/onerhythm", label: "Repository" },
      { href: "https://github.com/daftpixie/onerhythm/blob/main/README.md", label: "README" },
      { href: "https://github.com/daftpixie/onerhythm/blob/main/CONTRIBUTING.md", label: "Contributing" },
      { href: "https://github.com/daftpixie/onerhythm/blob/main/docs/architecture/release-checklist.md", label: "Release Notes" },
    ],
  },
];

export function PublicSiteFooter() {
  return (
    <footer className="border-t border-token">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-12">
        {/* Brand + tagline — centered */}
        <div className="flex flex-col items-center text-center">
          <BrandLogo
            className="px-0 py-0 hover:bg-transparent"
            size="footer"
            variant="wordmark"
          />
          <p className="mt-4 max-w-md text-sm italic leading-6 text-text-secondary">
            Every heartbeat has a story. Every story deserves to be heard.
          </p>
          <p className="mt-3 max-w-lg text-sm leading-7 text-text-secondary">
            OneRhythm exists because the psychological weight of arrhythmia is
            real, measurable, and too often carried alone. This platform brings
            that reality into public view — through community, education, and a
            shared refusal to fight invisible battles in silence.
          </p>
          <p className="mt-3 font-mono text-xs text-text-tertiary">
            You are not alone in this.
          </p>
        </div>

        {/* Link groups */}
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div className="space-y-3 text-center sm:text-left" key={group.title}>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                {group.title}
              </p>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      className="text-sm leading-6 text-text-secondary transition-colors duration-micro ease-out hover:text-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="surface-rule mt-8" />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-text-tertiary">
          <p>&copy; {new Date().getFullYear()} OneRhythm. Open source. Mission-driven. Ad Astra Per Aspera.</p>
          <p className="font-mono tracking-wide">#InvisibleBears</p>
        </div>
      </div>
    </footer>
  );
}
