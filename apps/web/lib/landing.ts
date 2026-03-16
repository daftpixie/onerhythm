import type { LandingMissionMetrics } from "@onerhythm/types";

export type LandingMilestone = {
  key: string;
  label: string;
  distanceKm: number;
};

export const LANDING_MISSION_MILESTONES: LandingMilestone[] = [
  { key: "english_channel", label: "Across the English Channel", distanceKm: 34 },
  { key: "london_paris", label: "London to Paris", distanceKm: 340 },
  { key: "coast_to_coast", label: "Coast to Coast, US", distanceKm: 4_506 },
  { key: "tampa_london", label: "Tampa to London", distanceKm: 7_100 },
  { key: "earth", label: "Once around the Earth", distanceKm: 40_075 },
  { key: "moon", label: "To the Moon", distanceKm: 384_400 },
];

export const STANDARD_STRIP_DISTANCE_METERS = 0.25;
export const STANDARD_STRIP_DISTANCE_KM = STANDARD_STRIP_DISTANCE_METERS / 1_000;

export function resolveLandingMilestone(distanceKm: number) {
  const reached = LANDING_MISSION_MILESTONES.filter(
    (milestone) => distanceKm >= milestone.distanceKm,
  );
  const next =
    LANDING_MISSION_MILESTONES.find((milestone) => distanceKm < milestone.distanceKm) ?? null;

  return {
    reached,
    next,
    remainingKm: next ? Math.max(next.distanceKm - distanceKm, 0) : 0,
  };
}

export function formatDistanceDisplay(distanceKm: number): {
  value: string;
  unit: "m" | "km";
} {
  if (distanceKm < 1) {
    return {
      value: Math.round(distanceKm * 1_000).toLocaleString(),
      unit: "m",
    };
  }

  return {
    value: distanceKm.toLocaleString(undefined, {
      maximumFractionDigits: distanceKm < 10 ? 2 : distanceKm < 100 ? 1 : 0,
    }),
    unit: "km",
  };
}

export function formatCompactDistance(distanceKm: number): string {
  const formatted = formatDistanceDisplay(distanceKm);
  return `${formatted.value} ${formatted.unit}`;
}

export function projectFoundingMemberDistanceKm(totalSignups: number): number {
  return totalSignups * STANDARD_STRIP_DISTANCE_KM;
}

export function buildLandingMissionMetrics(params: LandingMissionMetrics): LandingMissionMetrics {
  return params;
}
