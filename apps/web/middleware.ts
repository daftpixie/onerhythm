import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  buildLaunchUrl,
  getLaunchModeConfig,
  getRequestHost,
  isLaunchHost,
  LAUNCH_HOST_HEADER,
} from "./lib/launch-mode";

const SESSION_COOKIE_NAME = "onerhythm_session";
const PROTECTED_PATH_PREFIXES = [
  "/onboarding",
  "/education",
  "/account",
  "/about/account",
  "/research/pulse/for-you",
] as const;
const BYPASS_PATH_PREFIXES = ["/api", "/_next", "/health"] as const;

function isProtectedPath(pathname: string): boolean {
  const isProtectedContributePath =
    (pathname === "/contribute" || pathname.startsWith("/contribute/")) &&
    !pathname.startsWith("/contribute/shared/");

  return isProtectedContributePath || PROTECTED_PATH_PREFIXES.some((path) => pathname.startsWith(path));
}

function isBypassPath(pathname: string): boolean {
  return BYPASS_PATH_PREFIXES.some((path) => pathname.startsWith(path)) || /\.[^/]+$/.test(pathname);
}

function buildRequestHeaders(request: NextRequest, launchHostRequest: boolean): Headers {
  const headers = new Headers(request.headers);

  if (launchHostRequest) {
    headers.set(LAUNCH_HOST_HEADER, "1");
  }

  return headers;
}

function withLaunchHostHeader(response: NextResponse, launchHostRequest: boolean): NextResponse {
  if (launchHostRequest) {
    response.headers.set(LAUNCH_HOST_HEADER, "1");
  }

  return response;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const launchConfig = getLaunchModeConfig();
  const requestHost = getRequestHost(request.headers) ?? request.nextUrl.host;
  const launchHostRequest = isLaunchHost(requestHost, launchConfig);
  const requestHeaders = buildRequestHeaders(request, launchHostRequest);

  if (isBypassPath(pathname)) {
    return withLaunchHostHeader(
      NextResponse.next({ request: { headers: requestHeaders } }),
      launchHostRequest,
    );
  }

  if (launchHostRequest) {
    if (pathname === "/launch") {
      return withLaunchHostHeader(NextResponse.redirect(new URL("/", request.url)), true);
    }

    if (pathname === "/") {
      return withLaunchHostHeader(
        NextResponse.rewrite(new URL("/launch", request.url), {
          request: { headers: requestHeaders },
        }),
        true,
      );
    }

    return withLaunchHostHeader(NextResponse.redirect(new URL("/", request.url)), true);
  }

  if (launchConfig.enabled) {
    return NextResponse.redirect(buildLaunchUrl("/", launchConfig));
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (request.cookies.get(SESSION_COOKIE_NAME)?.value) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const redirectUrl = new URL("/sign-in", request.url);
  redirectUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
