import Link from "next/link";

import { Card } from "@onerhythm/ui";
import type { ResearchPulseFeedItem, ResearchPulseThemeKey } from "@onerhythm/types";

const TOPIC_LABELS: Record<ResearchPulseThemeKey, string> = {
  ablation: "Ablation",
  medication: "Medication",
  device: "Device therapy",
  genetics: "Genetics",
  mapping: "Mapping",
  monitoring: "Monitoring",
  quality_of_life: "Quality of life",
  mental_health: "Mental health",
  innovation: "Innovation",
};

export function formatResearchPulseDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function buildTopicHref(basePath: string, themeKey?: ResearchPulseThemeKey): string {
  return themeKey ? `${basePath}?topic=${encodeURIComponent(themeKey)}` : basePath;
}

export function ResearchPulseTopicFilterBar({
  activeThemeKey,
  basePath,
}: {
  activeThemeKey?: ResearchPulseThemeKey;
  basePath: string;
}) {
  return (
    <nav aria-label="Research Pulse topics" className="flex flex-wrap gap-3">
      <Link
        className={`signal-chip text-sm ${!activeThemeKey ? "border-signal/40 text-signal-soft" : ""}`}
        href={buildTopicHref(basePath)}
      >
        All topics
      </Link>
      {(Object.keys(TOPIC_LABELS) as ResearchPulseThemeKey[]).map((themeKey) => (
        <Link
          className={`signal-chip text-sm ${activeThemeKey === themeKey ? "border-signal/40 text-signal-soft" : ""}`}
          href={buildTopicHref(basePath, themeKey)}
          key={themeKey}
        >
          {TOPIC_LABELS[themeKey]}
        </Link>
      ))}
    </nav>
  );
}

export function ResearchPulseFeedGrid({
  items,
  emptyTitle,
  emptyBody,
  emptyActionHref,
  emptyActionLabel,
}: {
  items: ResearchPulseFeedItem[];
  emptyTitle: string;
  emptyBody: string;
  emptyActionHref?: string;
  emptyActionLabel?: string;
}) {
  if (!items.length) {
    return (
      <Card className="rounded-[2rem]">
        <div className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal">Nothing published here yet</p>
          <h2 className="section-title max-w-xl text-[clamp(1.7rem,2.8vw,2.3rem)]">{emptyTitle}</h2>
          <p className="max-w-3xl text-base leading-7 text-text-secondary">{emptyBody}</p>
          {emptyActionHref && emptyActionLabel ? (
            <Link
              className="action-link action-link-secondary max-w-max focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              href={emptyActionHref}
            >
              {emptyActionLabel}
            </Link>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <section aria-label="Research Pulse feed" className="grid gap-5 lg:grid-cols-2">
      {items.map((item) => (
        <Card className="card-educational h-full rounded-[1.75rem]" key={item.publication_id}>
          <article className="flex h-full flex-col gap-5">
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                <span className="font-mono text-xs uppercase tracking-[0.22em] text-signal">
                  {item.journal_name ?? "Peer-reviewed study"}
                </span>
                <span aria-hidden="true" className="text-text-tertiary">
                  /
                </span>
                <span>{formatResearchPulseDate(item.published_at)}</span>
                <span aria-hidden="true" className="text-text-tertiary">
                  /
                </span>
                <span>{item.study_type}</span>
              </div>
              <h2 className="font-display text-[clamp(2rem,3vw,2.7rem)] leading-[0.98] tracking-[-0.045em] text-text-primary">
                {item.title}
              </h2>
              <p className="max-w-2xl text-base leading-7 text-text-secondary">{item.summary}</p>
              <p className="max-w-2xl text-sm leading-6 text-text-tertiary">{item.why_it_matters}</p>
            </header>

            <div className="flex flex-wrap gap-2">
              {item.diagnosis_tags.map((tag) => (
                <span
                  className="rounded-full border border-token px-3 py-1 text-xs uppercase tracking-[0.18em] text-text-secondary"
                  key={tag.slug}
                >
                  {tag.label}
                </span>
              ))}
              {item.theme_tags.map((tag) => (
                <span
                  className="rounded-full border border-signal/30 px-3 py-1 text-xs uppercase tracking-[0.18em] text-signal-soft"
                  key={tag.slug}
                >
                  {tag.label}
                </span>
              ))}
            </div>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
              <a
                className="action-link action-link-quiet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                href={item.source_url}
                rel="noreferrer"
                target="_blank"
              >
                View source
              </a>
              <Link
                className="action-link action-link-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                href={`/research/pulse/${item.slug}`}
              >
                Read summary
              </Link>
            </div>
          </article>
        </Card>
      ))}
    </section>
  );
}

export function ResearchPulseLoadingGrid() {
  return (
    <section aria-label="Loading research feed" className="grid gap-5 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card className="h-full rounded-[1.75rem]" key={index}>
          <div className="space-y-4 animate-pulse">
            <div className="h-3 w-40 rounded-full bg-[color:color-mix(in_srgb,var(--color-cosmos)_80%,transparent)]" />
            <div className="space-y-3">
              <div className="h-10 w-4/5 rounded-2xl bg-[color:color-mix(in_srgb,var(--color-cosmos)_88%,transparent)]" />
              <div className="h-4 w-full rounded-full bg-[color:color-mix(in_srgb,var(--color-cosmos)_70%,transparent)]" />
              <div className="h-4 w-5/6 rounded-full bg-[color:color-mix(in_srgb,var(--color-cosmos)_70%,transparent)]" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-24 rounded-full bg-[color:color-mix(in_srgb,var(--color-cosmos)_75%,transparent)]" />
              <div className="h-8 w-28 rounded-full bg-[color:color-mix(in_srgb,var(--color-cosmos)_75%,transparent)]" />
            </div>
            <div className="flex justify-between pt-4">
              <div className="h-11 w-28 rounded-2xl bg-[color:color-mix(in_srgb,var(--color-cosmos)_85%,transparent)]" />
              <div className="h-11 w-32 rounded-2xl bg-[color:color-mix(in_srgb,var(--color-cosmos)_85%,transparent)]" />
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
}
