import Link from "next/link";

import { BrandLogo } from "./brand-logo";
import { ContrastToggle } from "./contrast-toggle";

const primaryLinks = [
  { href: "/about", label: "About" },
  { href: "/mission", label: "Mission" },
  { href: "/evidence", label: "Research & Evidence" },
  { href: "/learn", label: "Educational Hub" },
  { href: "/community", label: "Community" },
];

export function PublicSiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-token bg-deep-void/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-6 py-2 sm:px-10 lg:px-12">
        <BrandLogo className="shrink-0 text-text-primary" priority size="header" variant="wordmark" />

        <nav aria-label="Primary" className="flex items-center gap-0.5">
          {primaryLinks.map((link) => (
            <Link
              className="rounded-lg px-2.5 py-1.5 text-[0.8125rem] leading-tight text-text-secondary transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
          <ContrastToggle />
          <Link
            className="ml-1 rounded-lg border border-token px-2.5 py-1.5 text-[0.8125rem] leading-tight text-text-secondary transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void"
            href="/sign-in"
          >
            Sign in
          </Link>
          <Link
            className="ml-0.5 rounded-lg bg-pulse px-2.5 py-1.5 text-[0.8125rem] font-medium leading-tight text-text-primary shadow-pulse transition-colors duration-micro ease-out hover:bg-pulse-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void"
            href="/sign-up"
          >
            Join OneRhythm
          </Link>
        </nav>
      </div>
    </header>
  );
}
