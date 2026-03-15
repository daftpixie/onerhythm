import type { Metadata } from "next";
import Link from "next/link";

import { MedicalDisclaimer } from "@onerhythm/ui";
import type { PublicCommunityStory } from "@onerhythm/types";

import { getPublicStories } from "../../../lib/community-stories-api";
import { buildPageMetadata } from "../../../lib/metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Community Stories",
  description:
    "Personal stories from people living with arrhythmia. Every voice matters. None of this is medical advice.",
  path: "/community/stories",
  keywords: ["community stories", "arrhythmia stories", "personal narratives", "OneRhythm"],
});

function formatStoryDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function StoryCard({ story }: { story: PublicCommunityStory }) {
  return (
    <Link
      href={`/community/stories/${story.slug}`}
      className="group block rounded-xl border border-token bg-cosmos transition-colors duration-normal hover:bg-nebula hover:shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
    >
      <div className="border-t-2 border-pulse rounded-t-xl" />
      <article className="p-5">
        <p className="text-sm text-text-primary">{story.author_name}</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-text-primary group-hover:text-signal">
          {story.title}
        </h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-text-secondary">
          {story.summary}
        </p>
        <p className="mt-3 font-mono text-xs text-text-tertiary">
          {formatStoryDate(story.published_at)}
        </p>
      </article>
    </Link>
  );
}

export default async function CommunityStoriesPage() {
  const stories = await getPublicStories();

  return (
    <main>
      {/* Hero */}
      <section className="relative px-6 pb-12 pt-20 text-center sm:pt-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--gradient-void)" }}
        />
        <h1 className="font-display text-4xl font-bold text-text-primary sm:text-5xl">
          Community Voices
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-text-secondary">
          Personal stories from people living with arrhythmia. Every voice
          matters. None of this is medical advice.
        </p>
      </section>

      {/* Stories grid */}
      <section className="mx-auto max-w-5xl px-6 pb-12 sm:px-10 lg:px-12">
        {stories.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {stories.map((story) => (
              <StoryCard key={story.story_id} story={story} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-token bg-cosmos p-8 text-center">
            <p className="text-base text-text-secondary">
              No community stories have been published yet. Be the first to
              share.
            </p>
            <Link
              className="action-link action-link-primary mt-4 inline-block px-6 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              href="/account/stories"
            >
              Share Your Story
            </Link>
          </div>
        )}
      </section>

      {/* Disclaimer — compliance fix: was missing */}
      <section className="mx-auto max-w-5xl px-6 pb-10">
        <MedicalDisclaimer />
      </section>
    </main>
  );
}
