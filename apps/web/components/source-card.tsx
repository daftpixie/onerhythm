import Link from "next/link";

import type { EvidenceSource } from "@onerhythm/types";

function formatDate(value?: string): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function labelForClassification(value: EvidenceSource["classification"]): string {
  return value.replaceAll("_", " ");
}

function labelForPublisherKind(value: EvidenceSource["publisher_kind"]): string {
  return value.replaceAll("_", " ");
}

export function SourceCard({
  source,
  relevanceNote,
}: {
  source: EvidenceSource;
  relevanceNote?: string;
}) {
  return (
    <article className="rounded-[1.25rem] border border-token p-4">
      <div className="flex flex-wrap gap-2">
        <span className="signal-chip text-xs">{labelForClassification(source.classification)}</span>
        <span className="signal-chip text-xs">{labelForPublisherKind(source.publisher_kind)}</span>
        <span className="signal-chip text-xs">Review: {source.review_state}</span>
      </div>

      <h3 className="mt-4 text-base text-text-primary">{source.title}</h3>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{source.source_name}</p>
      {source.summary ? (
        <p className="mt-2 text-sm leading-6 text-text-secondary">{source.summary}</p>
      ) : null}
      {relevanceNote ? (
        <p className="mt-2 text-sm leading-6 text-text-secondary">{relevanceNote}</p>
      ) : null}

      <div className="mt-3 space-y-1 text-xs leading-5 text-text-tertiary">
        {formatDate(source.publish_date) ? <p>Published {formatDate(source.publish_date)}</p> : null}
        {formatDate(source.updated_date) ? <p>Updated {formatDate(source.updated_date)}</p> : null}
        {formatDate(source.reviewed_at) ? (
          <p>
            Reviewed {formatDate(source.reviewed_at)}
            {source.reviewer_ref ? ` by ${source.reviewer_ref}` : ""}
          </p>
        ) : null}
        {source.citation?.citation_label ? <p>Citation: {source.citation.citation_label}</p> : null}
        {source.citation?.doi ? <p>DOI: {source.citation.doi}</p> : null}
        {source.citation?.pmid ? <p>PMID: {source.citation.pmid}</p> : null}
        {source.citation?.guideline_body ? <p>Guideline body: {source.citation.guideline_body}</p> : null}
      </div>

      <Link
        className="action-link action-link-secondary mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        href={source.source_url}
      >
        View source
      </Link>
    </article>
  );
}
