"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";

import { Card, MedicalDisclaimer } from "@onerhythm/ui";
import type { EducationalContentResponse, EvidenceSource } from "@onerhythm/types";

import { SourceCard } from "../../components/source-card";
import { SessionActions } from "../../components/session-actions";
import { getOwnedProfile, getSession } from "../../lib/auth-api";
import { trackEvent, trackSurfaceVisit } from "../../lib/analytics";

const API_BASE_URL = process.env.NEXT_PUBLIC_ONERHYTHM_API_BASE_URL ?? "http://127.0.0.1:8000";

type PageState = {
  error: string | null;
  profileId: string | null;
  profileLabel: string | null;
  response: EducationalContentResponse | null;
};

async function requestEducationalContent(profileId: string): Promise<EducationalContentResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/profiles/${profileId}/educational-content`, {
    credentials: "include",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(payload?.error?.message ?? "The educational response could not be loaded.");
  }

  return (await response.json()) as EducationalContentResponse;
}

function mapEducationalReferenceToSource(
  reference: EducationalContentResponse["source_references"][number],
): EvidenceSource {
  return {
    source_id: reference.registry_source_id ?? reference.source_reference_id,
    title: reference.title,
    source_name: reference.source_name,
    source_url: reference.source_url,
    classification: reference.source_classification,
    publisher_kind: reference.publisher_kind,
    language: "en-US",
    publish_date: reference.published_at,
    reviewed_at: reference.reviewed_at,
    reviewer_ref: reference.reviewer_ref,
    review_state: reference.approval_status === "approved" ? "published" : "reviewed",
    citation: reference.citation,
  };
}

export function EducationShell() {
  const pathname = usePathname();
  const [state, setState] = useState<PageState>({
    error: null,
    profileId: null,
    profileLabel: null,
    response: null,
  });
  const [isPending, startTransition] = useTransition();
  const statusMessage = isPending ? "Loading educational guidance..." : state.error;

  useEffect(() => {
    startTransition(async () => {
      try {
        const session = await getSession();
        const profileId = session.user?.profile_id ?? null;
        if (!profileId) {
          setState({
            error: "Create your self-reported profile before requesting educational guidance.",
            profileId: null,
            profileLabel: null,
            response: null,
          });
          return;
        }

        const [profile, response] = await Promise.all([
          getOwnedProfile(profileId),
          requestEducationalContent(profileId),
        ]);

        setState({
          error: null,
          profileId,
          profileLabel:
            profile.display_name ||
            profile.diagnosis_selection.free_text_condition ||
            profile.diagnosis_selection.diagnosis_code,
          response,
        });
      } catch (error) {
        setState({
          error: error instanceof Error ? error.message : "The educational response could not be loaded.",
          profileId: null,
          profileLabel: null,
          response: null,
        });
      }
    });
  }, []);

  useEffect(() => {
    if (!pathname || !state.response || !state.profileId) {
      return;
    }

    trackSurfaceVisit({
      surface: "education",
      path: pathname,
      viewedEvent: "educational_content_viewed",
      returnedEvent: "educational_content_returned",
      properties: {
        profile_present: true,
        content_kind: "educational_content",
        status: state.response.content_stale ? "stale" : "ready",
      },
    });
  }, [pathname, state.profileId, state.response]);

  return (
    <main className="page-shell mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <header className="page-header">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-4">
            <p className="page-eyebrow">Educational guidance</p>
            <h1 className="page-title max-w-3xl">
              Gentle, profile-based context with luminous restraint.
            </h1>
            <p className="page-intro max-w-2xl">
              This page uses only the signed-in account and its owned profile.
              Educational output remains self-reported, curated, and clearly
              outside diagnostic territory.
            </p>
          </div>
          <SessionActions />
        </div>
      </header>

      <MedicalDisclaimer />

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Request context
          </p>
          <p className="mt-4 text-sm leading-6 text-text-secondary">
            {state.profileId
              ? `Using owned profile ${state.profileLabel ?? state.profileId}.`
              : "No owned profile is available for this session yet."}
          </p>
          <p
            aria-atomic="true"
            aria-live={state.error ? "assertive" : "polite"}
            className="mt-4 text-sm text-text-secondary"
            role={state.error ? "alert" : "status"}
          >
            {statusMessage}
          </p>
        </Card>

        <Card className="surface-panel-accent">
          {state.response ? (
            <div className="space-y-8">
              <div className="rounded-[1.25rem] border border-token p-4">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                  Content provenance
                </p>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  Corpus version {state.response.retrieval_corpus_version}
                  {state.response.content_reviewed_at
                    ? ` · reviewed ${new Date(state.response.content_reviewed_at).toLocaleDateString()}`
                    : ""}
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-text-secondary">
                  {state.response.section_statuses.map((section) => (
                    <li key={section.section_key}>
                      {section.section_key}: {section.status}. {section.message}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                  Condition education
                </p>
                <h2 className="font-display text-3xl text-text-primary">
                  {state.response.condition_education.title}
                </h2>
                <p className="text-base leading-7 text-text-secondary">
                  {state.response.condition_education.summary}
                </p>
                <ul className="space-y-2 text-sm leading-6 text-text-secondary">
                  {state.response.condition_education.everyday_language_notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                  Questions for a visit
                </p>
                <ul className="space-y-2 text-sm leading-6 text-text-secondary">
                  {state.response.doctor_questions.items.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                  Recent advancements
                </p>
                <div className="space-y-4">
                  {state.response.recent_advancements.map((item) => (
                    <article className="surface-panel-soft p-4" key={item.title}>
                      <h3 className="text-base text-text-primary">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-text-secondary">{item.summary}</p>
                      <a
                        className="mt-2 inline-block text-sm text-signal"
                        href={item.source_url}
                        onClick={() =>
                          trackEvent({
                            eventName: "resource_link_clicked",
                            path: pathname ?? "/education",
                            properties: {
                              content_kind: "educational_content",
                              resource_kind: "advancement_source",
                              source_reference_id: item.source_reference_id,
                            },
                          })
                        }
                        rel="noreferrer"
                        target="_blank"
                      >
                        {item.source_name}
                      </a>
                      <p className="mt-2 text-xs leading-5 text-text-tertiary">
                        Source reference: {item.source_reference_id ?? "not linked"}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                  Mental health resources
                </p>
                <div className="space-y-4">
                  {state.response.mental_health_resources.map((item) => (
                    <article className="surface-panel-soft p-4" key={item.title}>
                      <h3 className="text-base text-text-primary">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-text-secondary">{item.description}</p>
                      <a
                        className="mt-2 inline-block text-sm text-signal"
                        href={item.url}
                        onClick={() =>
                          trackEvent({
                            eventName: "resource_link_clicked",
                            path: pathname ?? "/education",
                            properties: {
                              content_kind: "educational_content",
                              resource_kind: "support_resource",
                              source_reference_id: item.source_reference_id,
                            },
                          })
                        }
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open resource
                      </a>
                      <p className="mt-2 text-xs leading-5 text-text-tertiary">
                        Source reference: {item.source_reference_id ?? "not linked"}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                  Source references
                </p>
                <div className="space-y-4">
                  {state.response.source_references.map((reference) => (
                    <SourceCard
                      key={reference.source_reference_id}
                      relevanceNote={`Section: ${reference.content_section.replaceAll("_", " ")} · review window ${reference.monthly_update_cycle ?? "not recorded"}`}
                      source={mapEducationalReferenceToSource(reference)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                Waiting for profile-backed access
              </p>
              <p className="text-base leading-7 text-text-secondary">
                Educational content will appear here once this signed-in account
                has an owned profile and the API responds successfully.
              </p>
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
