import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentPage } from "../../../components/content-page";
import { getConditionModule, listConditionModules } from "../../../lib/content";
import { buildContentMetadata } from "../../../lib/metadata";

type PageParams = Promise<{
  slug: string;
}>;

export function generateStaticParams() {
  return listConditionModules().map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getConditionModule(slug);
  if (!entry) {
    return { title: "Not found | OneRhythm" };
  }

  return buildContentMetadata(entry, `/conditions/${entry.slug}`);
}

export default async function ConditionModulePage({
  params,
}: {
  params: PageParams;
}) {
  const { slug } = await params;
  const entry = getConditionModule(slug);
  if (!entry) {
    notFound();
  }

  return <ContentPage entry={entry} />;
}
