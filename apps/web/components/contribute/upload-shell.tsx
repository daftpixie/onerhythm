"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { FieldWrapper, Input, MedicalDisclaimer } from "@onerhythm/ui";
import type { ConsentRecord, UploadFormat } from "@onerhythm/types";

import { ProcessingState } from "./processing-state";
import {
  getSession,
  listConsents,
  processUploadSession,
  startUploadSession,
} from "../../lib/auth-api";

type UploadState = "loading" | "idle" | "uploading" | "processing" | "failed";

type EligibilityState = {
  profileId: string | null;
  mosaicConsentId: string | null;
  error: string | null;
};

type TileAttributionState = {
  shareFirstName: boolean;
  firstName: string;
  shareLocation: boolean;
  locationLabel: string;
};

function latestGrantedMosaicConsent(consents: ConsentRecord[]): ConsentRecord | null {
  return (
    consents.find(
      (record) =>
        record.consent_type === "mosaic_contribution" &&
        record.status === "granted" &&
        !record.revoked_at,
    ) ?? null
  );
}

function detectUploadFormat(file: File): UploadFormat | null {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }
  if (file.type === "image/png" || file.name.toLowerCase().endsWith(".png")) {
    return "png";
  }
  if (
    file.type === "image/jpeg" ||
    file.name.toLowerCase().endsWith(".jpg") ||
    file.name.toLowerCase().endsWith(".jpeg")
  ) {
    return "jpeg";
  }
  return null;
}

export function UploadShell() {
  const router = useRouter();
  const [state, setState] = useState<UploadState>("loading");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityState>({
    profileId: null,
    mosaicConsentId: null,
    error: null,
  });
  const [tileAttribution, setTileAttribution] = useState<TileAttributionState>({
    shareFirstName: false,
    firstName: "",
    shareLocation: false,
    locationLabel: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadEligibility() {
      try {
        const session = await getSession();
        const profileId = session.user?.profile_id ?? null;

        if (!profileId) {
          if (!cancelled) {
            setEligibility({
              profileId: null,
              mosaicConsentId: null,
              error: "Complete onboarding before contributing to the Heart Mosaic.",
            });
            setState("failed");
          }
          return;
        }

        const consents = await listConsents(profileId);
        const mosaicConsent = latestGrantedMosaicConsent(consents);

        if (!cancelled) {
          setEligibility({
            profileId,
            mosaicConsentId: mosaicConsent?.consent_record_id ?? null,
            error: mosaicConsent
              ? null
              : "Mosaic contribution consent is still required before uploading an ECG.",
          });
          setState(mosaicConsent ? "idle" : "failed");
        }
      } catch (error) {
        if (!cancelled) {
          setEligibility({
            profileId: null,
            mosaicConsentId: null,
            error:
              error instanceof Error
                ? error.message
                : "The contribution flow could not verify your account state.",
          });
          setState("failed");
        }
      }
    }

    void loadEligibility();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      const uploadFormat = detectUploadFormat(file);
      const nextTileAttribution: {
        contributor_name?: string;
        contributor_location?: string;
      } = {};

      if (!uploadFormat) {
        setMessage("Upload a JPEG, PNG, or single-page PDF.");
        setState("idle");
        return;
      }

      if (!eligibility.profileId || !eligibility.mosaicConsentId) {
        setMessage(
          eligibility.error ??
            "Mosaic contribution consent is required before uploading an ECG.",
        );
        setState("failed");
        return;
      }

      if (tileAttribution.shareFirstName) {
        const contributorName = tileAttribution.firstName.trim();
        if (!contributorName) {
          setMessage("Add a first name or turn off name sharing for this tile.");
          setState("idle");
          return;
        }
        nextTileAttribution.contributor_name = contributorName;
      }

      if (tileAttribution.shareLocation) {
        const contributorLocation = tileAttribution.locationLabel.trim();
        if (!contributorLocation) {
          setMessage("Add a location label or turn off location sharing for this tile.");
          setState("idle");
          return;
        }
        nextTileAttribution.contributor_location = contributorLocation;
      }

      setFileName(file.name);
      setMessage(null);
      setState("uploading");

      try {
        const uploadSession = await startUploadSession({
          profile_id: eligibility.profileId,
          upload_format: uploadFormat,
          consent_record_ids: [eligibility.mosaicConsentId],
        });

        setState("processing");

        const processedSession = await processUploadSession({
          upload_session_id: uploadSession.upload_session_id,
          file,
          processing_pipeline_version: "ecg-contribution-v1",
          tile_attribution:
            Object.keys(nextTileAttribution).length > 0
              ? nextTileAttribution
              : undefined,
        });

        if (processedSession.processing_status !== "completed") {
          throw new Error(processedSession.user_message || processedSession.status_detail);
        }

        router.push(`/contribute/reveal?session=${processedSession.upload_session_id}`);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "The ECG could not be processed safely. Please try again.",
        );
        setState("failed");
      }
    },
    [
      eligibility.error,
      eligibility.mosaicConsentId,
      eligibility.profileId,
      router,
      tileAttribution.firstName,
      tileAttribution.locationLabel,
      tileAttribution.shareFirstName,
      tileAttribution.shareLocation,
    ],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      const file = event.dataTransfer.files[0];
      if (file) {
        void handleFile(file);
      }
    },
    [handleFile],
  );

  const onFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        void handleFile(file);
      }
    },
    [handleFile],
  );

  const statusMessage =
    message ??
    eligibility.error ??
    "JPEG, PNG, or single-page PDF. The original file is destroyed after processing.";

  return (
    <main className="relative flex min-h-[80dvh] flex-col items-center justify-center px-6 py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-void)" }}
      />

      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-[2rem] border border-token bg-cosmos/85 p-8 shadow-surface backdrop-blur-sm">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal">
            ECG contribution
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold text-text-primary sm:text-4xl">
            Upload a supported ECG document and turn it into a shared tile.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
            We accept JPEG, PNG, and single-page PDF uploads. OneRhythm strips
            metadata, redacts visible identifiers, transforms the file into an
            abstract tile, then destroys the original upload.
          </p>

          <p
            aria-live="polite"
            className={`mt-6 rounded-2xl border px-4 py-3 text-sm leading-6 ${
              state === "failed"
                ? "border-pulse/40 bg-pulse/10 text-pulse"
                : "border-token bg-cosmos-nebula/65 text-text-secondary"
            }`}
          >
            {statusMessage}
          </p>

          {state === "loading" ? (
            <div className="mt-8">
              <ProcessingState currentStage="uploading" fileName="your ECG" />
            </div>
          ) : null}

          {state === "idle" ? (
            <div
              className={`mt-8 flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed px-8 text-center transition-colors ${
                dragOver
                  ? "border-signal bg-signal/6"
                  : "border-token bg-cosmos-nebula/60 hover:border-signal/55"
              }`}
              onDrop={onDrop}
              onDragLeave={() => setDragOver(false)}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
            >
              <svg
                className="h-12 w-12 text-signal"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <p className="mt-4 font-display text-2xl text-text-primary">
                Drag your ECG here
              </p>
              <p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">
                The contribution metric is based on the ECG document layout
                policy, not on diagnostic waveform interpretation.
              </p>

              <label className="action-link action-link-primary mt-6 cursor-pointer px-6 py-3 text-base">
                Choose a file
                <input
                  accept="image/jpeg,image/png,application/pdf"
                  className="sr-only"
                  onChange={onFileSelect}
                  type="file"
                />
              </label>
            </div>
          ) : null}

          {(state === "idle" || (state === "failed" && !eligibility.error)) ? (
            <div className="mt-6 rounded-[1.5rem] border border-token bg-cosmos-nebula/55 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-tertiary">
                Optional tile attribution
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
                These labels are typed by you, never extracted from the ECG, and only
                appear on this contribution tile if you opt in.
              </p>

              <div className="mt-5 space-y-4">
                <label className="flex min-h-11 items-start gap-3 rounded-xl border border-white/8 bg-black/15 px-4 py-3">
                  <input
                    checked={tileAttribution.shareFirstName}
                    className="mt-1 h-4 w-4 accent-[var(--color-signal)]"
                    onChange={(event) => {
                      setTileAttribution((current) => ({
                        ...current,
                        shareFirstName: event.target.checked,
                      }));
                      setMessage(null);
                    }}
                    type="checkbox"
                  />
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-text-primary">
                      Include my first name
                    </span>
                    <span className="block text-sm leading-6 text-text-secondary">
                      Shared as a short public label on the tile. We only use the first
                      word you enter.
                    </span>
                  </span>
                </label>

                {tileAttribution.shareFirstName ? (
                  <FieldWrapper
                    description="Use a first name only."
                    htmlFor="tile-first-name"
                    label="First name"
                  >
                    <Input
                      id="tile-first-name"
                      maxLength={32}
                      onChange={(event) => {
                        const value = event.target.value;
                        setTileAttribution((current) => ({
                          ...current,
                          firstName: value,
                        }));
                        setMessage(null);
                      }}
                      placeholder="Matthew"
                      value={tileAttribution.firstName}
                    />
                  </FieldWrapper>
                ) : null}

                <label className="flex min-h-11 items-start gap-3 rounded-xl border border-white/8 bg-black/15 px-4 py-3">
                  <input
                    checked={tileAttribution.shareLocation}
                    className="mt-1 h-4 w-4 accent-[var(--color-signal)]"
                    onChange={(event) => {
                      setTileAttribution((current) => ({
                        ...current,
                        shareLocation: event.target.checked,
                      }));
                      setMessage(null);
                    }}
                    type="checkbox"
                  />
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-text-primary">
                      Include where I&apos;m from
                    </span>
                    <span className="block text-sm leading-6 text-text-secondary">
                      Keep this broad, like a city, state, or country.
                    </span>
                  </span>
                </label>

                {tileAttribution.shareLocation ? (
                  <FieldWrapper
                    description="Example: Burlington, VT or Australia."
                    htmlFor="tile-location-label"
                    label="Location"
                  >
                    <Input
                      id="tile-location-label"
                      maxLength={64}
                      onChange={(event) => {
                        const value = event.target.value;
                        setTileAttribution((current) => ({
                          ...current,
                          locationLabel: value,
                        }));
                        setMessage(null);
                      }}
                      placeholder="Burlington, VT"
                      value={tileAttribution.locationLabel}
                    />
                  </FieldWrapper>
                ) : null}
              </div>
            </div>
          ) : null}

          {(state === "uploading" || state === "processing") && (
            <div className="mt-8">
              <ProcessingState
                currentStage={state === "uploading" ? "uploading" : "transforming"}
                fileName={fileName ?? "your ECG"}
              />
            </div>
          )}

          {state === "failed" ? (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                className="action-link action-link-primary px-6 py-3 text-base"
                onClick={() => {
                  setMessage(null);
                  setState(eligibility.error ? "failed" : "idle");
                }}
                type="button"
              >
                Try again
              </button>
              <Link
                className="action-link action-link-quiet px-6 py-3 text-base"
                href={eligibility.profileId ? "/account/data" : "/onboarding"}
              >
                {eligibility.profileId ? "Review consent" : "Finish onboarding"}
              </Link>
            </div>
          ) : null}

          <div className="mt-8">
            <MedicalDisclaimer />
          </div>

          <div className="mt-8">
            <Link
              className="text-sm text-text-tertiary transition-colors hover:text-text-secondary"
              href="/contribute/consent"
            >
              Back
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
