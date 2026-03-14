export const analyticsEventNames = [
  "ecg_contribution_started",
  "ecg_contribution_completed",
  "profile_completed",
  "educational_content_viewed",
  "educational_content_returned",
  "research_hub_viewed",
  "research_article_viewed",
  "community_story_submitted",
  "resource_link_clicked",
  "homepage_cta_clicked",
  "heart_mosaic_viewed",
  "heart_mosaic_returned",
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
