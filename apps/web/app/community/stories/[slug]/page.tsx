import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card, MedicalDisclaimer } from "@onerhythm/ui";

import { getPublicStoryBySlug, getPublicStories } from "../../../../lib/community-stories-api";
import { buildPageMetadata } from "../../../../lib/metadata";

export const dynamic = "force-dynamic";

type PageParams = Promise<{
  slug: string;
}>;

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

export default async function CommunityStoryDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const { slug } = await params;
  const story = await getPublicStoryBySlug(slug);
  if (!story) {
    notFound();
  }

  return (
    <main className="page-shell mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <section className="hero-panel rounded-[2rem] border border-token px-6 py-8 shadow-surface sm:px-8">
        <p className="font-mono text-sm uppercase tracking-[0.28em] text-signal">
          Community story
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl leading-none tracking-[-0.04em] text-text-primary sm:text-5xl">
          {story.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
          {story.summary}
        </p>
        <p className="mt-4 text-sm text-text-secondary">By {story.author_name}</p>
      </section>

      <MedicalDisclaimer />

      <Card>
        <div className="space-y-4">
          {story.body.split("\n\n").map((paragraph) => (
            <p className="text-base leading-8 text-text-secondary" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
      </Card>
    </main>
  );
}
