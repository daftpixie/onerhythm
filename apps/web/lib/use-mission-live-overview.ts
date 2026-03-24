"use client";

import { useEffect, useState } from "react";

import type { MissionOverview } from "@onerhythm/types";

import {
  getMissionLiveStreamUrl,
  getMissionOverview,
  hydrateMissionOverviewPayload,
} from "./mission-v3-api";
import { hasMeaningfulMissionTimestamp } from "./mission-v3-overview";

const configuredPollingIntervalMs = Number(
  process.env.NEXT_PUBLIC_MISSION_LIVE_POLL_INTERVAL_MS ?? "15000",
);
const POLLING_INTERVAL_MS = Number.isFinite(configuredPollingIntervalMs)
  ? configuredPollingIntervalMs
  : 15000;

export type MissionLiveTransport = "connecting" | "live" | "polling";

export function useMissionLiveOverview(initialOverview: MissionOverview) {
  const [overview, setOverview] = useState(initialOverview);
  const [transport, setTransport] = useState<MissionLiveTransport>("connecting");
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(() =>
    hasMeaningfulMissionTimestamp(initialOverview.generated_at)
      ? initialOverview.generated_at
      : null,
  );
  const [now, setNow] = useState(() =>
    hasMeaningfulMissionTimestamp(initialOverview.generated_at)
      ? new Date(initialOverview.generated_at).getTime()
      : Date.now(),
  );

  useEffect(() => {
    let pollingTimer: number | null = null;
    let eventSource: EventSource | null = null;
    let fallbackStarted = false;

    function applyOverview(nextOverview: MissionOverview) {
      const hydrated = hydrateMissionOverviewPayload(nextOverview);
      setOverview((current) =>
        current.snapshot_version === hydrated.snapshot_version ? current : hydrated,
      );
      setLastSyncAt(
        hasMeaningfulMissionTimestamp(hydrated.generated_at) ? hydrated.generated_at : null,
      );
    }

    async function refreshWithPolling() {
      try {
        const nextOverview = await getMissionOverview();
        applyOverview(nextOverview);
      } catch {
        // Keep the last known snapshot visible when the refresh path is unavailable.
      }
    }

    function startPollingFallback() {
      if (fallbackStarted) {
        return;
      }
      fallbackStarted = true;
      setTransport("polling");
      void refreshWithPolling();
      pollingTimer = window.setInterval(() => {
        void refreshWithPolling();
      }, POLLING_INTERVAL_MS);
    }

    if (typeof window === "undefined") {
      return undefined;
    }

    if (typeof EventSource !== "undefined") {
      eventSource = new EventSource(getMissionLiveStreamUrl());
      eventSource.addEventListener("open", () => {
        setTransport("live");
      });
      eventSource.addEventListener("mission.snapshot", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent<string>).data) as MissionOverview;
          applyOverview(payload);
          setTransport("live");
        } catch {
          startPollingFallback();
        }
      });
      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        startPollingFallback();
      };
    } else {
      startPollingFallback();
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (pollingTimer !== null) {
        window.clearInterval(pollingTimer);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, Math.max(5000, Math.round(POLLING_INTERVAL_MS / 2)));

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const syncAgeMs = lastSyncAt ? Math.max(now - new Date(lastSyncAt).getTime(), 0) : 0;
  const isStale = lastSyncAt ? syncAgeMs > POLLING_INTERVAL_MS * 3 : false;

  return {
    overview,
    transport,
    lastSyncAt,
    isStale,
  };
}
