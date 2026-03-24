import type {
  MissionActivityStats,
  MissionOverview,
  MissionRhythmTypeStats,
} from "@onerhythm/types";

export function buildEmptyMissionOverview(): MissionOverview {
  return {
    aggregate: {
      aggregate_key: "global",
      total_contributions: 0,
      total_distance_m: 0,
      total_distance_km: 0,
      countries_represented: 0,
      earth_progress_pct: 0,
      moon_progress_pct: 0,
      route_progress: {
        total_route_progress_ratio: 0,
        active_leg_start_distance_m: 0,
        active_leg_end_distance_m: 0,
        active_leg_length_m: 0,
        active_leg_progress_ratio: 0,
        active_leg_distance_complete_m: 0,
        active_leg_distance_remaining_m: 0,
      },
      canonical_contribution_distance_m: 0.75,
    },
    milestone_state: {
      reached: [],
    },
    recent_joins: [],
    top_countries: [],
    recent_contribution_count_24h: 0,
    snapshot_version: "initial",
    generated_at: new Date(0).toISOString(),
  };
}

export function buildEmptyMissionActivityStats(): MissionActivityStats {
  return {
    generated_at: new Date(0).toISOString(),
    hourly: [],
    daily: [],
    weekly: [],
    monthly: [],
  };
}

export function buildEmptyMissionRhythmTypeStats(): MissionRhythmTypeStats {
  return {
    types: [],
  };
}

const MIN_MEANINGFUL_MISSION_TIMESTAMP_MS = Date.UTC(2025, 0, 1);

export function hasMeaningfulMissionTimestamp(timestamp: string | null | undefined): boolean {
  if (!timestamp) {
    return false;
  }

  const parsed = new Date(timestamp).getTime();
  return Number.isFinite(parsed) && parsed >= MIN_MEANINGFUL_MISSION_TIMESTAMP_MS;
}

export function formatMissionDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${(distanceKm * 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} m`;
  }
  if (distanceKm >= 1000) {
    return `${distanceKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
  }
  return `${distanceKm.toLocaleString(undefined, { maximumFractionDigits: 2 })} km`;
}

export function formatMissionMeters(distanceM: number): string {
  if (distanceM >= 1000) {
    return formatMissionDistance(distanceM / 1000);
  }
  return `${distanceM.toLocaleString(undefined, { maximumFractionDigits: 2 })} m`;
}

export function formatCountryLabel(countryCode: string | undefined): string | null {
  if (!countryCode) {
    return null;
  }

  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ?? countryCode
    );
  } catch {
    return countryCode;
  }
}

export function formatRelativeJoinTime(timestamp: string): string {
  const joinedAt = new Date(timestamp);
  const diffMs = joinedAt.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
}

export function formatMissionSyncTime(timestamp: string | null | undefined): string {
  if (!timestamp || !hasMeaningfulMissionTimestamp(timestamp)) {
    return "awaiting first live sync";
  }

  return formatRelativeJoinTime(timestamp);
}
