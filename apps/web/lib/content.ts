import type { ContentAuthor, ContentEntry, ContentKind, EvidenceSource } from "@onerhythm/types";

import { contentAuthors } from "../content/authors";
import { contentEntries } from "../content/entries";
import { evidenceSources } from "../content/sources";

const authorLookup = new Map(contentAuthors.map((author) => [author.author_id, author]));
const sourceLookup = new Map(evidenceSources.map((source) => [source.source_id, source]));

export type ContentEntryWithAuthors = ContentEntry & {
  authors: ContentAuthor[];
  sources: ResolvedContentSource[];
};

export type ResolvedContentSource = EvidenceSource & {
  relevance_note?: string;
};

function attachAuthors(entry: ContentEntry): ContentEntryWithAuthors {
  const sources: ResolvedContentSource[] = [];

  for (const link of entry.source_links) {
    const source = sourceLookup.get(link.source_id);
    if (!source) {
      continue;
    }

    sources.push({
      ...source,
      relevance_note: link.relevance_note,
    });
  }

  return {
    ...entry,
    authors: entry.author_ids
      .map((authorId) => authorLookup.get(authorId))
      .filter((author): author is ContentAuthor => Boolean(author)),
    sources,
  };
}

function sortByPublishDate(entries: ContentEntry[]): ContentEntry[] {
  return [...entries].sort((left, right) =>
    right.publish_date.localeCompare(left.publish_date),
  );
}

export function listContentByKind(kind: ContentKind): ContentEntryWithAuthors[] {
  return sortByPublishDate(contentEntries)
    .filter((entry) => entry.kind === kind && entry.review_state === "published")
    .map(attachAuthors);
}

export function listConditionModules(): ContentEntryWithAuthors[] {
  return sortByPublishDate(contentEntries)
    .filter((entry) => entry.kind === "condition_module" && entry.review_state === "published")
    .map(attachAuthors);
}

export function getContentEntry(kind: ContentKind, slug: string): ContentEntryWithAuthors | null {
  const entry = contentEntries.find(
    (candidate) =>
      candidate.kind === kind &&
      candidate.slug === slug &&
      candidate.review_state === "published",
  );
  return entry ? attachAuthors(entry) : null;
}

export function getConditionModule(slug: string): ContentEntryWithAuthors | null {
  const entry = contentEntries.find(
    (candidate) =>
      candidate.kind === "condition_module" &&
      candidate.slug === slug &&
      candidate.review_state === "published",
  );
  return entry ? attachAuthors(entry) : null;
}
