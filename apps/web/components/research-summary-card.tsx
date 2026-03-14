import Link from "next/link";

import { Card } from "@onerhythm/ui";

import type { ContentEntryWithAuthors } from "../lib/content";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ResearchSummaryCard({ entry }: { entry: ContentEntryWithAuthors }) {
  const statHighlights = entry.research_translation?.stat_highlights ?? [];
  const firstStat = statHighlights[0];

  return (
    <Card className="h-full rounded-[1.75rem]">
      <div className="flex h-full flex-col gap-5">
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal">{entry.kicker}</p>
          <h2 className="font-display text-3xl tracking-[-0.04em] text-text-primary">
            {entry.title}
          </h2>
          <p className="text-base leading-7 text-text-secondary">{entry.summary}</p>
        </div>

        {entry.research_translation ? (
          <div className="surface-3 rounded-[1.2rem] border border-token p-4">
            {firstStat ? (
              <>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-tertiary">
                  Signal from the literature
                </p>
                <p className="mt-3 text-sm text-text-secondary">
                  <span className="font-display text-3xl text-text-primary">{firstStat.value}</span>{" "}
                  {firstStat.label.toLowerCase()}
                </p>
                <p className="mt-3 text-sm leading-6 text-text-primary">
                  {entry.research_translation.key_finding}
                </p>
              </>
            ) : (
              <>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-tertiary">
                  Key finding
                </p>
                <p className="mt-3 text-sm leading-6 text-text-primary">
                  {entry.research_translation.key_finding}
                </p>
              </>
            )}
            {!firstStat ? null : (
              <p className="mt-3 text-xs leading-5 text-text-tertiary">
                {firstStat.context}
              </p>
            )}
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-sm text-text-secondary">
            By {entry.authors.map((author) => author.name).join(", ")} · {formatDate(entry.publish_date)}
          </p>
          <Link
            className="action-link action-link-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            href={`/research/${entry.slug}`}
          >
            Read translation
          </Link>
        </div>
      </div>
    </Card>
  );
}
