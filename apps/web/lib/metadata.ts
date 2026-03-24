import type { Metadata } from "next";

import { siteContent } from "../content/site-copy";
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
  ogTitle?: string;
  ogDescription?: string;
  ogAlt?: string;
};

export function buildPageMetadata({
  title,
  description,
  path,
  type = "website",
  keywords,
  ogImagePath,
  twitterImagePath,
  ogTitle,
  ogDescription,
  ogAlt,
}: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const image = absoluteUrl(ogImagePath ?? resolveOgImage(path));
  const twitterImage = absoluteUrl(twitterImagePath ?? DEFAULT_TWITTER_IMAGE);
  const resolvedOgTitle = ogTitle ?? title;
  const resolvedOgDescription = ogDescription ?? description;
  const resolvedOgAlt = ogAlt ?? siteContent.global.ideology;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title: resolvedOgTitle,
      description: resolvedOgDescription,
      url: canonical,
      siteName: "OneRhythm",
      type,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: resolvedOgAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedOgTitle,
      description: resolvedOgDescription,
      images: [twitterImage],
    },
  };
}

export function buildContentMetadata(
  entry: ContentEntryWithAuthors,
  path: string,
): Metadata {
  const description = entry.article?.share.meta_description ?? entry.seo.description;

  return buildPageMetadata({
    title: entry.seo.title,
    description,
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
    ogImagePath: entry.article?.share.og_image_path,
    twitterImagePath: entry.article?.share.twitter_image_path,
    ogTitle: entry.article?.share.og_title,
    ogDescription: entry.article?.share.og_description,
    ogAlt: entry.article?.share.og_alt,
  });
}
