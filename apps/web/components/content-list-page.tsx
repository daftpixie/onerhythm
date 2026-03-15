import Link from "next/link";

import { Card } from "@onerhythm/ui";

import type { ContentEntryWithAuthors } from "../lib/content";
import { PublicSiteFooter } from "./public-site-footer";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ContentListPage({
  title,
  intro,
  kicker,
  entries,
  hrefBase,
}: {
  title: string;
  intro: string;
  kicker: string;
  entries: ContentEntryWithAuthors[];
  hrefBase: string;
}) {
  return (
    <>
      <main className="page-shell mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
        <header className="hero-panel rounded-[2rem] border border-token px-6 py-8 shadow-surface sm:px-8">
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-signal">{kicker}</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-none tracking-[-0.04em] text-text-primary sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">{intro}</p>
        </header>

        <section className="grid gap-5">
          {entries.map((entry) => (
            <Card key={entry.content_id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                    {entry.kicker}
                  </p>
                  <h2 className="font-display text-2xl text-text-primary">{entry.title}</h2>
                  <p className="max-w-3xl text-base leading-7 text-text-secondary">
                    {entry.summary}
                  </p>
                  <p className="text-sm text-text-secondary">
                    By {entry.authors.map((author) => author.name).join(", ")} · {formatDate(entry.publish_date)}
                  </p>
                </div>
                <Link
                  className="action-link action-link-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                  href={`${hrefBase}/${entry.slug}`}
                >
                  Read page
                </Link>
              </div>
            </Card>
          ))}
        </section>
      </main>
      <PublicSiteFooter className="mt-10" />
    </>
  );
}
