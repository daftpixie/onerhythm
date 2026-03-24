import type { Metadata } from "next";

import {
  AboutCTA,
  AboutHero,
  EvidenceInterlude,
  OriginSection,
  ResponseSection,
  WhatItIs,
} from "../../components/about";
import { siteContent } from "../../content/site-copy";
import { buildPageMetadata } from "../../lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: siteContent.metadata.about.title,
  description: siteContent.metadata.about.description,
  path: "/about",
  keywords: [
    "OneRhythm",
    "founder story",
    "arrhythmia mental health",
    "arrhythmia support movement",
    "integrated arrhythmia care",
  ],
});

export default function AboutPage() {
  return (
    <main>
      <AboutHero />
      <OriginSection />
      <EvidenceInterlude />
      <ResponseSection />
      <WhatItIs />
      <AboutCTA />
    </main>
  );
}
