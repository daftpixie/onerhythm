import type { Metadata } from "next";
import { Suspense } from "react";

import type { ResearchPulseFeedItem } from "@onerhythm/types";

import {
  CTAFooter,
  HeroSection,
  MissionSection,
  MosaicSpotlight,
  OriginSection,
  ResearchPulseSection,
  StatsSection,
} from "../components/home";
import { StructuredData } from "../components/structured-data";
import { buildPageMetadata } from "../lib/metadata";
import { getHomepageMosaicData } from "../lib/mosaic-api";
import { listLatestResearchPulse } from "../lib/research-pulse-api";
import { absoluteUrl } from "../lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Heart Mosaic, learning, and community visibility",
  description:
    "OneRhythm is a public, educational platform built to make the invisible emotional weight of arrhythmia feel less isolating through the Heart Mosaic, grounded learning, and clear privacy boundaries.",
  path: "/",
  keywords: [
    "OneRhythm",
    "arrhythmia community",
    "heart mosaic",
    "arrhythmia education",
    "non-diagnostic educational platform",
  ],
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "OneRhythm",
  url: absoluteUrl("/"),
  description:
    "A public, educational arrhythmia platform built around the Heart Mosaic, grounded learning, and community visibility.",
  publisher: {
    "@type": "Organization",
    name: "OneRhythm",
    url: absoluteUrl("/"),
  },
};

function mapThemeToAccent(item: ResearchPulseFeedItem): "pulse" | "signal" | "aurora" {
  const first = item.theme_tags[0]?.slug;
  if (!first) return "signal";
  if (first === "mental_health" || first === "quality_of_life") return "pulse";
  if (first === "device" || first === "genetics" || first === "innovation") return "aurora";
  return "signal";
}

function formatPulseDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

/** Async wrapper so only the hero tile count streams, not the entire page shell. */
async function HeroWithData() {
  const mosaicData = await getHomepageMosaicData();
  return <HeroSection tileCount={mosaicData.stats.public_tiles} />;
}

/** Async wrapper to fetch live Research Pulse data. */
async function ResearchPulseWithData() {
  try {
    const feed = await listLatestResearchPulse({ page: 1, page_size: 3 });
    const liveCards = feed.items.map((item) => ({
      slug: item.slug,
      tag: item.diagnosis_tags[0]?.label ?? item.theme_tags[0]?.label ?? "Research",
      tagAccent: mapThemeToAccent(item),
      title: item.title,
      summary: item.summary,
      journal: item.journal_name ?? "Peer-reviewed study",
      date: formatPulseDate(item.published_at),
      sourceUrl: item.source_url,
    }));
    return <ResearchPulseSection liveCards={liveCards} />;
  } catch {
    return <ResearchPulseSection />;
  }
}

export default function HomePage() {
  return (
    <main>
      <StructuredData data={structuredData} />
      <Suspense fallback={<HeroSection tileCount={0} />}>
        <HeroWithData />
      </Suspense>
      <StatsSection />
      <MissionSection />
      <Suspense fallback={<ResearchPulseSection />}>
        <ResearchPulseWithData />
      </Suspense>
      <MosaicSpotlight />
      <OriginSection />
      <CTAFooter />
    </main>
  );
}
