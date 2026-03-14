import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MedicalDisclaimer } from "@onerhythm/ui";

import { buildPageMetadata } from "../../../../lib/metadata";
import { getResearchPulseDetail } from "../../../../lib/research-pulse-api";
import { formatResearchPulseDate } from "../../../../components/research-pulse-feed";

type Params = {
  slug: string;
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const detail = await getResearchPulseDetail(slug);
    return buildPageMetadata({
      title: `${detail.title} | Research Pulse | OneRhythm`,
      description: detail.summary,
      path: `/research/pulse/${slug}`,
      type: "article",
    });
  } catch {
    return buildPageMetadata({
      title: "Research Pulse | OneRhythm",
      description: "A reviewed feed of recent arrhythmia and electrophysiology research.",
      path: `/research/pulse/${slug}`,
      type: "article",
    });
  }
}

export default async function ResearchPulseDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  let detail;
  try {
    detail = await getResearchPulseDetail(slug);
  } catch {
    notFound();
  }

  return (
    <main>
      {/* Hero */}
      <section className="bg-midnight py-12">
        <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-12">
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
                Article
              </li>
            </ol>
          </nav>

          <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
            Research Pulse
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-[2.44rem] font-bold text-text-primary sm:text-5xl">
            {detail.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
            {detail.summary}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
            <span className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
              {detail.journal_name ?? "Peer-reviewed study"}
            </span>
            <span aria-hidden="true" className="text-text-tertiary">/</span>
            <span>{formatResearchPulseDate(detail.published_at)}</span>
            <span aria-hidden="true" className="text-text-tertiary">/</span>
            <span>{detail.study_type}</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-12">
          <MedicalDisclaimer />

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Main content column */}
            <div className="space-y-6">
              <div className="rounded-xl border border-token bg-cosmos p-6">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                  Plain-language explanation
                </p>
                <p className="mt-3 text-base leading-7 text-text-secondary">
                  {detail.plain_language_explanation}
                </p>
              </div>

              <div className="rounded-xl border border-token bg-cosmos p-6">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                  Why it matters
                </p>
                <p className="mt-3 text-base leading-7 text-text-secondary">
                  {detail.why_it_matters}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-token bg-cosmos p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                    Study type
                  </p>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">
                    {detail.study_type}
                  </p>
                </div>
                <div className="rounded-xl border border-token bg-cosmos p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                    Sample / population
                  </p>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">
                    {detail.population_sample_size ?? "Not clearly stated in the available source material."}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-token bg-cosmos p-6">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                  What researchers studied
                </p>
                <p className="mt-3 text-base leading-7 text-text-secondary">
                  {detail.what_researchers_studied}
                </p>
              </div>

              <div className="rounded-xl border border-token bg-cosmos p-6">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                  What they found
                </p>
                <p className="mt-3 text-base leading-7 text-text-secondary">
                  {detail.what_they_found}
                </p>
              </div>

              <div className="rounded-xl border border-token bg-cosmos p-6">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                  Important limits
                </p>
                <p className="mt-3 text-base leading-7 text-text-secondary">
                  {detail.important_limits}
                </p>
              </div>

              <div className="rounded-xl border border-token bg-cosmos p-6">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                  What this does not prove
                </p>
                <p className="mt-3 text-base leading-7 text-text-secondary">
                  {detail.what_this_does_not_prove}
                </p>
              </div>

              <div className="rounded-xl border border-token bg-cosmos p-6">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                  Who this may apply to
                </p>
                <p className="mt-3 text-base leading-7 text-text-secondary">
                  {detail.who_this_may_apply_to}
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="rounded-xl border border-token bg-cosmos p-6">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                  Primary source
                </p>
                <div className="mt-4 space-y-4 text-sm leading-6 text-text-secondary">
                  {detail.source_references.map((reference) => (
                    <div key={reference.source_reference_id}>
                      <p className="text-base font-medium text-text-primary">
                        {reference.source_name}
                      </p>
                      <p>{reference.title}</p>
                      <p>
                        {reference.citation?.pmid ? `PMID ${reference.citation.pmid}` : null}
                        {reference.citation?.pmid && reference.citation?.doi ? " \u00b7 " : null}
                        {reference.citation?.doi ? `DOI ${reference.citation.doi}` : null}
                      </p>
                      <a
                        className="mt-2 inline-block text-sm font-medium text-signal transition-colors duration-micro hover:text-signal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                        href={reference.source_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open publication record &rarr;
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-token bg-cosmos p-6">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                  Uncertainty notes
                </p>
                <div className="mt-4 space-y-3">
                  {detail.uncertainty_notes.length > 0 ? (
                    detail.uncertainty_notes.map((note) => (
                      <p className="text-sm leading-6 text-text-secondary" key={note}>
                        {note}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-text-secondary">
                      No additional uncertainty notes were published for this summary.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-token bg-cosmos p-6">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                  Questions to ask your doctor
                </p>
                <div className="mt-4 space-y-3">
                  {detail.questions_to_ask_your_doctor.length > 0 ? (
                    detail.questions_to_ask_your_doctor.map((question) => (
                      <p className="text-sm leading-6 text-text-secondary" key={question}>
                        {question}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-text-secondary">
                      No additional discussion prompts were published for this summary.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-token bg-cosmos p-6">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                  Source trail
                </p>
                <div className="mt-4 space-y-4">
                  {detail.claim_citations.map((citation) => (
                    <div
                      className="rounded-lg border border-token p-4"
                      key={`${citation.claim_key}-${citation.citation_label}`}
                    >
                      <p className="text-sm font-medium text-text-primary">
                        {citation.citation_label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-text-secondary">
                        Claim key: {citation.claim_key}
                        {citation.doi ? ` \u00b7 DOI ${citation.doi}` : ""}
                        {citation.pmid ? ` \u00b7 PMID ${citation.pmid}` : ""}
                      </p>
                      <a
                        className="mt-2 inline-block text-sm font-medium text-signal transition-colors duration-micro hover:text-signal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                        href={citation.source_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open source &rarr;
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link
              className="action-link action-link-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              href="/research/pulse"
            >
              &larr; Back to Research Pulse
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
