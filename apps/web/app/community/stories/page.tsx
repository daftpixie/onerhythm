import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@onerhythm/ui";

import { getPublicStories } from "../../../lib/community-stories-api";
import { buildPageMetadata } from "../../../lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Community Stories",
  description:
    "Reviewed community stories from OneRhythm members, published with explicit consent and public-safety review.",
  path: "/community/stories",
});

export const dynamic = "force-dynamic";

export default async function CommunityStoriesPage() {
  const stories = await getPublicStories();

  return (
    <main className="page-shell mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <section className="hero-panel rounded-[2rem] border border-token px-6 py-8 shadow-surface sm:px-8">
        <p className="font-mono text-sm uppercase tracking-[0.28em] text-signal">
          Community stories
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl leading-none tracking-[-0.04em] text-text-primary sm:text-5xl">
          Personal narratives shared with consent, care, and review.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
          These stories are about lived experience. They are not medical advice
          and they are not published automatically.
        </p>
      </section>

      <section className="grid gap-5">
        {stories.map((story) => (
          <Card key={story.story_id}>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
              Community story
            </p>
            <h2 className="mt-4 font-display text-3xl text-text-primary">{story.title}</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-text-secondary">{story.summary}</p>
            <p className="mt-3 text-sm text-text-secondary">
              By {story.author_name}
            </p>
            <Link
              className="action-link action-link-secondary mt-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              href={`/community/stories/${story.slug}`}
            >
              Read story
            </Link>
          </Card>
        ))}
        {!stories.length ? (
          <Card>
            <p className="text-base leading-7 text-text-secondary">
              No reviewed community stories are published yet.
            </p>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
