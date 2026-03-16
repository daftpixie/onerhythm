"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
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

const desktopNavLinkClass =
  "rounded-lg px-2.5 py-1.5 text-[0.8125rem] leading-tight text-text-secondary transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void";

const desktopSecondaryActionClass =
  "ml-1 rounded-lg border border-token px-2.5 py-1.5 text-[0.8125rem] leading-tight text-text-secondary transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void";

const desktopPrimaryActionClass =
  "ml-0.5 rounded-lg bg-pulse px-2.5 py-1.5 text-[0.8125rem] font-medium leading-tight text-text-primary shadow-pulse transition-colors duration-micro ease-out hover:bg-pulse-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void";

const mobileNavLinkClass =
  "rounded-xl px-3 py-3 text-sm text-text-secondary transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void";

const mobileSecondaryActionClass =
  "flex min-h-11 items-center justify-center rounded-xl border border-token px-4 py-3 text-sm text-text-secondary transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void";

const mobilePrimaryActionClass =
  "flex min-h-11 items-center justify-center rounded-xl bg-pulse px-4 py-3 text-sm font-medium text-text-primary shadow-pulse transition-colors duration-micro ease-out hover:bg-pulse-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void";

export function PublicSiteHeader() {
  const pathname = usePathname();
  const mobileMenuId = useId();
  const [session, setSession] = useState<SessionResponse>({
    authenticated: false,
    user: null,
    beta_access: "not_required",
  });
  const [sessionResolved, setSessionResolved] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMobileMenuOpen(false);

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

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const showPendingLink = session.authenticated && session.user && hasPendingBetaAccess(session);
  const showAppAccess = hasAppAccess(session);

  function renderAuthAction(mode: "desktop" | "mobile") {
    const className =
      mode === "desktop" ? desktopSecondaryActionClass : mobileSecondaryActionClass;
    const onClick = mode === "mobile" ? () => setMobileMenuOpen(false) : undefined;

    if (!sessionResolved) {
      return (
        <span
          aria-hidden="true"
          className={
            mode === "desktop"
              ? "ml-1 inline-block h-[2.125rem] w-[5rem] rounded-lg border border-token/60"
              : "inline-block h-11 w-full rounded-xl border border-token/60"
          }
        />
      );
    }

    if (showPendingLink) {
      return (
        <Link className={className} href={BETA_PENDING_PATH} onClick={onClick}>
          Beta status
        </Link>
      );
    }

    if (session.authenticated && session.user) {
      return (
        <Link
          className={className}
          href={session.user.profile_id ? "/account/data" : "/onboarding"}
          onClick={onClick}
        >
          {session.user.profile_id ? "Account" : "Finish setup"}
        </Link>
      );
    }

    return (
      <Link className={className} href="/sign-in" onClick={onClick}>
        Sign in
      </Link>
    );
  }

  function renderPrimaryCta(mode: "desktop" | "mobile") {
    const className = mode === "desktop" ? desktopPrimaryActionClass : mobilePrimaryActionClass;
    const onClick = mode === "mobile" ? () => setMobileMenuOpen(false) : undefined;

    if (!sessionResolved) {
      return (
        <span
          aria-hidden="true"
          className={
            mode === "desktop"
              ? "ml-0.5 inline-block h-[2.125rem] w-[6rem] rounded-lg bg-pulse/60"
              : "inline-block h-11 w-full rounded-xl bg-pulse/60"
          }
        />
      );
    }

    return (
      <Link
        className={className}
        href={
          showAppAccess ? "/contribute" : showPendingLink ? BETA_PENDING_PATH : "/#waitlist"
        }
        onClick={onClick}
      >
        {showAppAccess ? "Contribute" : showPendingLink ? "Beta status" : "Join beta"}
      </Link>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-token bg-deep-void/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-2 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between gap-3">
          <BrandLogo
            className="shrink-0 text-text-primary"
            priority
            size="header"
            variant="wordmark"
            wordmarkTone="gradient"
          />

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 lg:flex">
              <nav aria-label="Primary" className="flex items-center gap-0.5">
                {primaryLinks.map((link) => (
                  <Link className={desktopNavLinkClass} href={link.href} key={link.href}>
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-1">
                {renderAuthAction("desktop")}
                {renderPrimaryCta("desktop")}
              </div>
            </div>

            <ContrastToggle />
            <button
              aria-controls={mobileMenuId}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-token text-text-secondary transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void lg:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              type="button"
            >
              {mobileMenuOpen ? (
                <X aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Menu aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="lg:hidden">
            <div
              className="surface-panel-soft mt-3 flex flex-col gap-3 p-3"
              id={mobileMenuId}
              role="region"
              aria-label="Mobile menu"
            >
              <nav aria-label="Primary mobile" className="grid gap-1">
                {primaryLinks.map((link) => (
                  <Link
                    className={mobileNavLinkClass}
                    href={link.href}
                    key={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="grid gap-2 sm:grid-cols-2">
                {renderAuthAction("mobile")}
                {renderPrimaryCta("mobile")}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
