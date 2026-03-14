"use client";

import type {
  AnalyticsActorScope,
  AnalyticsEventInput,
  AnalyticsEventName,
  AnalyticsEventProperties,
} from "@onerhythm/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_ONERHYTHM_API_BASE_URL ?? "http://127.0.0.1:8000";
const ANALYTICS_ENDPOINT = `${API_BASE_URL}/v1/analytics/events`;
const VISITOR_ID_KEY = "onerhythm.analytics.visitor_id";
const SESSION_ID_KEY = "onerhythm.analytics.session_id";
const SURFACE_VISIT_PREFIX = "onerhythm.analytics.surface.";

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getOrCreateStorageId(storage: Storage, key: string): string {
  const existing = storage.getItem(key);
  if (existing) {
    return existing;
  }
  const next = crypto.randomUUID();
  storage.setItem(key, next);
  return next;
}

function sanitizeProperties(
  properties: AnalyticsEventProperties | undefined,
): AnalyticsEventInput["properties"] {
  if (!properties) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  );
}

function getVisitorId(): string | undefined {
  if (!hasLocalStorage()) {
    return undefined;
  }
  return getOrCreateStorageId(window.localStorage, VISITOR_ID_KEY);
}

function getSessionId(): string | undefined {
  if (
    typeof window === "undefined" ||
    typeof window.sessionStorage === "undefined"
  ) {
    return undefined;
  }
  return getOrCreateStorageId(window.sessionStorage, SESSION_ID_KEY);
}

export function trackEvent(input: {
  eventName: AnalyticsEventName;
  path: string;
  properties?: AnalyticsEventProperties;
  actorScope?: AnalyticsActorScope;
}): void {
  if (typeof window === "undefined") {
    return;
  }

  const payload: AnalyticsEventInput = {
    event_name: input.eventName,
    path: input.path,
    actor_scope: input.actorScope ?? "anonymous",
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
    properties: sanitizeProperties(input.properties),
  };
  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(ANALYTICS_ENDPOINT, blob)) {
        return;
      }
    }
  } catch {
    // Fall through to fetch.
  }

  void fetch(ANALYTICS_ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Best effort only.
  });
}

export function trackSurfaceVisit(input: {
  surface: string;
  path: string;
  viewedEvent: AnalyticsEventName;
  returnedEvent: AnalyticsEventName;
  properties?: AnalyticsEventProperties;
}): void {
  if (!hasLocalStorage()) {
    trackEvent({
      eventName: input.viewedEvent,
      path: input.path,
      properties: { ...input.properties, surface: input.surface, visit_count: 1 },
    });
    return;
  }

  const key = `${SURFACE_VISIT_PREFIX}${input.surface}`;
  const count = Number.parseInt(window.localStorage.getItem(key) ?? "0", 10) + 1;
  window.localStorage.setItem(key, String(count));

  trackEvent({
    eventName: count > 1 ? input.returnedEvent : input.viewedEvent,
    path: input.path,
    properties: { ...input.properties, surface: input.surface, visit_count: count },
  });
}
