import type { Metadata } from "next";

import type { ContentEntryWithAuthors } from "./content";
import { absoluteUrl } from "./site";

const DEFAULT_OG_IMAGE = "/brand/og/og-default-1200x630.png";
const DEFAULT_TWITTER_IMAGE = "/brand/og/og-twitter-1200x628.png";

const OG_IMAGE_BY_PATH: Record<string, string> = {
  "/campaigns/the-invisible-crisis": "/brand/og/og-article-invisible-bears-1200x630.png",
  "/campaigns/the-weight-you-cant-see": "/brand/og/og-article-broken-heart-1200x630.png",
  "/research/arrhythmia-mental-health-burden": "/brand/og/og-campaign-anxiety-1200x630.png",
};

function resolveOgImage(path: string): string {
  return OG_IMAGE_BY_PATH[path] ?? DEFAULT_OG_IMAGE;
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  keywords?: string[];
  ogImagePath?: string;
  twitterImagePath?: string;
};

export function buildPageMetadata({
  title,
  description,
  path,
  type = "website",
  keywords,
  ogImagePath,
  twitterImagePath,
}: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const image = absoluteUrl(ogImagePath ?? resolveOgImage(path));
  const twitterImage = absoluteUrl(twitterImagePath ?? DEFAULT_TWITTER_IMAGE);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "OneRhythm",
      type,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: "OneRhythm",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [twitterImage],
    },
  };
}

export function buildContentMetadata(
  entry: ContentEntryWithAuthors,
  path: string,
): Metadata {
  return buildPageMetadata({
    title: entry.seo.title,
    description: entry.seo.description,
    path,
    type: "article",
    keywords: [
      "OneRhythm",
      entry.kind.replaceAll("_", " "),
      entry.kicker,
      ...(entry.educational_surface
        ? ["educational", "non-diagnostic", "arrhythmia education"]
        : ["community", "campaign", "public narrative"]),
    ],
  });
}
