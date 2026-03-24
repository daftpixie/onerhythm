export const analyticsEventNames = [
  "ecg_contribution_started",
  "ecg_contribution_completed",
  "profile_completed",
  "educational_content_viewed",
  "educational_content_returned",
  "research_hub_viewed",
  "research_article_viewed",
  "story_article_viewed",
  "community_story_submitted",
  "resource_link_clicked",
  "homepage_cta_clicked",
  "heart_mosaic_viewed",
  "heart_mosaic_returned",
  "mission_control_viewed",
  "mission_control_returned",
  "mission_scene_loaded",
  "mission_scene_fallback_used",
  "mission_scene_degraded",
  "mission_scene_interaction",
  "mission_scene_error",
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

export const analyticsActorScopes = ["anonymous", "authenticated", "system"] as const;

export type AnalyticsActorScope = (typeof analyticsActorScopes)[number];

export interface AnalyticsEventProperties {
  cta_id?: string;
  destination_path?: string;
  surface?: string;
  content_id?: string;
  content_kind?: string;
  profile_present?: boolean;
  visit_count?: number;
  upload_format?: string;
  upload_session_id?: string;
  source_kind?: string;
  source_reference_id?: string;
  resource_kind?: string;
  status?: string;
  fallback_reason?: string;
  performance_tier?: string;
  interaction_kind?: string;
  transport?: string;
  reduced_motion?: boolean;
  compact_view?: boolean;
  coarse_pointer?: boolean;
  webgl_supported?: boolean;
  scene_mode?: string;
  waypoint_key?: string;
  share_platform?: string;
  share_slug?: string;
  referral_source?: string;
  route_window_mode?: string;
}

export interface AnalyticsEventInput {
  event_name: AnalyticsEventName;
  path: string;
  actor_scope: AnalyticsActorScope;
  visitor_id?: string;
  session_id?: string;
  properties?: AnalyticsEventProperties;
}

export interface AnalyticsEventRecord extends AnalyticsEventInput {
  analytics_event_id: string;
  request_id?: string;
  created_at: string;
}
