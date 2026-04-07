"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PublicSiteFooter } from "./public-site-footer";
import { PublicSiteHeader } from "./public-site-header";

function shouldUseInlineFooter(pathname: string): boolean {
  return (
    pathname === "/sign-in" ||
    pathname === "/sign-up" ||
    pathname === "/onboarding" ||
    pathname === "/stories" ||
    pathname.startsWith("/stories/")
  );
}

function shouldHidePublicChrome(pathname: string, isLaunchHost: boolean): boolean {
  return isLaunchHost || pathname === "/launch";
}

export function PublicSiteChrome({
  children,
  isLaunchHost = false,
}: {
  children: ReactNode;
  isLaunchHost?: boolean;
}) {
  const pathname = usePathname() ?? "/";
  const hidePublicChrome = shouldHidePublicChrome(pathname, isLaunchHost);
  const useInlineFooter = shouldUseInlineFooter(pathname);

  if (hidePublicChrome) {
    return (
      <div id="main-content" className="flex min-h-0 flex-1 flex-col">
        {children}
      </div>
    );
  }

  return (
    <>
      <PublicSiteHeader />
      <div id="main-content" className="flex min-h-0 flex-1 flex-col">
        {children}
        {!useInlineFooter ? (
          <div className="mt-auto">
            <PublicSiteFooter />
          </div>
        ) : null}
      </div>
    </>
  );
}
