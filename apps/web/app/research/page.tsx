import type { Metadata } from "next";
import Link from "next/link";

import { Card, MedicalDisclaimer } from "@onerhythm/ui";

import { AnalyticsPageView } from "../../components/analytics-page-view";
import { buildPageMetadata } from "../../lib/metadata";
import { ResearchSummaryGrid } from "../../components/research-summary-grid";
import { listContentByKind } from "../../lib/content";

export const metadata: Metadata = buildPageMetadata({
  title: "Research | OneRhythm",
  description:
    "Reviewed research translation articles that stay non-diagnostic while making the evidence easier to understand in plain language.",
  path: "/research",
});

const principles = [
  {
    label: "Data first",
    body: "Each page begins with sourced material and makes the claim legible before moving into interpretation.",
    accent: "text-signal",
  },
  {
    label: "Human language",
    body: "The point of translation is to make the research easier to carry into real life, not to flatten it into slogans.",
    accent: "text-signal",
  },
  {
    label: "Boundaries",
    body: "These pages are educational. They do not diagnose, recommend treatment, or promise outcomes.",
    accent: "text-signal",
  },
];

export default function ResearchPage() {
  const entries = listContentByKind("research_translation");

  return (
    <main>
      <AnalyticsPageView
        eventName="research_hub_viewed"
        properties={{ content_kind: "research_hub" }}
      />

      {/* Hero */}
      <section className="bg-midnight py-12">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
            Research
          </p>
          <h1 className="mt-3 font-display text-[2.44rem] font-bold text-text-primary sm:text-5xl">
            What the research shows
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
            These translations start with the evidence and carry it into plain
            language. The aim is not to prove that OneRhythm has a mission. The
            aim is to show the public record behind the burden this platform is
            responding to.
          </p>
        </div>
      </section>

      {/* Principles + Pulse CTA */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <MedicalDisclaimer />

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((p) => (
              <div
                className="rounded-xl border border-token bg-cosmos p-6"
                key={p.label}
              >
                <p className={`font-mono text-xs uppercase tracking-[0.1em] ${p.accent}`}>
                  {p.label}
                </p>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  {p.body}
                </p>
              </div>
            ))}

            <div className="rounded-xl border border-token bg-cosmos p-6">
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-aurora">
                Research Pulse
              </p>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                A rolling feed for newly published peer-reviewed studies,
                translated with the same provenance and educational guardrails.
              </p>
              <Link
                className="mt-4 inline-block text-sm font-medium text-signal transition-colors duration-micro hover:text-signal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                href="/research/pulse"
              >
                Open Research Pulse &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Research translation articles */}
      <section className="bg-midnight py-12">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
            Translations
          </p>
          <h2 className="mt-3 font-display text-[1.95rem] font-semibold text-text-primary sm:text-4xl">
            Research Articles
          </h2>
          <div className="mt-8">
            <ResearchSummaryGrid entries={entries} />
          </div>
        </div>
      </section>
    </main>
  );
}
