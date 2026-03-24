import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentPage } from "../../../components/content-page";
import { LongformArticlePage } from "../../../components/longform-article-page";
import { getContentEntry, listContentByKind } from "../../../lib/content";
import { buildContentMetadata } from "../../../lib/metadata";

type PageParams = Promise<{
  slug: string;
}>;

export function generateStaticParams() {
  return listContentByKind("essay").map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getContentEntry("essay", slug);
  if (!entry) {
    return { title: "Not found | OneRhythm" };
  }

  return buildContentMetadata(entry, `/stories/${entry.slug}`);
}

export default async function StoryDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const { slug } = await params;
  const entry = getContentEntry("essay", slug);
  if (!entry) {
    notFound();
  }

  if (entry.article) {
    return <LongformArticlePage entry={entry} />;
  }

  return <ContentPage entry={entry} />;
}
