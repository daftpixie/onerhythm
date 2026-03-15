import type {
  CommunityStory,
  ConsentRecord,
  DeleteRequest,
  ExportRequest,
  PublicCommunityStory,
  UploadFormat,
  UploadSession as ContributionUploadSession,
  UserProfile,
} from "@onerhythm/types";

import type { ProfileResponse } from "./profile-contracts";

const API_BASE_URL = process.env.NEXT_PUBLIC_ONERHYTHM_API_BASE_URL ?? "http://127.0.0.1:8000";

export type BetaAccessState = "not_required" | "granted" | "pending";

export type SessionUser = {
  user_id: string;
  email: string;
  role: "user" | "support" | "admin";
  preferred_language: string;
  profile_id?: string | null;
};

export type SessionResponse = {
  authenticated: boolean;
  user?: SessionUser | null;
  beta_access: BetaAccessState;
};

export type UploadSessionResponse = ContributionUploadSession;

export type AuthSessionRecord = {
  session_id: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  current: boolean;
  user_agent?: string | null;
  ip_address_hint?: string | null;
};

export type AuthSessionListResponse = {
  sessions: AuthSessionRecord[];
};

type AuthPayload = {
  email: string;
  password: string;
  preferred_language?: string;
};

type ProfileCreatePayload = Omit<UserProfile, "profile_id" | "created_at" | "updated_at">;

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: { message?: string }; detail?: string | Array<{ msg?: string }> }
      | null;
    const message =
      body?.error?.message ??
      (typeof body?.detail === "string" ? body.detail : undefined) ??
      (Array.isArray(body?.detail) ? body.detail.map((d) => d.msg).join("; ") : undefined) ??
      "The request could not be completed.";
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export async function signUp(payload: AuthPayload): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/sign-up`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      preferred_language: payload.preferred_language ?? "en-US",
    }),
  });
  return parseResponse<SessionResponse>(response);
}

export async function signIn(payload: AuthPayload): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/sign-in`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
    }),
  });
  return parseResponse<SessionResponse>(response);
}

export async function signOut(): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/sign-out`, {
    method: "POST",
    credentials: "include",
  });
  return parseResponse<SessionResponse>(response);
}

export async function getSession(): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/session`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<SessionResponse>(response);
}

export async function startUploadSession(payload: {
  profile_id?: string | null;
  upload_format: UploadFormat;
  consent_record_ids: string[];
}): Promise<UploadSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/upload-sessions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile_id: payload.profile_id ?? null,
      upload_format: payload.upload_format,
      consent_record_ids: payload.consent_record_ids,
    }),
  });
  return parseResponse<UploadSessionResponse>(response);
}

export async function processUploadSession(params: {
  upload_session_id: string;
  file: File;
  processing_pipeline_version: string;
  tile_attribution?: {
    contributor_name?: string;
    contributor_location?: string;
  };
}): Promise<UploadSessionResponse> {
  const formData = new FormData();
  formData.set("processing_pipeline_version", params.processing_pipeline_version);
  formData.set(
    "share_first_name",
    params.tile_attribution?.contributor_name ? "true" : "false",
  );
  formData.set(
    "share_location",
    params.tile_attribution?.contributor_location ? "true" : "false",
  );
  if (params.tile_attribution?.contributor_name) {
    formData.set("first_name", params.tile_attribution.contributor_name);
  }
  if (params.tile_attribution?.contributor_location) {
    formData.set("location_label", params.tile_attribution.contributor_location);
  }
  formData.set("file", params.file);

  const response = await fetch(
    `${API_BASE_URL}/v1/upload-sessions/${params.upload_session_id}/process`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    },
  );
  return parseResponse<UploadSessionResponse>(response);
}

export async function getUploadSession(uploadSessionId: string): Promise<UploadSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/upload-sessions/${uploadSessionId}`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<UploadSessionResponse>(response);
}

export async function listUploadSessions(): Promise<UploadSessionResponse[]> {
  const response = await fetch(`${API_BASE_URL}/v1/upload-sessions`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<UploadSessionResponse[]>(response);
}

export async function deleteUploadSession(uploadSessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/v1/upload-sessions/${uploadSessionId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    await parseResponse<never>(response);
  }
}

export async function listAuthSessions(): Promise<AuthSessionListResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/sessions`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<AuthSessionListResponse>(response);
}

export async function revokeOtherAuthSessions(): Promise<AuthSessionListResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/sessions/revoke-others`, {
    method: "POST",
    credentials: "include",
  });
  return parseResponse<AuthSessionListResponse>(response);
}

export async function revokeAuthSession(sessionId: string): Promise<AuthSessionListResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/sessions/${sessionId}/revoke`, {
    method: "POST",
    credentials: "include",
  });
  return parseResponse<AuthSessionListResponse>(response);
}

export async function getOwnedProfile(profileId: string): Promise<ProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/profiles/${profileId}`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<ProfileResponse>(response);
}

export async function createProfile(payload: ProfileCreatePayload): Promise<ProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/profiles`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<ProfileResponse>(response);
}

export async function listConsents(profileId: string): Promise<ConsentRecord[]> {
  const response = await fetch(`${API_BASE_URL}/v1/profiles/${profileId}/consents`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<ConsentRecord[]>(response);
}

export async function createConsent(payload: {
  profile_id: string;
  consent_type: ConsentRecord["consent_type"];
  status: ConsentRecord["status"];
  policy_version: string;
  locale: string;
  effective_at: string;
  revocation_reason?: string;
}): Promise<ConsentRecord> {
  const response = await fetch(`${API_BASE_URL}/v1/consents`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      source: "web",
    }),
  });
  return parseResponse<ConsentRecord>(response);
}

export async function revokeConsent(payload: {
  consent_record_id: string;
  revoked_at: string;
  revocation_reason?: string;
}): Promise<ConsentRecord> {
  const response = await fetch(
    `${API_BASE_URL}/v1/consents/${payload.consent_record_id}/revoke`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revoked_at: payload.revoked_at,
        revocation_reason: payload.revocation_reason,
      }),
    },
  );
  return parseResponse<ConsentRecord>(response);
}

export async function listExportRequests(profileId: string): Promise<ExportRequest[]> {
  const response = await fetch(`${API_BASE_URL}/v1/profiles/${profileId}/export-requests`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<ExportRequest[]>(response);
}

export async function createExportRequest(profileId: string): Promise<ExportRequest> {
  const response = await fetch(`${API_BASE_URL}/v1/profiles/${profileId}/export-requests`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requested_at: new Date().toISOString() }),
  });
  return parseResponse<ExportRequest>(response);
}

export async function listDeleteRequests(profileId: string): Promise<DeleteRequest[]> {
  const response = await fetch(`${API_BASE_URL}/v1/profiles/${profileId}/delete-requests`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<DeleteRequest[]>(response);
}

export async function createDeleteRequest(profileId: string): Promise<DeleteRequest> {
  const response = await fetch(`${API_BASE_URL}/v1/profiles/${profileId}/delete-requests`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requested_at: new Date().toISOString() }),
  });
  return parseResponse<DeleteRequest>(response);
}

export function getExportDownloadUrl(profileId: string, exportRequestId: string): string {
  return `${API_BASE_URL}/v1/profiles/${profileId}/export-requests/${exportRequestId}/download`;
}

export async function listOwnedStories(profileId: string): Promise<CommunityStory[]> {
  const response = await fetch(`${API_BASE_URL}/v1/profiles/${profileId}/stories`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<CommunityStory[]>(response);
}

export async function createStory(
  profileId: string,
  payload: {
    title: string;
    summary: string;
    body: string;
    author_display_mode: CommunityStory["author_display_mode"];
    pseudonym?: string;
  },
): Promise<CommunityStory> {
  const response = await fetch(`${API_BASE_URL}/v1/profiles/${profileId}/stories`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<CommunityStory>(response);
}

export async function updateStory(
  profileId: string,
  storyId: string,
  payload: Partial<{
    title: string;
    summary: string;
    body: string;
    author_display_mode: CommunityStory["author_display_mode"];
    pseudonym: string;
    visibility_status: CommunityStory["visibility_status"];
  }>,
): Promise<CommunityStory> {
  const response = await fetch(`${API_BASE_URL}/v1/profiles/${profileId}/stories/${storyId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<CommunityStory>(response);
}

export async function submitStoryForReview(
  profileId: string,
  storyId: string,
  consentRecordId: string,
): Promise<CommunityStory> {
  const response = await fetch(`${API_BASE_URL}/v1/profiles/${profileId}/stories/${storyId}/submit`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consent_record_id: consentRecordId }),
  });
  return parseResponse<CommunityStory>(response);
}

export async function listPublicStories(): Promise<PublicCommunityStory[]> {
  const response = await fetch(`${API_BASE_URL}/v1/stories/public`, {
    cache: "no-store",
  });
  return parseResponse<PublicCommunityStory[]>(response);
}

export async function getPublicStory(slug: string): Promise<PublicCommunityStory> {
  const response = await fetch(`${API_BASE_URL}/v1/stories/public/${slug}`, {
    cache: "no-store",
  });
  return parseResponse<PublicCommunityStory>(response);
}
