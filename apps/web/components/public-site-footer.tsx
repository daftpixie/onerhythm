import type { HTMLAttributes } from "react";
import Link from "next/link";

import { BrandLogo } from "./brand-logo";
import { siteContent } from "../content/site-copy";
import { webProductFlags } from "../lib/product-flags";

const footerGroups = webProductFlags.missionV3Enabled
  ? [
      {
        title: "Community",
        links: [
          { href: "/mission", label: "Mission" },
          { href: "/join", label: siteContent.navigation.primaryCta },
          ...(webProductFlags.legacyMosaicEnabled
            ? [{ href: "/mosaic", label: "Legacy Mosaic" }]
            : []),
        ],
      },
      {
        title: "Research",
        links: [
          { href: "/learn", label: "ResearchPulse" },
          { href: "/learn", label: "ResearchPulse feed" },
          { href: "/learn", label: "Your ResearchPulse" },
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
    ]
  : [
      {
        title: "Community",
        links: [
          { href: "/mosaic", label: "Heart Mosaic" },
          { href: "/mission", label: "Mission" },
          { href: "/#waitlist", label: "Join Beta Waitlist" },
        ],
      },
      {
        title: "Research",
        links: [
          { href: "/learn", label: "ResearchPulse" },
          { href: "/learn", label: "ResearchPulse feed" },
          { href: "/learn", label: "Your ResearchPulse" },
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
            {siteContent.footer.tagline}
          </p>
          <p className="mt-3 max-w-md text-sm leading-7 text-text-secondary">
            {siteContent.footer.body}
          </p>
        </div>

        {/* Link groups */}
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {footerGroups.map((group) => (
            <div className="space-y-3 text-center sm:text-left" key={group.title}>
              <p className="font-body text-sm font-semibold text-text-primary">
                {group.title}
              </p>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}`}>
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
        <p className="mt-4 text-center text-xs leading-6 text-text-tertiary sm:text-left">
          {siteContent.footer.supportNote}
        </p>
      </div>
    </footer>
  );
}
