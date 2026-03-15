import { Card, MedicalDisclaimer } from "@onerhythm/ui";

import type { ContentEntryWithAuthors } from "../lib/content";
import { absoluteUrl } from "../lib/site";
import { PublicSiteFooter } from "./public-site-footer";
import { StructuredData } from "./structured-data";
import { SourceCard } from "./source-card";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ContentPage({ entry }: { entry: ContentEntryWithAuthors }) {
  const pathMap = {
    essay: "/stories",
    campaign_page: "/campaigns",
    support_resource: "/support",
    condition_module: "/conditions",
    research_translation: "/research",
  } as const;
  const articleUrl = absoluteUrl(`${pathMap[entry.kind]}/${entry.slug}`);
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
    about: entry.sources.map((source) => source.title),
    isAccessibleForFree: true,
  };

  return (
    <>
      <main className="page-shell mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
        <StructuredData data={structuredData} />
        <header className="hero-panel rounded-[2rem] border border-token px-6 py-8 shadow-surface sm:px-8">
          <div className="space-y-4">
            <p className="font-mono text-sm uppercase tracking-[0.28em] text-signal">
              {entry.kicker}
            </p>
            <h1 className="max-w-4xl font-display text-5xl leading-none tracking-[-0.04em] text-text-primary sm:text-6xl">
              {entry.title}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-text-secondary">
              {entry.summary}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-text-secondary">
            <span className="signal-chip">{entry.locale}</span>
            <span className="signal-chip">Published {formatDate(entry.publish_date)}</span>
            <span className="signal-chip">
              {entry.updated_date
                ? `Updated ${formatDate(entry.updated_date)}`
                : "No public revisions yet"}
            </span>
            <span className="signal-chip">Review state: {entry.review_state}</span>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-7 text-text-secondary">
            By {entry.authors.map((author) => author.name).join(", ")}
          </p>
        </header>

        {entry.disclaimer_required ? <MedicalDisclaimer /> : null}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            {entry.sections.map((section) => (
              <Card key={section.section_id}>
                <h2 className="font-display text-3xl text-text-primary">{section.heading}</h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph) => (
                    <p className="text-base leading-8 text-text-secondary" key={paragraph}>
                      {paragraph}
                    </p>
                  ))}
                </div>
                {section.bullets?.length ? (
                  <ul className="mt-5 space-y-3">
                    {section.bullets.map((bullet) => (
                      <li
                        className="surface-3 rounded-[1.1rem] border border-token px-4 py-4 text-sm leading-6 text-text-secondary"
                        key={bullet}
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
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
            </Card>

            <Card>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                Source provenance
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
            </Card>
          </div>
        </section>
      </main>
      <PublicSiteFooter className="mt-10" />
    </>
  );
}
