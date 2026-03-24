"use client";

import { useEffect, useRef } from "react";

import type { MissionScenePerformanceTier } from "@onerhythm/types";

import { trackEvent, trackSurfaceVisit } from "./analytics";

type MissionSceneTelemetryOptions = {
  compactView: boolean;
  coarsePointer: boolean;
  fallbackReason: string | null;
  reducedMotion: boolean;
  transport: "connecting" | "live" | "polling";
  webglSupported: boolean;
};

type MissionSceneLoadedPayload = {
  performanceTier: MissionScenePerformanceTier;
  fpsEstimate: number;
};

export function useMissionSceneTelemetry(options: MissionSceneTelemetryOptions) {
  const fallbackReasonsRef = useRef<Set<string>>(new Set());
  const loadedRef = useRef(false);
  const degradedRef = useRef(false);
  const visitTrackedRef = useRef(false);

  useEffect(() => {
    if (visitTrackedRef.current) {
      return;
    }
    visitTrackedRef.current = true;
    trackSurfaceVisit({
      surface: "mission-control",
      path: "/mission",
      viewedEvent: "mission_control_viewed",
      returnedEvent: "mission_control_returned",
      properties: {
        reduced_motion: options.reducedMotion,
        compact_view: options.compactView,
        coarse_pointer: options.coarsePointer,
        webgl_supported: options.webglSupported,
      },
    });
  }, [options.compactView, options.coarsePointer, options.reducedMotion, options.webglSupported]);

  useEffect(() => {
    if (!options.fallbackReason || fallbackReasonsRef.current.has(options.fallbackReason)) {
      return;
    }

    fallbackReasonsRef.current.add(options.fallbackReason);
    trackEvent({
      eventName: "mission_scene_fallback_used",
      path: "/mission",
      properties: {
        fallback_reason: options.fallbackReason,
        reduced_motion: options.reducedMotion,
        compact_view: options.compactView,
        coarse_pointer: options.coarsePointer,
        webgl_supported: options.webglSupported,
        transport: options.transport,
      },
    });
  }, [
    options.compactView,
    options.coarsePointer,
    options.fallbackReason,
    options.reducedMotion,
    options.transport,
    options.webglSupported,
  ]);

  function handleSceneLoaded(payload: MissionSceneLoadedPayload) {
    if (!loadedRef.current) {
      trackEvent({
        eventName: "mission_scene_loaded",
        path: "/mission",
        properties: {
          performance_tier: payload.performanceTier,
          reduced_motion: options.reducedMotion,
          compact_view: options.compactView,
          coarse_pointer: options.coarsePointer,
          webgl_supported: options.webglSupported,
          transport: options.transport,
          source_kind: "mission_control",
          source_reference_id: "phase5",
          status: Math.round(payload.fpsEstimate).toString(),
        },
      });
      loadedRef.current = true;
    }

    if (
      !degradedRef.current &&
      (payload.performanceTier === "conservative" || payload.performanceTier === "fallback")
    ) {
      degradedRef.current = true;
      trackEvent({
        eventName: "mission_scene_degraded",
        path: "/mission",
        properties: {
          performance_tier: payload.performanceTier,
          reduced_motion: options.reducedMotion,
          compact_view: options.compactView,
          coarse_pointer: options.coarsePointer,
          webgl_supported: options.webglSupported,
          transport: options.transport,
        },
      });
    }
  }

  function handleSceneInteraction(interactionKind: string, waypointKey?: string | null) {
    trackEvent({
      eventName: "mission_scene_interaction",
      path: "/mission",
      properties: {
        interaction_kind: interactionKind,
        waypoint_key: waypointKey ?? undefined,
        reduced_motion: options.reducedMotion,
        compact_view: options.compactView,
        transport: options.transport,
      },
    });
  }

  function handleSceneError(reason: string) {
    trackEvent({
      eventName: "mission_scene_error",
      path: "/mission",
      properties: {
        fallback_reason: reason,
        reduced_motion: options.reducedMotion,
        compact_view: options.compactView,
        coarse_pointer: options.coarsePointer,
        webgl_supported: options.webglSupported,
        transport: options.transport,
      },
    });
  }

  return {
    handleSceneError,
    handleSceneInteraction,
    handleSceneLoaded,
  };
}
