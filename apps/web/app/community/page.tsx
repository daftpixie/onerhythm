import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { MedicalDisclaimer } from "@onerhythm/ui";
import type { PublicCommunityStory } from "@onerhythm/types";

import { HeartMosaic } from "../../components/heart-mosaic";
import { EarthProgressRing } from "../../components/mosaic";
import { buildPageMetadata } from "../../lib/metadata";
import { getPublicStories } from "../../lib/community-stories-api";
import { getHomepageMosaicData } from "../../lib/mosaic-api";
import { getRhythmDistanceStats } from "../../lib/rhythm-api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Community Hub",
  description:
    "The OneRhythm community: Heart Mosaic, community stories, and the shared rhythm of people living with arrhythmia.",
  path: "/community",
  keywords: ["arrhythmia community", "heart mosaic", "community stories", "OneRhythm"],
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
      <div className="p-6">
        <p className="text-sm text-text-tertiary">{story.author_name}</p>
        <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-text-primary group-hover:text-signal">
          {story.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-text-secondary">
          {story.summary}
        </p>
        <p className="mt-4 font-mono text-xs text-text-tertiary">
          {formatStoryDate(story.published_at)}
        </p>
      </div>
    </Link>
  );
}

async function CommunityHeroData() {
  const [rhythmStats, mosaicData] = await Promise.all([
    getRhythmDistanceStats(),
    getHomepageMosaicData(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pb-16 pt-20 text-center sm:pt-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--gradient-void)" }}
        />
        <h1 className="mx-auto font-display text-4xl font-bold text-text-primary sm:text-5xl">
          You Are Not Alone In This
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-text-secondary">
          The psychological weight of arrhythmia is real, measurable, and too
          often carried alone. This community exists to change that.
        </p>
        <p className="mx-auto mt-4 text-center font-mono text-sm text-signal">
          {rhythmStats.total_contributions.toLocaleString()} heartbeats
          {" · "}
          {rhythmStats.total_distance_km.toLocaleString(undefined, { maximumFractionDigits: 2 })} km
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            className="action-link action-link-primary px-6 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            href="/contribute"
          >
            Add Your Rhythm
          </Link>
          <Link
            className="action-link action-link-quiet px-6 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            href="/community/stories"
          >
            Read Their Stories
          </Link>
        </div>
      </section>

      {/* Mosaic Preview */}
      <section className="bg-deep-void py-16">
        <div className="mx-auto grid max-w-4xl items-center gap-12 px-6 sm:px-10 lg:grid-cols-2 lg:px-12">
          <HeartMosaic
            fetchState={mosaicData.fetch_state}
            stats={mosaicData.stats}
            tiles={mosaicData.tiles}
          />
          <div className="space-y-5 text-center lg:text-left">
            <h2 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
              The Heart Mosaic
            </h2>
            <p className="text-base leading-7 text-text-secondary">
              Every rhythm contributed becomes a tile in a collective artwork —
              proof that none of us are as alone as it feels at 3 AM. The
              artistic trace of each tile adds to a shared distance circling the
              Earth.
            </p>
            <div className="flex justify-center lg:justify-start">
              <EarthProgressRing
                progress={rhythmStats.progress_toward_next}
                earthLoops={rhythmStats.earth_loops}
                label={
                  rhythmStats.next_milestone
                    ? `Progress toward ${rhythmStats.next_milestone.label}`
                    : "Journey continues"
                }
              />
            </div>
            <Link
              className="action-link action-link-quiet inline-flex px-6 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              href="/mosaic"
            >
              Explore the Full Mosaic
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

async function CommunityVoicesData() {
  const stories = await getPublicStories();
  const featured = stories.slice(0, 3);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-4xl px-6 sm:px-10 lg:px-12">
        <p className="text-center font-mono text-xs uppercase tracking-[0.22em] text-pulse">
          Community Voices
        </p>
        <h2 className="mt-3 text-center font-display text-2xl font-bold text-text-primary sm:text-3xl">
          Real stories from people who get it.
        </h2>
        {featured.length > 0 ? (
          <>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((story) => (
                <StoryCard key={story.story_id} story={story} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                className="action-link action-link-quiet px-6 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                href="/community/stories"
              >
                Read All Stories
              </Link>
            </div>
          </>
        ) : (
          <p className="mx-auto mt-8 max-w-md text-center text-base leading-7 text-text-secondary">
            The mosaic of voices is growing. Stories shared here come from
            people living with arrhythmia — reviewed before publication,
            never clinical, always real.
          </p>
        )}
      </div>
    </section>
  );
}

export default function CommunityPage() {
  return (
    <main>
      <Suspense fallback={<div className="min-h-[50vh]" />}>
        <CommunityHeroData />
      </Suspense>

      <Suspense fallback={<div className="min-h-[20vh]" />}>
        <CommunityVoicesData />
      </Suspense>

      {/* Share Your Story invitation */}
      <section className="bg-deep-void py-20">
        <div className="mx-auto max-w-2xl space-y-8 px-6 text-center">
          <p className="text-lg italic leading-8 text-text-primary">
            &ldquo;Every story shared reduces isolation for someone reading it at
            3 AM who thinks they are the only one.&rdquo;
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-text-secondary">
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-signal" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Personal narrative only
            </span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-signal" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Reviewed before publication
            </span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-signal" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Your name, a pseudonym, or anonymous
            </span>
          </div>
          <div className="pt-2">
            <Link
              className="action-link action-link-primary inline-block px-8 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              href="/account/stories"
            >
              Share Your Story
            </Link>
          </div>
          <p className="text-xs text-text-tertiary">
            Requires a free account. Your story is reviewed before publication.
          </p>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="mx-auto max-w-4xl px-6 py-10 sm:px-10 lg:px-12">
        <MedicalDisclaimer />
      </section>
    </main>
  );
}
