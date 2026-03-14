import Link from "next/link";
import type { Metadata } from "next";

import { MedicalDisclaimer } from "@onerhythm/ui";
import type { ResearchPulseThemeKey } from "@onerhythm/types";

import {
  ResearchPulseFeedGrid,
  ResearchPulseTopicFilterBar,
} from "../../../../components/research-pulse-feed";
import { buildPageMetadata } from "../../../../lib/metadata";
import {
  listPersonalizedResearchPulse,
  ResearchPulseRequestError,
} from "../../../../lib/research-pulse-api";
import { requireAuthenticatedPage } from "../../../../lib/server-auth";

export const metadata: Metadata = buildPageMetadata({
  title: "Your Research Pulse | OneRhythm",
  description:
    "A profile-aware feed of published arrhythmia and electrophysiology research, translated into calm and human language.",
  path: "/research/pulse/for-you",
});

function parseThemeKey(value: string | undefined): ResearchPulseThemeKey | undefined {
  if (!value) {
    return undefined;
  }
  const themeKeys: ResearchPulseThemeKey[] = [
    "ablation",
    "medication",
    "device",
    "genetics",
    "mapping",
    "monitoring",
    "quality_of_life",
    "mental_health",
    "innovation",
  ];
  return themeKeys.includes(value as ResearchPulseThemeKey) ? (value as ResearchPulseThemeKey) : undefined;
}

export default async function PersonalizedResearchPulsePage({
  searchParams,
}: {
  searchParams?: Promise<{ topic?: string }>;
}) {
  const session = await requireAuthenticatedPage("/research/pulse/for-you");
  const resolvedParams = searchParams ? await searchParams : undefined;
  const activeThemeKey = parseThemeKey(resolvedParams?.topic);

  let feed = null;
  let emptyTitle = "";
  let emptyBody = "";
  let emptyActionHref: string | undefined;
  let emptyActionLabel: string | undefined;

  try {
    feed = await listPersonalizedResearchPulse({
      theme_key: activeThemeKey,
      page: 1,
      page_size: 12,
    });
  } catch (error) {
    if (error instanceof ResearchPulseRequestError && error.code === "profile_not_found") {
      emptyTitle = "Your profile needs to be in place first.";
      emptyBody =
        "Personalized Research Pulse only uses your self-reported profile. Create that profile before asking OneRhythm to sort published studies toward your experience.";
      emptyActionHref = "/onboarding";
      emptyActionLabel = "Build your profile";
    } else if (
      error instanceof ResearchPulseRequestError &&
      error.code === "educational_consent_required"
    ) {
      emptyTitle = "Educational consent is required for personalization.";
      emptyBody =
        "This feed is profile-driven educational content, so OneRhythm keeps the same consent boundary here that it uses for other educational surfaces.";
      emptyActionHref = "/account/data";
      emptyActionLabel = "Review consent controls";
    } else {
      throw error;
    }
  }

  return (
    <main>
      {/* Hero */}
      <section className="bg-midnight py-12">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-text-tertiary">
              <li>
                <Link
                  className="transition-colors duration-micro hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
                  href="/research"
                >
                  Research
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  className="transition-colors duration-micro hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
                  href="/research/pulse"
                >
                  Pulse
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-text-secondary" aria-current="page">
                For You
              </li>
            </ol>
          </nav>

          <p className="font-mono text-xs uppercase tracking-[0.1em] text-aurora">
            For You
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-[2.44rem] font-bold text-text-primary sm:text-5xl">
            Published research, sorted toward your self-reported context.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
            This feed only uses your profile, not your ECG, to bring more
            relevant published studies closer to the top. It stays educational,
            source-backed, and explicit about uncertainty.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <MedicalDisclaimer />

          <div className="mt-8 rounded-xl border border-token bg-cosmos p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                  Personalization boundary
                </p>
                <p className="max-w-3xl text-sm leading-7 text-text-secondary">
                  Signed in as {session.user?.email}. Ranking uses your
                  self-reported diagnosis, symptoms, treatment history,
                  emotional context, and narrative only.
                </p>
              </div>
              <Link
                className="action-link action-link-secondary max-w-max shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                href="/research/pulse"
              >
                View the public feed
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <ResearchPulseTopicFilterBar activeThemeKey={activeThemeKey} basePath="/research/pulse/for-you" />
          </div>

          <div className="mt-8">
            <ResearchPulseFeedGrid
              items={feed?.items ?? []}
              emptyTitle={emptyTitle || "No personalized publications are ready yet."}
              emptyBody={
                emptyBody ||
                "Your signed-in feed is ready, but there are no published Research Pulse items matching your current profile and topic filters in this environment."
              }
              emptyActionHref={emptyActionHref}
              emptyActionLabel={emptyActionLabel}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
