import type {
  MissionActivityStats,
  CountryAggregate,
  MissionAggregate,
  MissionContributionDraftInput,
  MissionDailyStats,
  MissionFinalizeInput,
  MissionFinalizeResponse,
  MissionMilestone,
  MissionMilestoneState,
  MissionNextChainIndex,
  MissionOverview,
  MissionPublicJoin,
  MissionRhythmTypeStats,
  MissionRouteGeometry,
  MissionResultView,
  MissionSceneHealthSummary,
  MissionSceneSegment,
  MissionSegmentsWindow,
  MissionSegmentsWindowMode,
  MissionShareReportingSummary,
  MissionShareEventInput,
  MissionShareEventResponse,
  MissionVerificationStartInput,
  MissionVerificationStartResponse,
} from "@onerhythm/types";
import { buildEmptyMissionRouteGeometry } from "./mission-v3-scene";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_ONERHYTHM_API_BASE_URL ??
  process.env.ONERHYTHM_API_BASE_URL ??
  "http://127.0.0.1:8000";

type MissionApiErrorPayload = {
  error?: {
    message?: string;
    code?: string;
  };
};

export class MissionApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "MissionApiError";
    this.status = status;
    this.code = code;
  }
}

function toAbsoluteApiUrl(path: string | undefined): string | undefined {
  if (!path) {
    return undefined;
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}

function hydrateMissionResult(result: MissionResultView): MissionResultView {
  if (!result.art_asset) {
    return result;
  }
  return {
    ...result,
    art_asset: {
      ...result.art_asset,
      image_url: toAbsoluteApiUrl(result.art_asset.image_url),
      thumb_url: toAbsoluteApiUrl(result.art_asset.thumb_url),
    },
  };
}

function hydrateMissionPublicJoin(publicJoin: MissionPublicJoin): MissionPublicJoin {
  if (!publicJoin.art_preview) {
    return publicJoin;
  }
  return {
    ...publicJoin,
    art_preview: {
      ...publicJoin.art_preview,
      image_url: toAbsoluteApiUrl(publicJoin.art_preview.image_url),
      thumb_url: toAbsoluteApiUrl(publicJoin.art_preview.thumb_url),
    },
  };
}

function hydrateMissionSceneSegment(segment: MissionSceneSegment): MissionSceneSegment {
  if (!segment.art_preview) {
    return segment;
  }
  return {
    ...segment,
    art_preview: {
      ...segment.art_preview,
      image_url: toAbsoluteApiUrl(segment.art_preview.image_url),
      thumb_url: toAbsoluteApiUrl(segment.art_preview.thumb_url),
    },
  };
}

export function hydrateMissionOverviewPayload(overview: MissionOverview): MissionOverview {
  return {
    ...overview,
    recent_joins: overview.recent_joins.map(hydrateMissionPublicJoin),
  };
}

export function hydrateMissionRouteGeometryPayload(
  routeGeometry: Partial<MissionRouteGeometry> | null | undefined,
): MissionRouteGeometry {
  const fallback = buildEmptyMissionRouteGeometry();

  if (!routeGeometry) {
    return fallback;
  }

  return {
    ...fallback,
    ...routeGeometry,
    legs: routeGeometry.legs ?? fallback.legs,
    waypoints: routeGeometry.waypoints ?? fallback.waypoints,
    milestone_markers: routeGeometry.milestone_markers ?? fallback.milestone_markers,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as MissionApiErrorPayload | null;
    throw new MissionApiError(
      payload?.error?.message ?? "The request could not be completed.",
      response.status,
      payload?.error?.code,
    );
  }
  return (await response.json()) as T;
}

export async function createMissionContributionDraft(
  payload: MissionContributionDraftInput,
): Promise<MissionResultView> {
  const response = await fetch(`${API_BASE_URL}/v1/mission-v3/contributions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return hydrateMissionResult(await parseResponse<MissionResultView>(response));
}

export async function startMissionContributionVerification(
  payload: MissionVerificationStartInput,
): Promise<MissionVerificationStartResponse> {
  const response = await fetch(
    `${API_BASE_URL}/v1/mission-v3/contributions/${payload.contribution_id}/verification/start`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return parseResponse<MissionVerificationStartResponse>(response);
}

export async function finalizeMissionContribution(
  payload: MissionFinalizeInput,
): Promise<MissionFinalizeResponse> {
  const response = await fetch(
    `${API_BASE_URL}/v1/mission-v3/contributions/${payload.contribution_id}/finalize`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const finalized = await parseResponse<MissionFinalizeResponse>(response);
  return {
    ...finalized,
    result: hydrateMissionResult(finalized.result),
  };
}

export async function getMissionContributionResult(
  shareSlug: string,
  init: RequestInit = {},
): Promise<MissionResultView> {
  const response = await fetch(`${API_BASE_URL}/v1/mission-v3/contributions/${shareSlug}/result`, {
    cache: "no-store",
    ...init,
  });
  return hydrateMissionResult(await parseResponse<MissionResultView>(response));
}

export async function getMissionAggregate(init: RequestInit = {}): Promise<MissionAggregate> {
  const response = await fetch(`${API_BASE_URL}/v1/mission-v3/aggregate`, {
    cache: "no-store",
    ...init,
  });
  return parseResponse<MissionAggregate>(response);
}

export async function getMissionCountryLeaderboard(
  init: RequestInit = {},
): Promise<CountryAggregate[]> {
  const response = await fetch(`${API_BASE_URL}/v1/mission-v3/countries`, {
    cache: "no-store",
    ...init,
  });
  return parseResponse<CountryAggregate[]>(response);
}

export async function getMissionMilestones(
  init: RequestInit = {},
): Promise<MissionMilestone[]> {
  const response = await fetch(`${API_BASE_URL}/v1/mission-v3/milestones`, {
    cache: "no-store",
    ...init,
  });
  return parseResponse<MissionMilestone[]>(response);
}

export async function getMissionMilestoneState(
  init: RequestInit = {},
): Promise<MissionMilestoneState> {
  const response = await fetch(`${API_BASE_URL}/v1/mission-v3/milestones/state`, {
    cache: "no-store",
    ...init,
  });
  return parseResponse<MissionMilestoneState>(response);
}

export async function getMissionRecentJoins(
  init: RequestInit = {},
): Promise<MissionPublicJoin[]> {
  const response = await fetch(`${API_BASE_URL}/v1/mission-v3/recent-joins`, {
    cache: "no-store",
    ...init,
  });
  return (await parseResponse<MissionPublicJoin[]>(response)).map(hydrateMissionPublicJoin);
}

export async function getMissionOverview(init: RequestInit = {}): Promise<MissionOverview> {
  const response = await fetch(`${API_BASE_URL}/v1/mission-v3/overview`, {
    cache: "no-store",
    ...init,
  });
  return hydrateMissionOverviewPayload(await parseResponse<MissionOverview>(response));
}

export async function getMissionRouteGeometry(
  init: RequestInit = {},
): Promise<MissionRouteGeometry> {
  const response = await fetch(`${API_BASE_URL}/v1/mission-v3/route-geometry`, {
    cache: "force-cache",
    ...init,
  });
  return hydrateMissionRouteGeometryPayload(
    await parseResponse<Partial<MissionRouteGeometry>>(response),
  );
}

export async function getMissionSegmentsWindow(
  mode: MissionSegmentsWindowMode = "recent",
  limit = 64,
  init: RequestInit = {},
): Promise<MissionSegmentsWindow> {
  const response = await fetch(
    `${API_BASE_URL}/v1/mission-v3/segments-window?mode=${encodeURIComponent(mode)}&limit=${limit}`,
    {
      cache: "no-store",
      ...init,
    },
  );
  const payload = await parseResponse<MissionSegmentsWindow>(response);
  return {
    ...payload,
    segments: payload.segments.map(hydrateMissionSceneSegment),
  };
}

export async function getMissionShareReportingSummary(
  windowDays = 14,
  init: RequestInit = {},
): Promise<MissionShareReportingSummary> {
  const response = await fetch(
    `${API_BASE_URL}/v1/mission-v3/reporting/share-summary?window_days=${windowDays}`,
    {
      cache: "no-store",
      credentials: "include",
      ...init,
    },
  );
  return parseResponse<MissionShareReportingSummary>(response);
}

export async function getMissionSceneHealthSummary(
  windowDays = 7,
  init: RequestInit = {},
): Promise<MissionSceneHealthSummary> {
  const response = await fetch(
    `${API_BASE_URL}/v1/mission-v3/reporting/scene-health?window_days=${windowDays}`,
    {
      cache: "no-store",
      credentials: "include",
      ...init,
    },
  );
  return parseResponse<MissionSceneHealthSummary>(response);
}

export async function getMissionDailyStats(
  days = 30,
  init: RequestInit = {},
): Promise<MissionDailyStats> {
  const response = await fetch(
    `${API_BASE_URL}/v1/mission-v3/stats/daily?days=${days}`,
    { credentials: "include", ...init },
  );
  return parseResponse<MissionDailyStats>(response);
}

export async function getMissionActivityStats(
  init: RequestInit = {},
): Promise<MissionActivityStats> {
  const response = await fetch(
    `${API_BASE_URL}/v1/mission-v3/stats/activity`,
    { credentials: "include", ...init },
  );
  return parseResponse<MissionActivityStats>(response);
}

export async function getMissionRhythmTypeStats(
  init: RequestInit = {},
): Promise<MissionRhythmTypeStats> {
  const response = await fetch(
    `${API_BASE_URL}/v1/mission-v3/stats/rhythm-types`,
    { credentials: "include", ...init },
  );
  return parseResponse<MissionRhythmTypeStats>(response);
}

export async function getMissionNextChainIndex(
  init: RequestInit = {},
): Promise<MissionNextChainIndex> {
  const response = await fetch(`${API_BASE_URL}/v1/mission-v3/chain/next-index`, {
    cache: "no-store",
    ...init,
  });
  return parseResponse<MissionNextChainIndex>(response);
}

export function getMissionLiveStreamUrl(): string {
  return `${API_BASE_URL}/v1/mission-v3/live`;
}

export async function createMissionShareEvent(
  shareSlug: string,
  payload: MissionShareEventInput,
): Promise<MissionShareEventResponse> {
  const response = await fetch(
    `${API_BASE_URL}/v1/mission-v3/contributions/${shareSlug}/share-events`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return parseResponse<MissionShareEventResponse>(response);
}
