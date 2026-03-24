"use client";

import { useEffect, useState } from "react";

import type { MissionSegmentsWindow, MissionSegmentsWindowMode } from "@onerhythm/types";

import { getMissionSegmentsWindow } from "./mission-v3-api";

export function useMissionSegmentsWindow(
  initialWindow: MissionSegmentsWindow,
  snapshotVersion: string,
  mode: MissionSegmentsWindowMode = "recent",
  limit = 64,
) {
  const [segmentsWindow, setSegmentsWindow] = useState(initialWindow);

  useEffect(() => {
    let cancelled = false;

    async function refreshSegmentsWindow() {
      try {
        const nextWindow = await getMissionSegmentsWindow(mode, limit);
        if (cancelled) {
          return;
        }
        setSegmentsWindow((current) =>
          current.snapshot_version === nextWindow.snapshot_version &&
          current.mode === nextWindow.mode &&
          current.limit === nextWindow.limit
            ? current
            : nextWindow,
        );
      } catch {
        // Keep the last successful public segment window visible if the refresh path fails.
      }
    }

    void refreshSegmentsWindow();

    return () => {
      cancelled = true;
    };
  }, [limit, mode, snapshotVersion]);

  return segmentsWindow;
}
