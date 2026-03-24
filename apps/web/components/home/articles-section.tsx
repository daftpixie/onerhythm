import Link from "next/link";

import { homepage } from "../../content/pages/homepage";
import { listPublishedEditorialEssays } from "../../lib/content";
import { Heading } from "../typography/heading";
import { Badge } from "../ui/badge";
import { SectionWrapper } from "../ui/section-wrapper";

const accentPanelMap = {
  aurora: "border-aurora/24 bg-[radial-gradient(circle_at_top,rgba(167,139,250,0.16),transparent_62%)]",
  pulse: "border-pulse/24 bg-[radial-gradient(circle_at_top,rgba(255,45,85,0.16),transparent_62%)]",
  signal: "border-signal/24 bg-[radial-gradient(circle_at_top,rgba(0,212,255,0.16),transparent_62%)]",
} as const;

const badgeVariantMap = {
  aurora: "aurora",
  pulse: "pulse",
  signal: "cyan",
} as const;

const editorialCoverMap = {
  aurora:
    "bg-[radial-gradient(circle_at_top,rgba(167,139,250,0.24),transparent_46%),linear-gradient(160deg,rgba(20,25,44,0.98),rgba(15,19,34,0.94))]",
  pulse:
    "bg-[radial-gradient(circle_at_top,rgba(255,45,85,0.22),transparent_46%),linear-gradient(160deg,rgba(20,25,44,0.98),rgba(15,19,34,0.94))]",
  signal:
    "bg-[radial-gradient(circle_at_top,rgba(0,212,255,0.2),transparent_46%),linear-gradient(160deg,rgba(20,25,44,0.98),rgba(15,19,34,0.94))]",
} as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ArticlesSection() {
  const { articles } = homepage;
  const entries = listPublishedEditorialEssays();

  return (
    <SectionWrapper bg="void" width="wide">
      <Heading as="h2" size="display">
        {articles.heading}
      </Heading>
      <p className="mt-4 max-w-3xl text-body-lg leading-relaxed text-text-secondary">
        {articles.subhead}
      </p>

      <div className="mt-10 space-y-8">
        {entries.map((entry) => {
          if (!entry.article) {
            return null;
          }

          const feature = entry.article.homepage_feature;
          const accentTone = feature.accent_tone;
          const primaryAuthor = entry.authors[0]?.name;
          const homepageByline = primaryAuthor
            ? `By ${primaryAuthor} - One Rhythm`
            : "By One Rhythm";

          return (
            <article
              className="hero-panel overflow-hidden rounded-[2rem] border border-token shadow-surface"
              key={entry.content_id}
            >
              <div className="grid xl:grid-cols-[19rem_minmax(0,1fr)]">
                <div
                  className={`relative min-h-[250px] border-b border-token xl:min-h-full xl:border-b-0 xl:border-r ${editorialCoverMap[accentTone]}`}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,26,0.06),rgba(10,14,26,0.22)),linear-gradient(0deg,rgba(10,14,26,0.84),transparent_38%)]" />
                  <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
                    <div>
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-text-tertiary">
                        OneRhythm editorial
                      </p>
                      <div className="mt-5 w-14 border-t border-token/70" />
                    </div>

                    <div>
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-text-secondary">
                        {feature.type_label}
                      </p>
                      <p className="mt-4 max-w-[14ch] font-display text-[2rem] leading-[0.96] tracking-[-0.04em] text-text-primary">
                        {entry.title}
                      </p>
                      <p className="mt-4 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-text-secondary">
                        {feature.reading_time}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant={badgeVariantMap[accentTone]}>{feature.type_label}</Badge>
                      <span className="signal-chip text-xs">{feature.reading_time}</span>
                    </div>
                    <span className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-text-tertiary">
                      {homepageByline}
                    </span>
                  </div>

                  <Heading as="h3" size="display" className="mt-5 max-w-[18ch]">
                    {entry.title}
                  </Heading>

                  <p className="mt-4 max-w-3xl text-lg leading-8 text-text-primary">
                    {feature.purpose}
                  </p>

                  <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
                    {feature.summary}
                  </p>

                  <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                    <div className="surface-panel-soft rounded-[1.35rem] border p-5">
                      <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                        Why this belongs here
                      </p>
                      <p className="mt-3 text-sm leading-6 text-text-secondary">{entry.summary}</p>
                    </div>

                    <div
                      className={`surface-panel-soft rounded-[1.35rem] border p-5 ${accentPanelMap[accentTone]}`}
                    >
                      {feature.stat_accent ? (
                        <>
                          <p className="font-display text-3xl leading-none text-text-primary">
                            {feature.stat_accent.value}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-text-secondary">
                            {feature.stat_accent.label}
                          </p>
                          {feature.stat_accent.source ? (
                            <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-text-tertiary">
                              {feature.stat_accent.source}
                            </p>
                          ) : null}
                        </>
                      ) : feature.pull_quote ? (
                        <blockquote className="text-sm leading-6 text-text-secondary">
                          "{feature.pull_quote}"
                        </blockquote>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-3">
                      <span className="signal-chip text-xs">{entry.article.hero_label}</span>
                      <span className="signal-chip text-xs">
                        Published {formatDate(entry.publish_date)}
                      </span>
                    </div>
                    <Link
                      className="action-link action-link-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                      href={`/stories/${entry.slug}`}
                    >
                      {feature.cta_label}
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
