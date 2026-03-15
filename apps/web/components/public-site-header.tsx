"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { BrandLogo } from "./brand-logo";
import { ContrastToggle } from "./contrast-toggle";
import { getSession, type SessionResponse } from "../lib/auth-api";
import { BETA_PENDING_PATH, hasAppAccess, hasPendingBetaAccess } from "../lib/beta-access";

const primaryLinks = [
  { href: "/community", label: "Community" },
  { href: "/mosaic", label: "Mosaic" },
  { href: "/evidence", label: "Research" },
  { href: "/stories", label: "Stories" },
  { href: "/about", label: "About" },
];

export function PublicSiteHeader() {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionResponse>({
    authenticated: false,
    user: null,
    beta_access: "not_required",
  });
  const [sessionResolved, setSessionResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const nextSession = await getSession();
        if (!cancelled) {
          setSession(nextSession);
          setSessionResolved(true);
        }
      } catch {
        if (!cancelled) {
          setSession({ authenticated: false, user: null, beta_access: "not_required" });
          setSessionResolved(true);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const showPendingLink = session.authenticated && session.user && hasPendingBetaAccess(session);
  const showAppAccess = hasAppAccess(session);
  const authAction = !sessionResolved ? (
    <span
      aria-hidden="true"
      className="ml-1 inline-block h-[2.125rem] w-[5rem] rounded-lg border border-token/60"
    />
  ) : showPendingLink ? (
    <Link
      className="ml-1 rounded-lg border border-token px-2.5 py-1.5 text-[0.8125rem] leading-tight text-text-secondary transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void"
      href={BETA_PENDING_PATH}
    >
      Beta status
    </Link>
  ) : session.authenticated && session.user ? (
    <Link
      className="ml-1 rounded-lg border border-token px-2.5 py-1.5 text-[0.8125rem] leading-tight text-text-secondary transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void"
      href={session.user.profile_id ? "/account/data" : "/onboarding"}
    >
      {session.user.profile_id ? "Account" : "Finish setup"}
    </Link>
  ) : (
    <Link
      className="ml-1 rounded-lg border border-token px-2.5 py-1.5 text-[0.8125rem] leading-tight text-text-secondary transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void"
      href="/sign-in"
    >
      Sign in
    </Link>
  );

  const primaryCta = !sessionResolved ? (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block h-[2.125rem] w-[6rem] rounded-lg bg-pulse/60"
    />
  ) : (
    <Link
      className="ml-0.5 rounded-lg bg-pulse px-2.5 py-1.5 text-[0.8125rem] font-medium leading-tight text-text-primary shadow-pulse transition-colors duration-micro ease-out hover:bg-pulse-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void"
      href={
        showAppAccess ? "/contribute" : showPendingLink ? BETA_PENDING_PATH : "/#waitlist"
      }
    >
      {showAppAccess ? "Contribute" : showPendingLink ? "Beta status" : "Join beta"}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-token bg-deep-void/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-6 py-2 sm:px-10 lg:px-12">
        <BrandLogo
          className="shrink-0 text-text-primary"
          priority
          size="header"
          variant="wordmark"
          wordmarkTone="gradient"
        />

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
          {authAction}
          {primaryCta}
        </nav>
      </div>
    </header>
  );
}
