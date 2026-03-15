import type { HTMLAttributes } from "react";
import Link from "next/link";

import { BrandLogo } from "./brand-logo";

const footerGroups = [
  {
    title: "Community",
    links: [
      { href: "/community", label: "Community Hub" },
      { href: "/mosaic", label: "Heart Mosaic" },
      { href: "/community/stories", label: "Community Stories" },
      { href: "/#waitlist", label: "Join Beta Waitlist" },
    ],
  },
  {
    title: "Research",
    links: [
      { href: "/evidence", label: "Evidence Hub" },
      { href: "/research/pulse", label: "Research Pulse" },
      { href: "/research/pulse/for-you", label: "Research Pulse For You" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: "/about", label: "About" },
      { href: "/mission", label: "Mission" },
      { href: "https://github.com/daftpixie/onerhythm", label: "Open Source (GitHub)" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "tel:988", label: "988 Crisis Lifeline" },
      { href: "sms:741741", label: "Crisis Text Line" },
    ],
  },
];

export type PublicSiteFooterProps = HTMLAttributes<HTMLElement>;

export function PublicSiteFooter({
  className = "",
  ...props
}: PublicSiteFooterProps) {
  return (
    <footer
      className={["relative z-10 w-full border-t border-token bg-midnight", className].join(" ")}
      {...props}
    >
      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10 lg:px-12">
        {/* Brand + tagline — centered */}
        <div className="flex flex-col items-center text-center">
          <BrandLogo
            className="px-0 py-0 hover:bg-transparent"
            size="footer"
            variant="wordmark"
            wordmarkTone="gradient"
          />
          <p className="mt-4 max-w-sm text-sm italic leading-6 text-text-secondary">
            Every heartbeat has a story. Every story deserves to be heard.
          </p>
          <p className="mt-3 max-w-md text-sm leading-7 text-text-secondary">
            OneRhythm exists because the psychological weight of arrhythmia is
            real, measurable, and too often carried alone. This platform brings
            that reality into public view - through community, education, and a
            shared refusal to fight invisible battles in silence.
          </p>
        </div>

        {/* Link groups */}
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {footerGroups.map((group) => (
            <div className="space-y-3 text-center sm:text-left" key={group.title}>
              <p className="font-display text-sm font-semibold text-text-primary">
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
          <p>&copy; {new Date().getFullYear()} OneRhythm. Open source. Mission-driven.</p>
          <p className="font-mono tracking-wide">#InvisibleBears</p>
        </div>
      </div>
    </footer>
  );
}
