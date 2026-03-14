import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ResearchTranslationPage } from "../../../components/research-translation-page";
import { getContentEntry, listContentByKind } from "../../../lib/content";
import { buildContentMetadata } from "../../../lib/metadata";

type PageParams = Promise<{
  slug: string;
}>;

export function generateStaticParams() {
  return listContentByKind("research_translation").map((entry) => ({
    slug: entry.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getContentEntry("research_translation", slug);
  if (!entry) {
    return { title: "Not found | OneRhythm" };
  }

  return buildContentMetadata(entry, `/research/${entry.slug}`);
}

export default async function ResearchDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const { slug } = await params;
  const entry = getContentEntry("research_translation", slug);
  if (!entry) {
    notFound();
  }

  return <ResearchTranslationPage entry={entry} />;
}
