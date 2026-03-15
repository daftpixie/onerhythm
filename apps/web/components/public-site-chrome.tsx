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

export function PublicSiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const useInlineFooter = shouldUseInlineFooter(pathname);

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
