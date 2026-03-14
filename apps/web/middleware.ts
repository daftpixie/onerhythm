import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "onerhythm_session";

export function middleware(request: NextRequest) {
  const protectedPaths = ["/onboarding", "/education", "/account"];
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!isProtected) {
    return NextResponse.next();
  }

  if (request.cookies.get(SESSION_COOKIE_NAME)?.value) {
    return NextResponse.next();
  }

  const redirectUrl = new URL("/sign-in", request.url);
  redirectUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/onboarding/:path*", "/education/:path*", "/account/:path*"],
};
