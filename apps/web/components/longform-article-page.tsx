import Link from "next/link";

import { MedicalDisclaimer } from "@onerhythm/ui";

import type { ContentEntryWithAuthors } from "../lib/content";
import { absoluteUrl } from "../lib/site";
import { AnalyticsPageView } from "./analytics-page-view";
import { BrandLogo } from "./brand-logo";
import { PublicSiteFooter } from "./public-site-footer";
import { SourceCard } from "./source-card";
import { StructuredData } from "./structured-data";
import { ArticleDocumentActions } from "./longform/article-document-actions";
import { CrisisResourcesCard } from "./longform/crisis-resources-card";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

const storyCoverClassMap = {
  aurora:
    "bg-[radial-gradient(circle_at_top,rgba(167,139,250,0.24),transparent_46%),linear-gradient(160deg,rgba(20,25,44,0.98),rgba(15,19,34,0.94))]",
  pulse:
    "bg-[radial-gradient(circle_at_top,rgba(255,45,85,0.22),transparent_46%),linear-gradient(160deg,rgba(20,25,44,0.98),rgba(15,19,34,0.94))]",
  signal:
    "bg-[radial-gradient(circle_at_top,rgba(0,212,255,0.2),transparent_46%),linear-gradient(160deg,rgba(20,25,44,0.98),rgba(15,19,34,0.94))]",
} as const;

export function LongformArticlePage({ entry }: { entry: ContentEntryWithAuthors }) {
  if (!entry.article) {
    return null;
  }

  const article = entry.article;
  const storyUrl = absoluteUrl(`/stories/${entry.slug}`);
  const headerChips = [entry.kicker, article.reading_time, article.hero_label].filter(
    (value, index, array) => array.indexOf(value) === index,
  );
  const displayByline = entry.authors
    .map((author) => (author.author_id === "onerhythm-editorial" ? "OneRhythm" : author.name))
    .join(", ");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    description: article.share.meta_description,
    datePublished: entry.publish_date,
    dateModified: entry.updated_date ?? entry.publish_date,
    url: storyUrl,
    image: absoluteUrl(article.share.og_image_path),
    author: entry.authors.map((author) => ({
      "@type": "Person",
      name: author.name,
    })),
    publisher: {
      "@type": "Organization",
      name: "OneRhythm",
      url: absoluteUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/brand/logos/onerhythm-mark-white-512.png"),
      },
    },
    about: entry.sources.map((source) => source.title),
    isAccessibleForFree: true,
  };

  return (
    <>
      <main>
        <AnalyticsPageView
          eventName="story_article_viewed"
          properties={{
            content_id: entry.content_id,
            content_kind: entry.kind,
            surface: "stories",
          }}
        />
        <StructuredData data={structuredData} />

        <article className="page-shell print-article-shell mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
          <header className="hero-panel overflow-hidden rounded-[2rem] border border-token shadow-surface">
            <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[minmax(0,1.08fr)_22rem]">
              <div className="min-w-0">
                <BrandLogo
                  className="w-fit px-0 py-0 hover:bg-transparent"
                  size="header"
                  variant="wordmark"
                  wordmarkTone={article.document.wordmark_tone}
                />

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {headerChips.map((chip) => (
                    <span className="signal-chip text-xs" key={chip}>
                      {chip}
                    </span>
                  ))}
                </div>

                <h1 className="mt-6 max-w-4xl font-display text-4xl leading-none tracking-[-0.04em] text-text-primary sm:text-5xl xl:text-6xl">
                  {entry.title}
                </h1>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-text-secondary">
                  {article.dek}
                </p>

                <div className="mt-6 flex flex-wrap gap-3 text-sm text-text-secondary">
                  <span className="signal-chip">Published {formatDate(entry.publish_date)}</span>
                  <span className="signal-chip">
                    {entry.updated_date
                      ? `Updated ${formatDate(entry.updated_date)}`
                      : "No public revisions yet"}
                  </span>
                  <span className="signal-chip">
                    By {displayByline}
                  </span>
                </div>

                <div className="article-print-exclude mt-8 flex flex-wrap gap-3">
                  <Link
                    className="action-link action-link-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                    href="#article-sources"
                  >
                    View references
                  </Link>
                </div>
              </div>

              <div className="space-y-5">
                <div
                  className={`overflow-hidden rounded-[1.5rem] border border-token ${storyCoverClassMap[article.homepage_feature.accent_tone]}`}
                >
                  <div className="relative min-h-[20rem] p-6 sm:p-7">
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,26,0.04),rgba(10,14,26,0.2)),linear-gradient(0deg,rgba(10,14,26,0.82),transparent_36%)]" />
                    <div className="relative flex h-full flex-col justify-between">
                      <div>
                        <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-text-tertiary">
                          OneRhythm publishing
                        </p>
                        <div className="mt-5 w-16 border-t border-token/70" />
                      </div>

                      <div>
                        <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-text-secondary">
                          {article.hero_label}
                        </p>
                        <p className="mt-4 max-w-[14ch] font-display text-[2.25rem] leading-[0.96] tracking-[-0.05em] text-text-primary">
                          {entry.title}
                        </p>
                        <p className="mt-4 max-w-[18rem] text-sm leading-6 text-text-secondary">
                          {article.share.pull_quotes[0]}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="surface-panel-soft p-5 sm:p-6">
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                    Editorial note
                  </p>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">{article.audience}</p>
                </div>

                <ArticleDocumentActions printLabel={article.document.print_label} />
              </div>
            </div>
          </header>

          {entry.disclaimer_required ? <MedicalDisclaimer /> : null}

          <div className="mx-auto w-full max-w-3xl">
            {entry.sections.map((section, index) => (
              <section
                className={`py-10 ${index === 0 ? "pt-0" : "border-t border-token/80"}`}
                id={section.section_id}
                key={section.section_id}
              >
                {section.eyebrow ? (
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal-soft">
                    {section.eyebrow}
                  </p>
                ) : null}

                {section.heading ? (
                  <h2 className="mt-3 font-display text-3xl leading-tight text-text-primary">
                    {section.heading}
                  </h2>
                ) : null}

                {section.stat_callout ? (
                  <div className="mt-6 rounded-[1.25rem] border border-token/80 bg-white/[0.03] px-5 py-5">
                    <p className="font-display text-3xl leading-none text-text-primary sm:text-4xl">
                      {section.stat_callout.value}
                    </p>
                    <p className="mt-3 max-w-[32rem] text-sm leading-6 text-text-secondary">
                      {section.stat_callout.label}
                    </p>
                    {section.stat_callout.source ? (
                      <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-text-tertiary">
                        {section.stat_callout.source}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className={`editorial-stack ${section.heading || section.stat_callout ? "mt-6" : "mt-0"}`}>
                  {section.body.map((paragraph) => (
                    <p className="text-[1.02rem] leading-8 text-text-secondary sm:text-[1.06rem]" key={paragraph}>
                      {paragraph}
                    </p>
                  ))}
                </div>

                {section.bullets?.length ? (
                  <ul className="mt-6 space-y-3 pl-5 text-[1.02rem] leading-8 text-text-secondary sm:text-[1.06rem]">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}

                {section.pull_quote ? (
                  <blockquote className="mt-8 border-l-2 border-pulse/40 pl-5">
                    <p className="max-w-[24ch] font-display text-[1.8rem] leading-tight text-text-primary sm:text-[2rem]">
                      "{section.pull_quote}"
                    </p>
                  </blockquote>
                ) : null}
              </section>
            ))}
          </div>

          {article.sensitive_topic !== "none" ? <CrisisResourcesCard /> : null}

          <section
            className="surface-panel rounded-[1.7rem] px-6 py-6 sm:px-8 sm:py-8"
            id="article-sources"
          >
            <h2 className="sr-only">References</h2>
            <div className="grid gap-4 xl:grid-cols-2">
              {entry.sources.map((source) => (
                <SourceCard
                  key={source.source_id}
                  relevanceNote={source.relevance_note}
                  showMetaChips={false}
                  showReviewDetails={false}
                  source={source}
                />
              ))}
            </div>
          </section>

          <section className="article-print-exclude rounded-[1.6rem] border border-pulse/20 bg-[linear-gradient(180deg,rgba(37,43,72,0.84),rgba(17,24,39,0.9)),radial-gradient(circle_at_top_right,rgba(255,45,85,0.12),transparent_30%)] p-5 shadow-surface sm:p-6">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-pulse-glow">
              Next action
            </p>
            <h2 className="mt-4 font-display text-2xl leading-tight text-text-primary">
              {article.next_action.label}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
              {article.next_action.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-4">
              <Link
                className="action-link action-link-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                href={article.next_action.href}
              >
                {article.next_action.label}
              </Link>
              {article.secondary_action ? (
                <Link
                  className="action-link action-link-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                  href={article.secondary_action.href}
                >
                  {article.secondary_action.label}
                </Link>
              ) : null}
            </div>
          </section>

          {article.document.footer_note ? (
            <p className="text-sm leading-7 text-text-tertiary">
              {article.document.footer_note}
            </p>
          ) : null}
        </article>
      </main>
      <PublicSiteFooter className="mt-10" />
    </>
  );
}
