import type { Metadata } from "next";

import { StructuredData } from "../components/structured-data";
import { NarrativeHero } from "../components/home/narrative-hero";
import { CrisisStatsSection } from "../components/home/crisis-stats-section";
import { TreatmentGapSection } from "../components/home/treatment-gap-section";
import { MissionDistanceSection } from "../components/home/mission-distance-section";
import { ResearchPulseFeaturesSection } from "../components/home/research-pulse-features-section";
import { ArticlesSection } from "../components/home/articles-section";
import { HomepagePromiseSection } from "../components/home/homepage-promise-section";
import { siteContent } from "../content/site-copy";
import { getMissionOverview } from "../lib/mission-v3-api";
import { buildEmptyMissionOverview } from "../lib/mission-v3-overview";
import { buildPageMetadata } from "../lib/metadata";
import { absoluteUrl } from "../lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: siteContent.metadata.home.title,
  description: siteContent.metadata.home.description,
  path: "/",
  keywords: [...siteContent.metadata.home.keywords],
});

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OneRhythm",
    url: absoluteUrl("/"),
    description: siteContent.metadata.siteDescription,
    slogan: siteContent.global.ideology,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OneRhythm",
    url: absoluteUrl("/"),
    description: siteContent.metadata.home.description,
    publisher: {
      "@type": "Organization",
      name: "OneRhythm",
      url: absoluteUrl("/"),
    },
  },
];

export default async function HomePage() {
  const overview = await getMissionOverview().catch(() =>
    buildEmptyMissionOverview(),
  );

  return (
    <>
      <StructuredData data={structuredData} />
      <main>
        <NarrativeHero />
        <CrisisStatsSection />
        <TreatmentGapSection />
        <MissionDistanceSection initialOverview={overview} />
        <ResearchPulseFeaturesSection />
        <ArticlesSection />
        <HomepagePromiseSection />
      </main>
    </>
  );
}
