import type {
  MissionAggregate,
  MissionOverview,
  MissionRouteGeometry,
  MissionRouteLeg,
  MissionRouteMilestoneMarker,
  MissionRouteWaypoint,
  MissionSceneVector3,
  MissionSegmentsWindow,
} from "@onerhythm/types";

export type MissionRouteProgress = {
  clampedDistanceM: number;
  leg: MissionRouteLeg | null;
  legIndex: number;
  legProgress: number;
  normalizedProgress: number;
};

export type MissionSceneTierConfig = {
  activeLegRadius: number;
  baselineRouteRadius: number;
  bloomStrength: number;
  countryHighlightCapacity: number;
  earthRotationSpeed: number;
  enableSupplementalWindows: boolean;
  milestoneCapacity: number;
  nearProgressCapacity: number;
  progressRouteRadius: number;
  recentCapacity: number;
  remainingRouteRadius: number;
  routeSamplesPerLeg: number;
  starSpeed: number;
  starsCount: number;
};

export type MissionMilestoneRenderState = {
  isFocused: boolean;
  linkedWaypoint: MissionRouteWaypoint | null;
  marker: MissionRouteMilestoneMarker;
  status: "current" | "next" | "pending" | "reached";
};

export function buildEmptyMissionRouteGeometry(): MissionRouteGeometry {
  return {
    route_key: "mission-control-empty",
    earth_radius: 2.24,
    atmosphere_radius: 2.4,
    moon_radius: 0.58,
    moon_position: { x: 7.6, y: 1.18, z: -1.08 },
    route_total_distance_m: 0,
    earth_loop_distance_m: 0,
    tampa_to_cape_distance_m: 0,
    cape_to_moon_distance_m: 0,
    legs: [],
    waypoints: [],
    milestone_markers: [],
    generated_at: new Date(0).toISOString(),
  };
}

export function buildEmptyMissionSegmentsWindow(
  mode: MissionSegmentsWindow["mode"] = "recent",
  limit = 64,
): MissionSegmentsWindow {
  return {
    mode,
    limit,
    segments: [],
    snapshot_version: "initial",
    generated_at: new Date(0).toISOString(),
  };
}

export function getMissionRouteProgress(
  totalDistanceM: number,
  routeGeometry: MissionRouteGeometry,
): MissionRouteProgress {
  const routeTotal = Math.max(routeGeometry.route_total_distance_m, 0);
  const clampedDistanceM = Math.min(Math.max(totalDistanceM, 0), routeTotal);
  const normalizedProgress = routeTotal > 0 ? clampedDistanceM / routeTotal : 0;
  const legIndex = routeGeometry.legs.findIndex(
    (leg) => clampedDistanceM <= leg.end_distance_m || leg === routeGeometry.legs.at(-1),
  );
  const leg = legIndex >= 0 ? routeGeometry.legs[legIndex] : null;

  if (!leg) {
    return {
      clampedDistanceM,
      leg: null,
      legIndex: -1,
      legProgress: 0,
      normalizedProgress,
    };
  }

  const legSpan = Math.max(leg.end_distance_m - leg.start_distance_m, 1);
  const legProgress = Math.min(
    1,
    Math.max(0, (clampedDistanceM - leg.start_distance_m) / legSpan),
  );

  return {
    clampedDistanceM,
    leg,
    legIndex,
    legProgress,
    normalizedProgress,
  };
}

function clampRatio(value: number | undefined): number {
  return Math.min(1, Math.max(0, value ?? 0));
}

export function getMissionAggregateRouteProgress(
  aggregate: Pick<MissionAggregate, "total_distance_m" | "route_progress">,
  routeGeometry: MissionRouteGeometry,
): MissionRouteProgress {
  const activeLegKey = aggregate.route_progress.active_leg_key;
  const legIndex = activeLegKey
    ? routeGeometry.legs.findIndex((leg) => leg.key === activeLegKey)
    : -1;
  const leg = legIndex >= 0 ? routeGeometry.legs[legIndex] : null;

  if (!leg) {
    return getMissionRouteProgress(aggregate.total_distance_m, routeGeometry);
  }

  const routeTotal = Math.max(routeGeometry.route_total_distance_m, 0);
  return {
    clampedDistanceM: Math.min(Math.max(aggregate.total_distance_m, 0), routeTotal),
    leg,
    legIndex,
    legProgress: clampRatio(aggregate.route_progress.active_leg_progress_ratio),
    normalizedProgress: clampRatio(aggregate.route_progress.total_route_progress_ratio),
  };
}

export function getMissionWaypointByKey(
  routeGeometry: MissionRouteGeometry,
  waypointKey: string | null,
): MissionRouteWaypoint | null {
  if (!waypointKey) {
    return null;
  }
  return (routeGeometry.waypoints ?? []).find((waypoint) => waypoint.key === waypointKey) ?? null;
}

export function getMissionMilestoneMarkerByKey(
  routeGeometry: MissionRouteGeometry,
  milestoneKey: string | null,
): MissionRouteMilestoneMarker | null {
  if (!milestoneKey) {
    return null;
  }
  return (
    (routeGeometry.milestone_markers ?? []).find(
      (marker) => marker.milestone_key === milestoneKey,
    ) ?? null
  );
}

export function buildMissionRoutePolyline(routeGeometry: MissionRouteGeometry): MissionSceneVector3[] {
  return routeGeometry.legs.flatMap((leg, index) =>
    index === 0 ? leg.points : leg.points.slice(1),
  );
}

function interpolatePoint(
  fromPoint: MissionSceneVector3,
  toPoint: MissionSceneVector3,
  progress: number,
): MissionSceneVector3 {
  return {
    x: fromPoint.x + (toPoint.x - fromPoint.x) * progress,
    y: fromPoint.y + (toPoint.y - fromPoint.y) * progress,
    z: fromPoint.z + (toPoint.z - fromPoint.z) * progress,
  };
}

export function buildProgressRoutePolyline(
  routeGeometry: MissionRouteGeometry,
  totalDistanceM: number,
  samplesPerLeg = 24,
): MissionSceneVector3[] {
  const progress = getMissionRouteProgress(totalDistanceM, routeGeometry);
  return buildProgressRoutePolylineFromProgress(routeGeometry, progress, samplesPerLeg);
}

export function buildProgressRoutePolylineFromAggregate(
  routeGeometry: MissionRouteGeometry,
  aggregate: Pick<MissionAggregate, "total_distance_m" | "route_progress">,
  samplesPerLeg = 24,
): MissionSceneVector3[] {
  const progress = getMissionAggregateRouteProgress(aggregate, routeGeometry);
  return buildProgressRoutePolylineFromProgress(routeGeometry, progress, samplesPerLeg);
}

export function buildRemainingRoutePolyline(
  routeGeometry: MissionRouteGeometry,
  totalDistanceM: number,
  samplesPerLeg = 24,
): MissionSceneVector3[] {
  const progress = getMissionRouteProgress(totalDistanceM, routeGeometry);
  return buildRemainingRoutePolylineFromProgress(routeGeometry, progress, samplesPerLeg);
}

export function buildRemainingRoutePolylineFromAggregate(
  routeGeometry: MissionRouteGeometry,
  aggregate: Pick<MissionAggregate, "total_distance_m" | "route_progress">,
  samplesPerLeg = 24,
): MissionSceneVector3[] {
  const progress = getMissionAggregateRouteProgress(aggregate, routeGeometry);
  return buildRemainingRoutePolylineFromProgress(routeGeometry, progress, samplesPerLeg);
}

function buildProgressRoutePolylineFromProgress(
  routeGeometry: MissionRouteGeometry,
  progress: MissionRouteProgress,
  samplesPerLeg = 24,
): MissionSceneVector3[] {
  if (!progress.leg) {
    return [];
  }

  const completedLegs = routeGeometry.legs.slice(0, progress.legIndex);
  const completedPoints = completedLegs.flatMap((leg, index) =>
    index === 0 ? leg.points : leg.points.slice(1),
  );

  const activeLeg = progress.leg;
  const activeSamples = Math.max(2, Math.round(samplesPerLeg * progress.legProgress));
  const activePoints: MissionSceneVector3[] = [];

  for (let step = 0; step < activeSamples; step += 1) {
    const legPointProgress =
      activeSamples <= 1 ? progress.legProgress : (step / (activeSamples - 1)) * progress.legProgress;
    const scaledIndex = legPointProgress * Math.max(activeLeg.points.length - 1, 1);
    const lowerIndex = Math.floor(scaledIndex);
    const upperIndex = Math.min(lowerIndex + 1, activeLeg.points.length - 1);
    const tween = scaledIndex - lowerIndex;
    activePoints.push(
      interpolatePoint(activeLeg.points[lowerIndex], activeLeg.points[upperIndex], tween),
    );
  }

  return [...completedPoints, ...(completedPoints.length ? activePoints.slice(1) : activePoints)];
}

function buildRemainingRoutePolylineFromProgress(
  routeGeometry: MissionRouteGeometry,
  progress: MissionRouteProgress,
  samplesPerLeg = 24,
): MissionSceneVector3[] {
  if (!progress.leg) {
    return [];
  }

  const activeLeg = progress.leg;
  const remainingSamples = Math.max(2, Math.round(samplesPerLeg * (1 - progress.legProgress)));
  const activePoints: MissionSceneVector3[] = [];

  for (let step = 0; step < remainingSamples; step += 1) {
    const legPointProgress =
      remainingSamples <= 1
        ? progress.legProgress
        : progress.legProgress + (step / (remainingSamples - 1)) * (1 - progress.legProgress);
    const scaledIndex = legPointProgress * Math.max(activeLeg.points.length - 1, 1);
    const lowerIndex = Math.floor(scaledIndex);
    const upperIndex = Math.min(lowerIndex + 1, activeLeg.points.length - 1);
    const tween = scaledIndex - lowerIndex;
    activePoints.push(
      interpolatePoint(activeLeg.points[lowerIndex], activeLeg.points[upperIndex], tween),
    );
  }

  const futureLegs = routeGeometry.legs.slice(progress.legIndex + 1);
  const futurePoints = futureLegs.flatMap((leg, index) =>
    index === 0 ? leg.points.slice(1) : leg.points.slice(1),
  );

  return [...activePoints, ...futurePoints];
}

export function buildMissionMilestoneRenderStates(
  routeGeometry: MissionRouteGeometry,
  overview: Pick<MissionOverview, "milestone_state">,
  focusedWaypointKey: string | null,
): MissionMilestoneRenderState[] {
  const currentKey = overview.milestone_state.current?.key ?? null;
  const nextKey = overview.milestone_state.next?.key ?? null;
  const reachedKeys = new Set(overview.milestone_state.reached.map((milestone) => milestone.key));
  const milestoneMarkers = routeGeometry.milestone_markers ?? [];

  return milestoneMarkers.map((marker) => {
    const linkedWaypoint = marker.waypoint_key
      ? getMissionWaypointByKey(routeGeometry, marker.waypoint_key)
      : null;
    const status =
      marker.milestone_key === currentKey
        ? "current"
        : marker.milestone_key === nextKey
          ? "next"
          : reachedKeys.has(marker.milestone_key)
            ? "reached"
            : "pending";

    return {
      isFocused:
        Boolean(focusedWaypointKey) &&
        (marker.waypoint_key === focusedWaypointKey || marker.milestone_key === focusedWaypointKey),
      linkedWaypoint,
      marker,
      status,
    };
  });
}

export function getMissionSceneTierConfig(
  detailMode: "balanced" | "conservative",
  reducedMotion: boolean,
): MissionSceneTierConfig {
  if (detailMode === "conservative") {
    return {
      activeLegRadius: 0.02,
      baselineRouteRadius: 0.009,
      bloomStrength: reducedMotion ? 0.1 : 0.2,
      countryHighlightCapacity: 0,
      earthRotationSpeed: reducedMotion ? 0 : 0.0024,
      enableSupplementalWindows: false,
      milestoneCapacity: 0,
      nearProgressCapacity: 26,
      progressRouteRadius: 0.013,
      recentCapacity: 46,
      remainingRouteRadius: 0.01,
      routeSamplesPerLeg: 26,
      starSpeed: 0,
      starsCount: 1040,
    };
  }

  return {
    activeLegRadius: 0.026,
    baselineRouteRadius: 0.011,
    bloomStrength: reducedMotion ? 0.16 : 0.3,
    countryHighlightCapacity: 12,
    earthRotationSpeed: reducedMotion ? 0 : 0.0032,
    enableSupplementalWindows: true,
    milestoneCapacity: 18,
    nearProgressCapacity: 36,
    progressRouteRadius: 0.016,
    recentCapacity: 72,
    remainingRouteRadius: 0.012,
    routeSamplesPerLeg: 36,
    starSpeed: reducedMotion ? 0 : 0.085,
    starsCount: reducedMotion ? 1320 : 2240,
  };
}

export function paletteKeyToSceneColor(paletteKey: string): string {
  switch (paletteKey) {
    case "pulse":
      return "#ff2d55";
    case "aurora":
      return "#a78bfa";
    case "ember":
      return "#f97316";
    case "moonlit":
      return "#c4b5fd";
    case "signal":
    default:
      return "#00d4ff";
  }
}
