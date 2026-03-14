import Link from "next/link";

import { MedicalDisclaimer } from "@onerhythm/ui";

import type { ContentEntryWithAuthors } from "../lib/content";
import { absoluteUrl } from "../lib/site";
import { AnalyticsPageView } from "./analytics-page-view";
import { SourceCard } from "./source-card";
import { ResearchStatHighlight } from "./research-stat-highlight";
import { StructuredData } from "./structured-data";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ResearchTranslationPage({ entry }: { entry: ContentEntryWithAuthors }) {
  const translation = entry.research_translation;
  const articleUrl = absoluteUrl(`/research/${entry.slug}`);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    description: entry.summary,
    datePublished: entry.publish_date,
    dateModified: entry.updated_date ?? entry.publish_date,
    url: articleUrl,
    author: entry.authors.map((author) => ({
      "@type": "Person",
      name: author.name,
    })),
    publisher: {
      "@type": "Organization",
      name: "OneRhythm",
      url: absoluteUrl("/"),
    },
    about: ["arrhythmia education", "research translation", "plain language medical education"],
    isAccessibleForFree: true,
  };

  return (
    <main>
      <AnalyticsPageView
        eventName="research_article_viewed"
        properties={{
          content_id: entry.content_id,
          content_kind: entry.kind,
        }}
      />
      <StructuredData data={structuredData} />

      {/* Hero */}
      <section className="bg-midnight py-12">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
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
              <li className="text-text-secondary" aria-current="page">
                {entry.title}
              </li>
            </ol>
          </nav>

          <div className="max-w-4xl space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
              {entry.kicker}
            </p>
            <h1 className="font-display text-[2.44rem] font-bold leading-none tracking-[-0.04em] text-text-primary sm:text-5xl">
              {entry.title}
            </h1>
            <p className="text-base leading-7 text-text-secondary">{entry.summary}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-text-secondary">
            <span className="rounded-full border border-token px-3 py-1 text-xs text-text-secondary">
              {entry.locale}
            </span>
            <span className="rounded-full border border-token px-3 py-1 text-xs text-text-secondary">
              Published {formatDate(entry.publish_date)}
            </span>
            <span className="rounded-full border border-token px-3 py-1 text-xs text-text-secondary">
              {entry.updated_date ? `Updated ${formatDate(entry.updated_date)}` : "No public revisions yet"}
            </span>
          </div>

          <p className="mt-4 text-sm leading-7 text-text-secondary">
            By {entry.authors.map((author) => author.name).join(", ")}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
          <MedicalDisclaimer />

          {translation?.stat_highlights.length ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {translation.stat_highlights.map((highlight) => (
                <ResearchStatHighlight highlight={highlight} key={highlight.stat_id} />
              ))}
            </div>
          ) : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              {translation ? (
                <>
                  <div className="card-educational rounded-xl border border-token bg-cosmos p-6">
                    <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                      What the research shows
                    </p>
                    <h2 className="mt-3 font-display text-xl font-semibold text-text-primary">
                      Key finding
                    </h2>
                    <p className="mt-3 text-base leading-7 text-text-secondary">
                      {translation.key_finding}
                    </p>
                  </div>

                  <div className="card-educational rounded-xl border border-token bg-cosmos p-6">
                    <h2 className="font-display text-xl font-semibold text-text-primary">
                      What it means in plain language
                    </h2>
                    <div className="mt-3 space-y-4">
                      {translation.plain_language_meaning.map((paragraph) => (
                        <p className="text-base leading-7 text-text-secondary" key={paragraph}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="card-educational rounded-xl border border-token bg-cosmos p-6">
                    <h2 className="font-display text-xl font-semibold text-text-primary">
                      Questions to bring to your doctor
                    </h2>
                    <ul className="mt-4 space-y-3">
                      {translation.questions_for_doctor.map((question) => (
                        <li
                          className="rounded-lg border border-token bg-midnight/50 px-4 py-3 text-sm leading-6 text-text-secondary"
                          key={question}
                        >
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}

              {entry.sections.map((section) => (
                <div className="rounded-xl border border-token bg-cosmos p-6" key={section.section_id}>
                  <h2 className="font-display text-xl font-semibold text-text-primary">
                    {section.heading}
                  </h2>
                  <div className="mt-3 space-y-4">
                    {section.body.map((paragraph) => (
                      <p className="text-base leading-7 text-text-secondary" key={paragraph}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {section.bullets?.length ? (
                    <ul className="mt-4 space-y-3">
                      {section.bullets.map((bullet) => (
                        <li
                          className="rounded-lg border border-token bg-midnight/50 px-4 py-3 text-sm leading-6 text-text-secondary"
                          key={bullet}
                        >
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-token bg-cosmos p-6">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-text-tertiary">
                  Authors
                </p>
                <div className="mt-4 space-y-4">
                  {entry.authors.map((author) => (
                    <div key={author.author_id}>
                      <h2 className="text-base text-text-primary">{author.name}</h2>
                      <p className="mt-1 text-sm text-text-secondary">{author.role}</p>
                      <p className="mt-2 text-sm leading-6 text-text-secondary">{author.bio}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-token bg-cosmos p-6">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-text-tertiary">
                  Source references
                </p>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  These references show where the translation came from. They are here to support
                  understanding, not to make promises about any one person&apos;s outcome.
                </p>
                <div className="mt-4 space-y-4">
                  {entry.sources.map((source) => (
                    <SourceCard
                      key={source.source_id}
                      relevanceNote={source.relevance_note}
                      source={source}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
