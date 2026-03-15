import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "onerhythm_session";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedPaths = ["/onboarding", "/education", "/account", "/research/pulse/for-you"];
  const isProtectedContributePath =
    (pathname === "/contribute" || pathname.startsWith("/contribute/")) &&
    !pathname.startsWith("/contribute/shared/");
  const isProtected =
    isProtectedContributePath ||
    protectedPaths.some((path) => pathname.startsWith(path));

  if (!isProtected) {
    return NextResponse.next();
  }

  if (request.cookies.get(SESSION_COOKIE_NAME)?.value) {
    return NextResponse.next();
  }

  const redirectUrl = new URL("/sign-in", request.url);
  redirectUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/onboarding/:path*",
    "/education/:path*",
    "/account/:path*",
    "/contribute",
    "/contribute/:path*",
    "/research/pulse/for-you",
    "/research/pulse/for-you/:path*",
  ],
};
