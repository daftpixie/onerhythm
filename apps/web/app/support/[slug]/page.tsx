import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentPage } from "../../../components/content-page";
import { getContentEntry, listContentByKind } from "../../../lib/content";
import { buildContentMetadata } from "../../../lib/metadata";

type PageParams = Promise<{
  slug: string;
}>;

export function generateStaticParams() {
  return listContentByKind("support_resource").map((entry) => ({
    slug: entry.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getContentEntry("support_resource", slug);
  if (!entry) {
    return { title: "Not found | OneRhythm" };
  }

  return buildContentMetadata(entry, `/support/${entry.slug}`);
}

export default async function SupportDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const { slug } = await params;
  const entry = getContentEntry("support_resource", slug);
  if (!entry) {
    notFound();
  }

  return <ContentPage entry={entry} />;
}
