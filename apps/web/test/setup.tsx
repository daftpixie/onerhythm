import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, vi } from "vitest";

export const mockRouter = {
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
};

export const navigationState = {
  pathname: "/",
  searchParams: new URLSearchParams(),
};

export const navigationMocks = {
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
};

export const requestHeaderState = new Headers();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href?: unknown;
  }) => {
    const hrefObject =
      href && typeof href === "object"
        ? (href as { pathname?: unknown })
        : undefined;
    const resolvedHref =
      typeof href === "string"
        ? href
        : hrefObject
          ? String(hrefObject.pathname ?? "#")
          : "#";

    return (
    <a
      href={resolvedHref}
      {...props}
    >
      {children}
    </a>
    );
  },
}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    priority: _priority,
    src,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    priority?: boolean;
    src?: unknown;
  }) => {
    const resolvedSrc = typeof src === "string" ? src : "";
    return <img alt={alt} src={resolvedSrc} {...props} />;
  },
}));

vi.mock("next/navigation", () => ({
  notFound: () => navigationMocks.notFound(),
  redirect: (url: string) => navigationMocks.redirect(url),
  usePathname: () => navigationState.pathname,
  useRouter: () => mockRouter,
  useSearchParams: () => navigationState.searchParams,
}));

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(requestHeaderState),
}));

afterEach(() => {
  cleanup();
  navigationState.pathname = "/";
  navigationState.searchParams = new URLSearchParams();
  requestHeaderState.forEach((_, key) => requestHeaderState.delete(key));
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
