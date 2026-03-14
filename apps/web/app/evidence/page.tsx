import type { Metadata } from "next";
import { Suspense } from "react";

import { EvidenceHero } from "../../components/evidence/evidence-hero";
import { EvidenceMetrics } from "../../components/evidence/evidence-metrics";
import { EvidenceResearchTranslations } from "../../components/evidence/evidence-research-translations";
import { EvidencePulsePreviewContent } from "../../components/evidence/evidence-pulse-preview";
import { EvidenceSourceRegistry } from "../../components/evidence/evidence-source-registry";
import { listLatestResearchPulse } from "../../lib/research-pulse-api";
import { buildPageMetadata } from "../../lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Research & Evidence",
  description:
    "How OneRhythm handles evidence, provenance, reviewed updates, and research translation in public-facing content and educational surfaces.",
  path: "/evidence",
});

export const dynamic = "force-dynamic";

async function PulsePreviewWithData() {
  try {
    const feed = await listLatestResearchPulse({ page: 1, page_size: 3 });
    return <EvidencePulsePreviewContent items={feed.items} />;
  } catch {
    return <EvidencePulsePreviewContent items={[]} />;
  }
}

function PulsePreviewFallback() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-40 rounded-full bg-cosmos" />
          <div className="h-8 w-64 rounded-xl bg-cosmos" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="h-48 rounded-xl border border-token bg-cosmos" key={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function EvidencePage() {
  return (
    <main>
      <EvidenceHero />
      <EvidenceMetrics />
      <EvidenceResearchTranslations />
      <Suspense fallback={<PulsePreviewFallback />}>
        <PulsePreviewWithData />
      </Suspense>
      <EvidenceSourceRegistry />
    </main>
  );
}
