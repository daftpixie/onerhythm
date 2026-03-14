import type { ContentEntryWithAuthors } from "../lib/content";
import { ResearchSummaryCard } from "./research-summary-card";

export function ResearchSummaryGrid({ entries }: { entries: ContentEntryWithAuthors[] }) {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      {entries.map((entry) => (
        <ResearchSummaryCard entry={entry} key={entry.content_id} />
      ))}
    </section>
  );
}
