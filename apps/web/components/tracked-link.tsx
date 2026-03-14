"use client";

import Link from "next/link";

import type { AnalyticsEventName, AnalyticsEventProperties } from "@onerhythm/types";

import { trackEvent } from "../lib/analytics";

type TrackedLinkProps = React.ComponentProps<typeof Link> & {
  analyticsEventName: AnalyticsEventName;
  analyticsProperties?: AnalyticsEventProperties;
};

export function TrackedLink({
  analyticsEventName,
  analyticsProperties,
  href,
  onClick,
  ...props
}: TrackedLinkProps) {
  const destinationPath = typeof href === "string" ? href : href.pathname ?? "/";

  return (
    <Link
      {...props}
      href={href}
      onClick={(event) => {
        trackEvent({
          eventName: analyticsEventName,
          path: window.location.pathname,
          properties: {
            destination_path: destinationPath,
            ...analyticsProperties,
          },
        });
        onClick?.(event);
      }}
    />
  );
}
