"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button, Card } from "@onerhythm/ui";
import type {
  ConsentRecord,
  DeleteRequest,
  ExportRequest,
  UploadSession as ContributionUploadSession,
} from "@onerhythm/types";

import { ArtReveal } from "../../../components/contribute/art-reveal";
import { SessionActions } from "../../../components/session-actions";
import {
  createDeleteRequest,
  deleteUploadSession,
  createExportRequest,
  getExportDownloadUrl,
  listAuthSessions,
  listUploadSessions,
  revokeAuthSession,
  revokeOtherAuthSessions,
  getOwnedProfile,
  getSession,
  listConsents,
  listDeleteRequests,
  listExportRequests,
  revokeConsent,
} from "../../../lib/auth-api";
import type { AuthSessionRecord } from "../../../lib/auth-api";
import type { ProfileResponse } from "../../../lib/profile-contracts";

type DataState = {
  consents: ConsentRecord[];
  deleteRequests: DeleteRequest[];
  exportRequests: ExportRequest[];
  uploadSessions: ContributionUploadSession[];
  authSessions: AuthSessionRecord[];
  profile: ProfileResponse | null;
  profileId: string | null;
};

const initialState: DataState = {
  consents: [],
  deleteRequests: [],
  exportRequests: [],
  uploadSessions: [],
  authSessions: [],
  profile: null,
  profileId: null,
};

function formatDate(value?: string | null): string {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function consentLabel(consentType: ConsentRecord["consent_type"]): string {
  if (consentType === "mosaic_contribution") {
    return "Mosaic contribution";
  }
  if (consentType === "educational_profile") {
    return "Educational guidance";
  }
  if (consentType === "public_story_sharing") {
    return "Public story sharing";
  }
  return "Research aggregation";
}

function formatDistance(value?: number | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Not available";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value)} cm`;
}

function uploadStatusLabel(status: ContributionUploadSession["processing_status"]): string {
  if (status === "cleanup_failed") {
    return "Cleanup failed";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function uploadDistance(record: ContributionUploadSession): number | null {
  return record.contribution_distance?.distance_cm ?? record.rhythm_distance_cm ?? null;
}

export function DataControlsShell() {
  const [data, setData] = useState<DataState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletionComplete, setDeletionComplete] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const statusMessage = isPending ? "Updating data controls..." : notice || error;

  async function runPendingAction(action: () => Promise<void>) {
    setIsPending(true);
    try {
      await action();
    } finally {
      setIsPending(false);
    }
  }

  async function loadData() {
    const session = await getSession();
    const profileId = session.user?.profile_id ?? null;

    if (!profileId) {
      setData(initialState);
      setError("Create a profile before using data controls.");
      return;
    }

    const [profile, consents, exportRequests, deleteRequests, uploadSessions, authSessions] =
      await Promise.all([
      getOwnedProfile(profileId),
      listConsents(profileId),
      listExportRequests(profileId),
      listDeleteRequests(profileId),
      listUploadSessions(),
      listAuthSessions(),
    ]);

    setData({
      profile,
      profileId,
      consents,
      exportRequests,
      deleteRequests,
      uploadSessions,
      authSessions: authSessions.sessions,
    });
    setError(null);
  }

  useEffect(() => {
    void runPendingAction(async () => {
      try {
        await loadData();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Data controls could not be loaded.");
      }
    });
  }, []);

  function handleExport() {
    if (!data.profileId) {
      return;
    }

    setNotice(null);
    setError(null);
    void runPendingAction(async () => {
      try {
        const request = await createExportRequest(data.profileId as string);
        setData((current) => ({
          ...current,
          exportRequests: [request, ...current.exportRequests],
        }));
        setNotice(
          request.artifact_available
            ? "Your export bundle is ready to download."
            : "Your export request has been recorded. A download link will appear when the bundle is ready.",
        );
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Export could not be created.");
      }
    });
  }

  function handleRevokeConsent(consentRecordId: string) {
    setNotice(null);
    setError(null);
    void runPendingAction(async () => {
      try {
        const updated = await revokeConsent({
          consent_record_id: consentRecordId,
          revoked_at: new Date().toISOString(),
          revocation_reason: "user_request",
        });
        setData((current) => ({
          ...current,
          consents: current.consents.map((record) =>
            record.consent_record_id === updated.consent_record_id ? updated : record,
          ),
        }));
        setNotice("Consent was revoked. Future use of that pathway is now blocked.");
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Consent could not be revoked.");
      }
    });
  }

  function handleDelete() {
    if (!data.profileId) {
      return;
    }

    const confirmed = window.confirm(
      "This will delete your off-chain profile data, upload-session records, export artifacts, and derived public mosaic tiles for this account. Continue?",
    );
    if (!confirmed) {
      return;
    }

    setNotice(null);
    setError(null);
    void runPendingAction(async () => {
      try {
        const request = await createDeleteRequest(data.profileId as string);
        setData((current) => ({
          ...current,
          deleteRequests: [request, ...current.deleteRequests],
        }));
        setDeletionComplete(true);
        setNotice(
          "Deletion completed. Your session has been cleared and future educational or upload use is revoked.",
        );
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Deletion could not be completed.");
      }
    });
  }

  function handleDeleteUploadSession(uploadSessionId: string) {
    const confirmed = window.confirm(
      "This removes the stored upload-session record and any derived tile metadata tied to it. The original ECG has already been destroyed and cannot be replayed. Continue?",
    );
    if (!confirmed) {
      return;
    }

    setNotice(null);
    setError(null);
    void runPendingAction(async () => {
      try {
        await deleteUploadSession(uploadSessionId);
        setData((current) => ({
          ...current,
          uploadSessions: current.uploadSessions.filter(
            (record) => record.upload_session_id !== uploadSessionId,
          ),
        }));
        setNotice(
          "Upload record removed. Its retained session metadata and derived tile record are no longer stored.",
        );
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Upload record could not be removed.",
        );
      }
    });
  }

  function handleRevokeSession(sessionId: string) {
    setNotice(null);
    setError(null);
    void runPendingAction(async () => {
      try {
        const updated = await revokeAuthSession(sessionId);
        setData((current) => ({
          ...current,
          authSessions: updated.sessions,
        }));
        setNotice("That session has been ended.");
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "That session could not be ended.");
      }
    });
  }

  function handleRevokeOtherSessions() {
    setNotice(null);
    setError(null);
    void runPendingAction(async () => {
      try {
        const updated = await revokeOtherAuthSessions();
        setData((current) => ({
          ...current,
          authSessions: updated.sessions,
        }));
        setNotice("Other active sessions have been ended.");
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : "Other sessions could not be ended.",
        );
      }
    });
  }

  return (
    <main className="page-shell mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <header className="page-header">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-4">
            <p className="page-eyebrow">Data controls</p>
            <h1 className="page-title max-w-3xl">
              Export, revoke, or delete with clarity and control.
            </h1>
            <p className="page-intro max-w-2xl">
              These controls apply to your owned profile and related off-chain
              records. Public anonymized data is removed conservatively in this
              launch MVP rather than retained in a way that could confuse consent.
            </p>
          </div>
          <SessionActions />
        </div>
      </header>

      <p
        aria-atomic="true"
        aria-live={error ? "assertive" : "polite"}
        className="text-sm leading-6 text-text-secondary"
        role={error ? "alert" : "status"}
      >
        {statusMessage}
      </p>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[2rem]">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Owned profile
          </p>
          {data.profile ? (
            <dl className="mt-5 grid gap-3 text-sm leading-6 text-text-secondary">
              <div>
                <dt className="text-text-primary">Condition</dt>
                <dd>{data.profile.diagnosis_selection.free_text_condition || data.profile.diagnosis_selection.diagnosis_code}</dd>
              </div>
              <div>
                <dt className="text-text-primary">Profile updated</dt>
                <dd>{formatDate(data.profile.updated_at)}</dd>
              </div>
              <div>
                <dt className="text-text-primary">Current export requests</dt>
                <dd>{data.exportRequests.length}</dd>
              </div>
              <div>
                <dt className="text-text-primary">Current delete requests</dt>
                <dd>{data.deleteRequests.length}</dd>
              </div>
              <div>
                <dt className="text-text-primary">ECG upload records</dt>
                <dd>{data.uploadSessions.length}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm leading-6 text-text-secondary">
              {error ?? "No profile is available for this account yet."}
            </p>
          )}
        </Card>

        <Card className="rounded-[2rem]">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Actions
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button disabled={!data.profileId || isPending || deletionComplete} onClick={handleExport}>
              Export my data
            </Button>
            <Button
              disabled={!data.profileId || isPending || deletionComplete}
              onClick={handleDelete}
              variant="danger"
            >
              Request deletion
            </Button>
            <Link
              className="action-link action-link-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              href="/education"
            >
              Back to education
            </Link>
          </div>
          <p className="mt-4 text-sm leading-6 text-text-secondary">
            Export includes your retained self-reported and user-owned off-chain
            records. Delete removes off-chain profile data, upload-session
            records, export artifacts, and derived public tiles for this MVP.
          </p>
          {deletionComplete ? (
            <p className="mt-4 text-sm leading-6 text-text-secondary">
              Your session cookie has been cleared. Return to the{" "}
              <Link className="text-signal" href="/">
                homepage
              </Link>{" "}
              or sign in again only if you create a new account later.
            </p>
          ) : null}
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-[2rem]">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Consent records
          </p>
          <div className="mt-5 space-y-4">
            {data.consents.map((record) => (
              <div className="rounded-xl border border-token p-4" key={record.consent_record_id}>
                <p className="text-sm font-medium text-text-primary">{consentLabel(record.consent_type)}</p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Status: {record.status}. Effective {formatDate(record.effective_at)}.
                </p>
                <p className="text-sm leading-6 text-text-secondary">
                  {record.revoked_at ? `Revoked ${formatDate(record.revoked_at)}.` : "Currently granted."}
                </p>
                {record.status === "granted" ? (
                  <Button
                    className="mt-3"
                    disabled={isPending || deletionComplete}
                    onClick={() => handleRevokeConsent(record.consent_record_id)}
                    variant="secondary"
                  >
                    Revoke
                  </Button>
                ) : null}
              </div>
            ))}
            {!data.consents.length ? (
              <p className="text-sm leading-6 text-text-secondary">
                No consent records exist yet.
              </p>
            ) : null}
          </div>
        </Card>

        <Card className="rounded-[2rem]">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Export status
          </p>
          <div className="mt-5 space-y-4">
            {data.exportRequests.map((record) => (
              <div className="rounded-xl border border-token p-4" key={record.export_request_id}>
                <p className="text-sm font-medium text-text-primary">
                  {record.status} since {formatDate(record.requested_at)}
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {record.completed_at ? `Completed ${formatDate(record.completed_at)}.` : "Waiting for fulfillment."}
                </p>
                {record.artifact_available && data.profileId ? (
                  <a
                    className="action-link action-link-quiet mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                    href={getExportDownloadUrl(data.profileId, record.export_request_id)}
                  >
                    Download export
                  </a>
                ) : null}
              </div>
            ))}
            {!data.exportRequests.length ? (
              <p className="text-sm leading-6 text-text-secondary">
                No export requests yet.
              </p>
            ) : null}
          </div>
        </Card>

        <Card className="rounded-[2rem]">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Delete status
          </p>
          <div className="mt-5 space-y-4">
            {data.deleteRequests.map((record) => (
              <div className="rounded-xl border border-token p-4" key={record.delete_request_id}>
                <p className="text-sm font-medium text-text-primary">
                  {record.status} since {formatDate(record.requested_at)}
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {record.completed_at ? `Completed ${formatDate(record.completed_at)}.` : "Waiting for fulfillment."}
                </p>
                {record.audit_retention_reason ? (
                  <p className="text-sm leading-6 text-text-secondary">
                    {record.audit_retention_reason}
                  </p>
                ) : null}
              </div>
            ))}
            {!data.deleteRequests.length ? (
              <p className="text-sm leading-6 text-text-secondary">
                No delete requests yet.
              </p>
            ) : null}
          </div>
        </Card>
      </section>

      <section>
        <Card className="rounded-[2rem]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                ECG uploads
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
                These entries retain only session metadata and derived tile details. Retry always
                starts a fresh upload because the original ECG file is destroyed after processing.
              </p>
            </div>
            <Link
              className="action-link action-link-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              href="/contribute/upload"
            >
              Upload another ECG
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {data.uploadSessions.map((record) => {
              const distance = uploadDistance(record);
              const canOpenResult = record.processing_status === "completed";
              return (
                <div
                  className="rounded-[1.5rem] border border-token bg-cosmos-nebula/35 p-5"
                  key={record.upload_session_id}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm font-medium text-text-primary">
                          {uploadStatusLabel(record.processing_status)}
                        </p>
                        <span className="rounded-full border border-token px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                          {record.upload_format}
                        </span>
                        {distance !== null ? (
                          <span className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-signal-soft">
                            {formatDistance(distance)} shared distance
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-3 text-sm leading-6 text-text-secondary">
                        {record.user_message}
                      </p>

                      <p className="mt-3 text-sm leading-6 text-text-secondary">
                        Started {formatDate(record.started_at)}.
                        {record.completed_at ? ` Completed ${formatDate(record.completed_at)}.` : ""}
                      </p>

                      {record.contribution_distance ? (
                        <p className="text-sm leading-6 text-text-secondary">
                          Policy: {record.contribution_distance.label}.{" "}
                          {record.contribution_distance.provenance}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-3">
                        {canOpenResult ? (
                          <Link
                            className="action-link action-link-primary px-5 py-3 text-sm"
                            href={`/contribute/reveal?session=${record.upload_session_id}`}
                          >
                            Open result
                          </Link>
                        ) : null}
                        <Link
                          className="action-link action-link-secondary px-5 py-3 text-sm"
                          href="/contribute/upload"
                        >
                          {record.retryable ? "Retry with new upload" : "Upload another ECG"}
                        </Link>
                        <Button
                          disabled={isPending || deletionComplete}
                          onClick={() => handleDeleteUploadSession(record.upload_session_id)}
                          variant="ghost"
                        >
                          Delete record
                        </Button>
                      </div>
                    </div>

                    {record.result_tile ? (
                      <div className="hidden h-36 w-72 shrink-0 overflow-hidden rounded-[1.5rem] lg:block">
                        <div className="pointer-events-none">
                          <ArtReveal size="compact" tile={record.result_tile} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {!data.uploadSessions.length ? (
              <div className="rounded-[1.5rem] border border-dashed border-token p-5">
                <p className="text-sm leading-6 text-text-secondary">
                  No ECG upload records are available yet.
                </p>
              </div>
            ) : null}
          </div>
        </Card>
      </section>

      <section>
        <Card className="rounded-[2rem]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                Active sessions
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
                Sessions stay separate from your profile and consent records. End any device you
                no longer recognize without affecting your stored profile data.
              </p>
            </div>
            <Button
              disabled={isPending || deletionComplete || data.authSessions.length <= 1}
              onClick={handleRevokeOtherSessions}
              variant="secondary"
            >
              End other sessions
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            {data.authSessions.map((session) => (
              <div className="rounded-xl border border-token p-4" key={session.session_id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-text-primary">
                      {session.current ? "Current session" : "Signed-in session"}
                    </p>
                    <p className="text-sm leading-6 text-text-secondary">
                      Last seen {formatDate(session.last_seen_at)}. Expires {formatDate(session.expires_at)}.
                    </p>
                    <p className="text-sm leading-6 text-text-secondary">
                      Started {formatDate(session.created_at)}
                      {session.ip_address_hint ? ` from ${session.ip_address_hint}` : ""}.
                    </p>
                    {session.user_agent ? (
                      <p className="text-sm leading-6 text-text-secondary">{session.user_agent}</p>
                    ) : null}
                  </div>
                  {!session.current ? (
                    <Button
                      disabled={isPending || deletionComplete}
                      onClick={() => handleRevokeSession(session.session_id)}
                      variant="ghost"
                    >
                      End session
                    </Button>
                  ) : (
                    <span className="rounded-full border border-signal/35 px-3 py-1 text-xs uppercase tracking-[0.18em] text-signal-soft">
                      This device
                    </span>
                  )}
                </div>
              </div>
            ))}
            {!data.authSessions.length ? (
              <p className="text-sm leading-6 text-text-secondary">No active sessions were found.</p>
            ) : null}
          </div>
        </Card>
      </section>
    </main>
  );
}
