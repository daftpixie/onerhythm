export const CANONICAL_MISSION_CONTRIBUTION_DISTANCE_METERS = 0.75 as const;
export const MISSION_V3_AGGREGATE_KEY = "global" as const;

export const missionRhythmTypes = [
  "normal",
  "pvcs",
  "afib",
  "svt",
  "vt",
  "flutter",
  "icd_warrior",
  "caregiver",
  "supporter",
  "other",
] as const;

export type MissionRhythmType = (typeof missionRhythmTypes)[number];

export const missionPaletteKeys = [
  "signal",
  "pulse",
  "aurora",
  "ember",
  "moonlit",
] as const;

export type MissionPaletteKey = (typeof missionPaletteKeys)[number];

export const missionContributionStatuses = [
  "pending",
  "finalizing",
  "completed",
  "failed",
  "deleted",
] as const;

export type MissionContributionStatus = (typeof missionContributionStatuses)[number];

export const missionGenerationStatuses = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export type MissionGenerationStatus = (typeof missionGenerationStatuses)[number];

export const missionPublicVisibilityStates = [
  "private",
  "unlisted",
  "public",
] as const;

export type MissionPublicVisibility = (typeof missionPublicVisibilityStates)[number];

export const missionCountryVisibilityStates = [
  "hidden",
  "aggregate_only",
  "public",
] as const;

export type MissionCountryVisibility = (typeof missionCountryVisibilityStates)[number];

export const missionNoteVisibilityStates = ["private", "public"] as const;

export type MissionNoteVisibility = (typeof missionNoteVisibilityStates)[number];

export const missionShareStatuses = ["pending", "ready", "disabled"] as const;

export type MissionShareStatus = (typeof missionShareStatuses)[number];

export const missionModerationStatuses = [
  "clear",
  "pending_review",
  "approved",
  "rejected",
  "suppressed",
] as const;

export type MissionModerationStatus = (typeof missionModerationStatuses)[number];

export const missionSources = [
  "homepage",
  "join",
  "campaign",
  "social",
  "partner",
  "referral",
  "admin",
] as const;

export type MissionSource = (typeof missionSources)[number];

export const missionSharePlatforms = [
  "x",
  "linkedin",
  "reddit",
  "threads",
  "instagram_stories",
  "copy_link",
  "copy_caption",
  "native_share",
  "download",
] as const;

export type MissionSharePlatform = (typeof missionSharePlatforms)[number];

export const milestoneStatuses = ["pending", "reached"] as const;

export type MilestoneStatus = (typeof milestoneStatuses)[number];

export const missionResultStates = [
  "pending_verification",
  "completed",
  "already_joined",
  "private",
  "removed",
  "moderated",
] as const;

export type MissionResultState = (typeof missionResultStates)[number];

export type MissionShareSlug = string;

export interface MissionContribution {
  id: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  status: MissionContributionStatus;
  rhythm_type: MissionRhythmType;
  palette_key: MissionPaletteKey;
  display_name?: string;
  country_code?: string;
  country_visibility: MissionCountryVisibility;
  note?: string;
  note_visibility: MissionNoteVisibility;
  public_visibility: MissionPublicVisibility;
  share_slug: MissionShareSlug;
  share_status: MissionShareStatus;
  source: MissionSource;
  referral_source?: string;
  distance_m: typeof CANONICAL_MISSION_CONTRIBUTION_DISTANCE_METERS;
  moderation_status: MissionModerationStatus;
  generation_status: MissionGenerationStatus;
  consent_version: string;
  consent_flags: {
    terms_accepted: boolean;
    privacy_accepted: boolean;
    share_permissions_accepted: boolean;
  };
  chain_index?: number;
  signal_id?: string;
  completed_at?: string;
  deleted_at?: string;
}

export interface MissionArtAsset {
  asset_id: string;
  contribution_id: string;
  image_url?: string;
  thumb_url?: string;
  storage_key?: string;
  prompt_version?: string;
  model_id?: string;
  seed?: string;
  start_y_px?: number;
  end_y_px?: number;
  width_px?: number;
  height_px?: number;
  style_family?: string;
  alt_text?: string;
  geometry_manifest?: Record<string, unknown>;
  generation_status: MissionGenerationStatus;
  created_at: string;
  updated_at: string;
}

export interface MissionArtPreview {
  asset_id: string;
  image_url?: string;
  thumb_url?: string;
  width_px?: number;
  height_px?: number;
  alt_text?: string;
  generation_status: MissionGenerationStatus;
}

export interface MissionSegment {
  segment_id: string;
  contribution_id: string;
  chain_index?: number;
  route_position_m?: number;
  distance_m: typeof CANONICAL_MISSION_CONTRIBUTION_DISTANCE_METERS;
  milestone_key?: string;
  geometry_manifest?: Record<string, unknown>;
  is_recent: boolean;
  created_at: string;
  updated_at: string;
}

export interface MissionAggregate {
  aggregate_key: typeof MISSION_V3_AGGREGATE_KEY;
  total_contributions: number;
  total_distance_m: number;
  total_distance_km: number;
  countries_represented: number;
  current_milestone_key?: string;
  next_milestone_key?: string;
  earth_progress_pct: number;
  moon_progress_pct: number;
  distance_to_next_milestone_m?: number;
  next_milestone_distance_remaining_m?: number;
  route_progress: MissionRouteProgressState;
  last_contribution_at?: string;
  updated_at?: string;
  canonical_contribution_distance_m: typeof CANONICAL_MISSION_CONTRIBUTION_DISTANCE_METERS;
}

export interface CountryAggregate {
  country_code: string;
  total_contributions: number;
  total_distance_m: number;
  total_distance_km: number;
  last_contribution_at?: string;
  updated_at?: string;
}

export interface MissionMilestone {
  id: string;
  key: string;
  label: string;
  description?: string;
  distance_threshold_m: number;
  celebration_variant?: string;
  status: MilestoneStatus;
  reached_at?: string;
  metadata?: Record<string, unknown>;
}

export interface MissionMilestoneState {
  current?: MissionMilestone;
  next?: MissionMilestone;
  reached: MissionMilestone[];
  distance_to_next_milestone_m?: number;
}

export interface MissionRouteProgressState {
  total_route_progress_ratio: number;
  active_leg_key?: string;
  active_leg_label?: string;
  active_leg_start_distance_m: number;
  active_leg_end_distance_m: number;
  active_leg_length_m: number;
  active_leg_progress_ratio: number;
  active_leg_distance_complete_m: number;
  active_leg_distance_remaining_m: number;
}

export interface MissionPublicJoin {
  contribution_id: string;
  share_slug: MissionShareSlug;
  joined_at: string;
  display_name?: string;
  country_code?: string;
  rhythm_type: MissionRhythmType;
  palette_key: MissionPaletteKey;
  distance_m: typeof CANONICAL_MISSION_CONTRIBUTION_DISTANCE_METERS;
  milestone_key?: string;
  art_preview?: MissionArtPreview;
}

export interface MissionOverview {
  aggregate: MissionAggregate;
  milestone_state: MissionMilestoneState;
  recent_joins: MissionPublicJoin[];
  top_countries: CountryAggregate[];
  recent_contribution_count_24h: number;
  snapshot_version: string;
  generated_at: string;
}

export const missionRouteWaypointKinds = [
  "origin",
  "loop",
  "launch",
  "milestone",
  "destination",
] as const;

export type MissionRouteWaypointKind = (typeof missionRouteWaypointKinds)[number];

export const missionRouteGeometryModes = ["geographic", "hybrid", "symbolic"] as const;

export type MissionRouteGeometryMode = (typeof missionRouteGeometryModes)[number];

export const missionRouteMilestonePlacementModes = [
  "waypoint",
  "distance_along_leg",
] as const;

export type MissionRouteMilestonePlacementMode =
  (typeof missionRouteMilestonePlacementModes)[number];

export const missionSegmentsWindowModes = [
  "recent",
  "progress",
  "near_progress",
  "milestone_local",
  "country_highlights",
] as const;

export type MissionSegmentsWindowMode = (typeof missionSegmentsWindowModes)[number];

export const missionScenePerformanceTiers = [
  "immersive",
  "balanced",
  "conservative",
  "fallback",
] as const;

export type MissionScenePerformanceTier = (typeof missionScenePerformanceTiers)[number];

export interface MissionSceneVector3 {
  x: number;
  y: number;
  z: number;
}

export interface MissionRouteLeg {
  key: string;
  label: string;
  geometry_mode: MissionRouteGeometryMode;
  start_waypoint_key: string;
  end_waypoint_key: string;
  start_distance_m: number;
  end_distance_m: number;
  length_m: number;
  points: MissionSceneVector3[];
}

export interface MissionRouteWaypoint {
  key: string;
  label: string;
  kind: MissionRouteWaypointKind;
  leg_key: string;
  distance_m: number;
  position: MissionSceneVector3;
  anchor_mode: MissionRouteGeometryMode;
  latitude_degrees?: number;
  longitude_degrees?: number;
  milestone_key?: string;
}

export interface MissionRouteMilestoneMarker {
  milestone_key: string;
  label: string;
  distance_m: number;
  leg_key: string;
  leg_progress_ratio: number;
  placement_mode: MissionRouteMilestonePlacementMode;
  position: MissionSceneVector3;
  waypoint_key?: string;
}

export interface MissionRouteGeometry {
  route_key: string;
  earth_radius: number;
  atmosphere_radius: number;
  moon_radius: number;
  moon_position: MissionSceneVector3;
  route_total_distance_m: number;
  earth_loop_distance_m: number;
  tampa_to_cape_distance_m: number;
  cape_to_moon_distance_m: number;
  legs: MissionRouteLeg[];
  waypoints: MissionRouteWaypoint[];
  milestone_markers: MissionRouteMilestoneMarker[];
  generated_at: string;
}

export interface MissionSceneSegment {
  segment_id: string;
  contribution_id: string;
  share_slug: MissionShareSlug;
  chain_index: number;
  signal_id: string;
  route_position_m: number;
  joined_at: string;
  display_name?: string;
  country_code?: string;
  rhythm_type: MissionRhythmType;
  palette_key: MissionPaletteKey;
  distance_m: typeof CANONICAL_MISSION_CONTRIBUTION_DISTANCE_METERS;
  milestone_key?: string;
  art_preview?: MissionArtPreview;
}

export interface MissionSegmentsWindow {
  mode: MissionSegmentsWindowMode;
  limit: number;
  segments: MissionSceneSegment[];
  snapshot_version: string;
  generated_at: string;
}

export interface MissionShareChannelReport {
  platform: MissionSharePlatform;
  share_event_count: number;
  distinct_result_count: number;
  last_event_at?: string;
}

export interface MissionSharedResultReport {
  contribution_id: string;
  share_slug: MissionShareSlug;
  share_event_count: number;
  display_name?: string;
  milestone_key?: string;
  last_shared_at?: string;
}

export interface MissionReferralSourceReport {
  referral_source: string;
  draft_count: number;
  finalized_count: number;
  conversion_rate_pct: number;
}

export interface MissionMilestoneShareSpike {
  milestone_key: string;
  label: string;
  reached_at: string;
  share_event_count_24h: number;
}

export interface MissionShareReportingSummary {
  generated_at: string;
  window_days: number;
  total_share_events: number;
  total_results_shared: number;
  average_time_to_first_share_seconds?: number;
  channel_breakdown: MissionShareChannelReport[];
  top_shared_results: MissionSharedResultReport[];
  referral_breakdown: MissionReferralSourceReport[];
  milestone_share_spikes: MissionMilestoneShareSpike[];
}

export interface MissionSceneHealthTierStat {
  performance_tier: MissionScenePerformanceTier;
  event_count: number;
}

export interface MissionSceneHealthFallbackStat {
  fallback_reason: string;
  event_count: number;
}

export interface MissionSceneHealthSummary {
  generated_at: string;
  window_days: number;
  mission_control_views: number;
  scene_load_successes: number;
  scene_error_count: number;
  fallback_usage_count: number;
  degraded_session_count: number;
  reduced_motion_count: number;
  compact_view_count: number;
  performance_tiers: MissionSceneHealthTierStat[];
  fallback_reasons: MissionSceneHealthFallbackStat[];
}

export interface MissionShareEvent {
  share_event_id: string;
  contribution_id: string;
  platform: MissionSharePlatform;
  generated_at?: string;
  clicked_at?: string;
  posted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MissionShareEventInput {
  platform: MissionSharePlatform;
}

export interface MissionShareEventResponse {
  share_event: MissionShareEvent;
}

export interface MissionModerationQueueEntry {
  moderation_queue_id: string;
  object_type: "contribution" | "note" | "display_name";
  object_id: string;
  risk_score: number;
  flags: string[];
  reviewer_status: "pending" | "approved" | "rejected";
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MissionContributionDraftInput {
  rhythm_type: MissionRhythmType;
  palette_key: MissionPaletteKey;
  display_name?: string;
  country_code?: string;
  country_visibility: MissionCountryVisibility;
  note?: string;
  note_visibility: MissionNoteVisibility;
  public_visibility: MissionPublicVisibility;
  source: MissionSource;
  referral_source?: string;
  consent_version: string;
  consent_flags: {
    terms_accepted: boolean;
    privacy_accepted: boolean;
    share_permissions_accepted: boolean;
  };
  honeypot?: string;
}

export interface MissionVerificationStartInput {
  contribution_id: string;
  email: string;
  honeypot?: string;
}

export interface MissionVerificationStartResponse {
  contribution_id: string;
  verification_required: true;
  expires_at: string;
  masked_email: string;
  debug_code?: string;
}

export interface MissionFinalizeInput {
  contribution_id: string;
  email: string;
  code: string;
  turnstile_token: string;
}

export interface MissionResultView {
  state: MissionResultState;
  contribution: MissionContribution;
  art_asset?: MissionArtAsset;
  mission_aggregate: MissionAggregate;
  country_aggregate?: CountryAggregate;
  milestones: MissionMilestone[];
  reached_milestone?: MissionMilestone;
  duplicate_existing_share_slug?: string;
  share_headline: string;
  share_caption: string;
  visibility_message?: string;
}

export interface MissionFinalizeResponse {
  outcome: "completed" | "already_joined";
  share_slug: string;
  existing_share_slug?: string;
  result: MissionResultView;
}

export interface MissionDailyStat {
  date: string;
  contributions: number;
  distance_m: number;
}

export interface MissionDailyStats {
  days: MissionDailyStat[];
}

export interface MissionActivityBucket {
  bucket_key: string;
  label: string;
  contributions: number;
  distance_m: number;
}

export interface MissionActivityStats {
  generated_at: string;
  hourly: MissionActivityBucket[];
  daily: MissionActivityBucket[];
  weekly: MissionActivityBucket[];
  monthly: MissionActivityBucket[];
}

export interface MissionRhythmTypeStat {
  type: string;
  count: number;
  percentage: number;
  total_distance_m: number;
  total_distance_km: number;
}

export interface MissionRhythmTypeStats {
  types: MissionRhythmTypeStat[];
}

export interface MissionNextChainIndex {
  next_chain_index: number;
  next_signal_id: string;
}

export function formatSignalId(chainIndex: number): string {
  return `OR-${chainIndex.toString().padStart(8, "0")}`;
}
