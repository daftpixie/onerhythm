"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import type { AnalyticsEventName, AnalyticsEventProperties } from "@onerhythm/types";

import { trackEvent, trackSurfaceVisit } from "../lib/analytics";

type AnalyticsPageViewProps = {
  eventName?: AnalyticsEventName;
  surface?: string;
  viewedEvent?: AnalyticsEventName;
  returnedEvent?: AnalyticsEventName;
  properties?: AnalyticsEventProperties;
};

export function AnalyticsPageView({
  eventName,
  surface,
  viewedEvent,
  returnedEvent,
  properties,
}: AnalyticsPageViewProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) {
      return;
    }

    if (surface && viewedEvent && returnedEvent) {
      trackSurfaceVisit({
        surface,
        path: pathname,
        viewedEvent,
        returnedEvent,
        properties,
      });
      return;
    }

    if (eventName) {
      trackEvent({
        eventName,
        path: pathname,
        properties,
      });
    }
  }, [eventName, pathname, properties, returnedEvent, surface, viewedEvent]);

  return null;
}
