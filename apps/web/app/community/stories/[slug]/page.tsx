import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MedicalDisclaimer } from "@onerhythm/ui";

import { SharePanel } from "../../../../components/shared/share-panel";
import { getPublicStoryBySlug } from "../../../../lib/community-stories-api";
import { buildPageMetadata } from "../../../../lib/metadata";
import { getRhythmDistanceStats } from "../../../../lib/rhythm-api";
import { absoluteUrl } from "../../../../lib/site";

export const dynamic = "force-dynamic";

type PageParams = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPublicStoryBySlug(slug);
  if (!story) {
    return { title: "Story not found | OneRhythm" };
  }

  return buildPageMetadata({
    title: story.title,
    description: story.summary,
    path: `/community/stories/${story.slug}`,
    type: "article",
  });
}

function formatStoryDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function CommunityStoryDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const { slug } = await params;
  const [story, rhythmStats] = await Promise.all([
    getPublicStoryBySlug(slug),
    getRhythmDistanceStats(),
  ]);
  if (!story) {
    notFound();
  }

  const sharePageUrl = absoluteUrl(`/community/stories/${story.slug}`);
  const earthPercent = rhythmStats.earth_loops * 100;

  return (
    <main>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[40vh] -z-10"
        style={{ background: "var(--gradient-void)" }}
      />

      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="mx-auto max-w-[720px] px-6 pt-8 text-xs text-text-tertiary"
      >
        <Link href="/community" className="hover:text-signal">
          Community
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/community/stories" className="hover:text-signal">
          Stories
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-secondary">
          {story.title.length > 40 ? `${story.title.slice(0, 40)}...` : story.title}
        </span>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-[720px] px-6 pt-8">
        <h1 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
          {story.title}
        </h1>
        <div className="mt-4 flex items-center gap-3 text-sm">
          <span className="text-text-secondary">{story.author_name}</span>
          <span className="text-text-tertiary">·</span>
          <span className="font-mono text-xs text-text-tertiary">
            {formatStoryDate(story.published_at)}
          </span>
        </div>
      </section>

      {/* Body */}
      <article className="mx-auto max-w-[720px] px-6 py-10">
        <div className="space-y-5">
          {story.body.split("\n\n").map((paragraph, i) => (
            <p
              className="text-base leading-[1.7] text-text-secondary"
              key={i}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      {/* Warm callout */}
      <section className="mx-auto max-w-[720px] px-6">
        <div className="rounded-lg border-l-2 border-pulse bg-cosmos p-5">
          <p className="text-sm leading-6 text-text-secondary">
            This is a personal story shared by a community member. It is not
            medical advice. If any part of this resonated with you, you are not
            alone.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              className="text-sm font-medium text-signal hover:underline"
              href="/account/stories"
            >
              Share Your Own Story
            </Link>
            <Link
              className="text-sm font-medium text-signal hover:underline"
              href="/mosaic"
            >
              Explore the Mosaic
            </Link>
          </div>
        </div>
      </section>

      {/* Share */}
      <section className="mx-auto flex max-w-[720px] justify-center px-6 py-10">
        <SharePanel
          sharePageUrl={sharePageUrl}
          distanceKm={rhythmStats.total_distance_km}
          earthPercent={earthPercent}
          contributorCount={rhythmStats.total_contributions}
          headline="Share This Story"
          subline="Help someone know they're not alone."
          variant="story"
          storyTitle={story.title}
        />
      </section>

      {/* Disclaimer */}
      <section className="mx-auto max-w-[720px] px-6 pb-10">
        <MedicalDisclaimer />
      </section>
    </main>
  );
}
