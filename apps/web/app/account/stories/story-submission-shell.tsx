"use client";

import { useEffect, useState, useTransition } from "react";

import { Button, Card, FieldWrapper, Input, MedicalDisclaimer, Select } from "@onerhythm/ui";
import type { CommunityStory, ConsentRecord } from "@onerhythm/types";

import { SessionActions } from "../../../components/session-actions";
import {
  createConsent,
  createStory,
  getOwnedProfile,
  getSession,
  listConsents,
  listOwnedStories,
  submitStoryForReview,
  updateStory,
} from "../../../lib/auth-api";

type StoryState = {
  profileId: string | null;
  stories: CommunityStory[];
  consents: ConsentRecord[];
};

type FormState = {
  title: string;
  summary: string;
  body: string;
  author_display_mode: CommunityStory["author_display_mode"];
  pseudonym: string;
  consent_to_public_story: boolean;
};

const initialForm: FormState = {
  title: "",
  summary: "",
  body: "",
  author_display_mode: "first_name",
  pseudonym: "",
  consent_to_public_story: false,
};

function formatDate(value?: string): string {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function latestGrantedStoryConsent(consents: ConsentRecord[]): ConsentRecord | null {
  return (
    consents.find(
      (record) =>
        record.consent_type === "public_story_sharing" &&
        record.status === "granted" &&
        !record.revoked_at,
    ) ?? null
  );
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-cosmos text-text-tertiary" },
  pending_review: { label: "In Review", className: "bg-cosmos text-yellow-400" },
  changes_requested: { label: "Changes Requested", className: "bg-cosmos text-pulse" },
  approved: { label: "Published", className: "bg-cosmos text-emerald-400" },
  rejected: { label: "Rejected", className: "bg-cosmos text-pulse" },
};

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGES[status] ?? STATUS_BADGES.draft;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
      {badge.label}
    </span>
  );
}

export function StorySubmissionShell() {
  const [data, setData] = useState<StoryState>({ profileId: null, stories: [], consents: [] });
  const [form, setForm] = useState<FormState>(initialForm);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pseudonymError, setPseudonymError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    const session = await getSession();
    const profileId = session.user?.profile_id ?? null;
    if (!profileId) {
      setError("Create your profile before submitting a community story.");
      return;
    }

    await getOwnedProfile(profileId);
    const [stories, consents] = await Promise.all([
      listOwnedStories(profileId),
      listConsents(profileId),
    ]);
    setData({ profileId, stories, consents });
  }

  useEffect(() => {
    startTransition(async () => {
      try {
        await load();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Stories could not be loaded.");
      }
    });
  }, []);

  function loadDraftIntoForm(story: CommunityStory) {
    setForm({
      title: story.title,
      summary: story.summary,
      body: story.body,
      author_display_mode: story.author_display_mode,
      pseudonym: story.pseudonym ?? "",
      consent_to_public_story: false,
    });
    setActiveStoryId(story.story_id);
    setNotice(null);
    setError(null);
    setPseudonymError(null);
  }

  function resetForm() {
    setForm(initialForm);
    setActiveStoryId(null);
    setNotice(null);
    setError(null);
    setPseudonymError(null);
  }

  function saveDraft(submitForReview: boolean) {
    if (!data.profileId) {
      setError("Create your profile before submitting a story.");
      return;
    }

    // Pseudonym validation (Audit Finding #2)
    if (form.author_display_mode === "pseudonym" && !form.pseudonym.trim()) {
      setPseudonymError("A pseudonym is required when publishing under a pseudonym.");
      return;
    }
    setPseudonymError(null);

    setError(null);
    setNotice(null);

    startTransition(async () => {
      try {
        const basePayload = {
          title: form.title,
          summary: form.summary,
          body: form.body,
          author_display_mode: form.author_display_mode,
          pseudonym: form.author_display_mode === "pseudonym" ? form.pseudonym : undefined,
        };

        const story = activeStoryId
          ? await updateStory(data.profileId as string, activeStoryId, basePayload)
          : await createStory(data.profileId as string, basePayload);

        let nextStory = story;
        let nextConsents = data.consents;

        if (submitForReview) {
          if (!form.consent_to_public_story && !latestGrantedStoryConsent(data.consents)) {
            throw new Error("Explicit consent is required before a story can be submitted for public review.");
          }

          let consent = latestGrantedStoryConsent(data.consents);
          if (!consent) {
            consent = await createConsent({
              profile_id: data.profileId as string,
              consent_type: "public_story_sharing",
              status: "granted",
              policy_version: "launch-v1",
              locale: "en-US",
              effective_at: new Date().toISOString(),
            });
            nextConsents = [consent, ...data.consents];
          }

          nextStory = await submitStoryForReview(
            data.profileId as string,
            story.story_id,
            consent.consent_record_id,
          );
        }

        const reloadedStories = await listOwnedStories(data.profileId as string);
        setData((current) => ({
          ...current,
          stories: reloadedStories,
          consents: nextConsents,
        }));
        setActiveStoryId(nextStory.story_id);
        setNotice(
          submitForReview
            ? "Your story was submitted for review. It will stay private until a maintainer approves it."
            : "Draft saved. It remains private until you explicitly submit it for review.",
        );
      } catch (submitError) {
        setError(
          submitError instanceof Error ? submitError.message : "The story could not be saved.",
        );
      }
    });
  }

  return (
    <main>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[30vh] -z-10"
        style={{ background: "var(--gradient-void)" }}
      />

      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 lg:px-12">
        {/* Header */}
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal">
              Community stories
            </p>
            <h1 className="max-w-3xl font-display text-3xl font-bold text-text-primary sm:text-4xl">
              Tell the emotional truth without being pushed into a clinical script.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-text-secondary">
              Community stories are personal narratives, not medical advice.
              Nothing is published without explicit consent and maintainer review.
            </p>
          </div>
          <SessionActions />
        </header>

        <div className="mt-8">
          <MedicalDisclaimer />
        </div>

        {/* Status messages */}
        {(notice || error) && (
          <p
            aria-live="polite"
            className={`mt-6 rounded-lg border p-3 text-sm ${
              error
                ? "border-pulse/30 bg-pulse/5 text-pulse"
                : "border-signal/30 bg-signal/5 text-signal"
            }`}
          >
            {isPending ? "Updating your story..." : error || notice}
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Form */}
          <Card>
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                {activeStoryId ? "Edit story" : "New story"}
              </p>
              {activeStoryId && (
                <button
                  className="text-xs text-signal hover:underline"
                  onClick={resetForm}
                >
                  Start new story
                </button>
              )}
            </div>
            <div className="mt-5 space-y-5">
              <FieldWrapper
                description="A calm title that names the experience without turning it into advice."
                htmlFor="story_title"
                label="Title"
              >
                <Input
                  id="story_title"
                  name="story_title"
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  value={form.title}
                />
              </FieldWrapper>

              <FieldWrapper
                description="A short summary for public listing surfaces if the story is approved."
                htmlFor="story_summary"
                label="Summary"
              >
                <textarea
                  className="form-area min-h-28"
                  id="story_summary"
                  onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                  value={form.summary}
                />
              </FieldWrapper>

              <FieldWrapper
                description="Focus on lived experience, impact, and meaning. Do not use this as a clinical advice surface."
                htmlFor="story_body"
                label="Story"
              >
                <textarea
                  className="form-area min-h-56"
                  id="story_body"
                  onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                  value={form.body}
                />
              </FieldWrapper>

              <FieldWrapper
                description="Choose how your name should appear if the story is approved."
                htmlFor="author_display_mode"
                label="Author display"
              >
                <Select
                  id="author_display_mode"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      author_display_mode: event.target.value as CommunityStory["author_display_mode"],
                    }))
                  }
                  value={form.author_display_mode}
                >
                  <option value="first_name">First name or display name</option>
                  <option value="pseudonym">Pseudonym</option>
                </Select>
              </FieldWrapper>

              {form.author_display_mode === "pseudonym" && (
                <FieldWrapper
                  description="Required when publishing under a pseudonym."
                  htmlFor="pseudonym"
                  label="Pseudonym"
                >
                  <Input
                    id="pseudonym"
                    name="pseudonym"
                    onChange={(event) => {
                      setForm((current) => ({ ...current, pseudonym: event.target.value }));
                      if (pseudonymError) setPseudonymError(null);
                    }}
                    value={form.pseudonym}
                  />
                  {pseudonymError && (
                    <p className="mt-1 text-xs text-pulse">{pseudonymError}</p>
                  )}
                </FieldWrapper>
              )}

              <label className="flex gap-3 rounded-lg border border-token bg-cosmos p-4">
                <input
                  checked={form.consent_to_public_story}
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-pulse)]"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      consent_to_public_story: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span className="text-sm leading-6 text-text-secondary">
                  I explicitly consent to public story sharing and understand that
                  the story will remain private until a maintainer reviews it.
                  Once published, your story will be publicly visible. Consent
                  revocation is a manual process — contact us to request removal.
                </span>
              </label>

              <div className="flex flex-wrap gap-3">
                <Button disabled={isPending} onClick={() => saveDraft(false)}>
                  Save private draft
                </Button>
                <Button disabled={isPending} onClick={() => saveDraft(true)} variant="secondary">
                  Submit for review
                </Button>
              </div>
            </div>
          </Card>

          {/* Story list with status rail */}
          <Card>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
              Your stories
            </p>
            <div className="mt-5 space-y-4">
              {data.stories.map((story) => (
                <article
                  className={`rounded-lg border p-4 transition-colors ${
                    activeStoryId === story.story_id
                      ? "border-signal/50 bg-signal/5"
                      : "border-token bg-cosmos"
                  }`}
                  key={story.story_id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-medium text-text-primary">{story.title}</h2>
                    <StatusBadge status={story.review_status} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">
                    {story.summary}
                  </p>
                  <p className="mt-3 text-xs text-text-tertiary">
                    Updated {formatDate(story.updated_at)}
                    {story.published_at ? ` · Published ${formatDate(story.published_at)}` : ""}
                  </p>

                  {/* Moderator note (Audit Finding #5) */}
                  {story.moderator_note && story.review_status === "changes_requested" && (
                    <div className="mt-3 rounded-md border-l-2 border-yellow-400 bg-cosmos p-3">
                      <p className="text-xs font-medium text-yellow-400">Moderator note</p>
                      <p className="mt-1 text-sm leading-6 text-text-secondary">
                        {story.moderator_note}
                      </p>
                    </div>
                  )}

                  {/* Edit draft button (Audit Finding #5) */}
                  {(story.review_status === "draft" || story.review_status === "changes_requested") && (
                    <button
                      className="mt-3 text-xs font-medium text-signal hover:underline"
                      onClick={() => loadDraftIntoForm(story)}
                    >
                      Edit {story.review_status === "draft" ? "Draft" : "Story"}
                    </button>
                  )}
                </article>
              ))}
              {!data.stories.length && (
                <p className="text-sm leading-6 text-text-secondary">
                  No story drafts exist yet.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
