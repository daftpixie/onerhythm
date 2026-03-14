import Link from "next/link";
import type { Metadata } from "next";

import { MedicalDisclaimer } from "@onerhythm/ui";
import type { ResearchPulseThemeKey } from "@onerhythm/types";

import {
  ResearchPulseFeedGrid,
  ResearchPulseTopicFilterBar,
} from "../../../components/research-pulse-feed";
import { buildPageMetadata } from "../../../lib/metadata";
import { listLatestResearchPulse, listTopicResearchPulse } from "../../../lib/research-pulse-api";

export const metadata: Metadata = buildPageMetadata({
  title: "Research Pulse | OneRhythm",
  description:
    "A reviewed feed of recent peer-reviewed arrhythmia and electrophysiology research translated into calm, human language.",
  path: "/research/pulse",
});
export const dynamic = "force-dynamic";

type ResearchPulseFeedState = {
  items: Awaited<ReturnType<typeof listLatestResearchPulse>>["items"];
  load_state: "ready" | "degraded";
};

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

export default async function ResearchPulsePage({
  searchParams,
}: {
  searchParams?: Promise<{ topic?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const activeThemeKey = parseThemeKey(resolvedParams?.topic);
  let feedState: ResearchPulseFeedState = { items: [], load_state: "degraded" };

  try {
    const feed = activeThemeKey
      ? await listTopicResearchPulse(activeThemeKey, { page: 1, page_size: 12 })
      : await listLatestResearchPulse({ page: 1, page_size: 12 });
    feedState = { items: feed.items, load_state: "ready" };
  } catch {
    feedState = { items: [], load_state: "degraded" };
  }

  return (
    <main>
      {/* Hero */}
      <section className="bg-midnight py-12">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
            Research Pulse
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-[2.44rem] font-bold text-text-primary sm:text-5xl">
            Recent electrophysiology research, translated with restraint.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
            This feed follows newly published peer-reviewed arrhythmia and
            electrophysiology papers, then turns them into language people can
            actually carry with them. Every item keeps its study type, source
            trail, and uncertainty visible.
          </p>
        </div>
      </section>

      {/* Context cards + filter + feed */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <MedicalDisclaimer />

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-token bg-cosmos p-6">
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                What you will find here
              </p>
              <p className="mt-3 font-display text-xl font-semibold text-text-primary">
                Study summaries that stay calm about what research can and
                cannot say.
              </p>
              <p className="mt-2 text-sm leading-7 text-text-secondary">
                Research Pulse is educational only. It does not diagnose,
                interpret ECGs, or tell anyone what treatment choice to make. It
                keeps the paper, the uncertainty, and the human translation in
                the same place.
              </p>
            </div>

            <div className="rounded-xl border border-token bg-cosmos p-6">
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-aurora">
                Signed-in view
              </p>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                If you have a self-reported profile and educational consent
                turned on, OneRhythm can sort published studies toward the
                topics most likely to matter to your lived experience.
              </p>
              <Link
                className="mt-4 inline-block text-sm font-medium text-signal transition-colors duration-micro hover:text-signal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                href="/research/pulse/for-you"
              >
                Open your research feed &rarr;
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <ResearchPulseTopicFilterBar activeThemeKey={activeThemeKey} basePath="/research/pulse" />
          </div>

          <div className="mt-8">
            <ResearchPulseFeedGrid
              items={feedState.items}
              emptyTitle={
                feedState.load_state === "degraded"
                  ? "Research Pulse is temporarily unavailable."
                  : activeThemeKey
                  ? "No reviewed publications match this topic yet."
                  : "No reviewed Research Pulse publications are loaded yet."
              }
              emptyBody={
                feedState.load_state === "degraded"
                  ? "Published research summaries and source trails will return here when the feed is available again. The evidence boundary and non-diagnostic policy remain unchanged."
                  : activeThemeKey
                  ? "This topic filter is ready, but nothing published in this environment has been reviewed into that lane yet."
                  : "The feed is ready to render reviewed publications as soon as they are ingested and published."
              }
              emptyActionHref={
                feedState.load_state === "ready" && activeThemeKey ? "/research/pulse" : undefined
              }
              emptyActionLabel={
                feedState.load_state === "ready" && activeThemeKey ? "View all topics" : undefined
              }
            />
          </div>
        </div>
      </section>
    </main>
  );
}
