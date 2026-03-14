import type { Metadata } from "next";

import {
  AboutCTA,
  AboutHero,
  EvidenceInterlude,
  OriginSection,
  PromiseSection,
  ResponseSection,
  WhatItIs,
} from "../../components/about";
import { buildPageMetadata } from "../../lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About OneRhythm — Why This Platform Exists",
  description:
    "OneRhythm was built by an ARVC survivor because the psychological toll of arrhythmia is measurable, documented, and still too often left unaddressed.",
  path: "/about",
  keywords: [
    "OneRhythm",
    "ARVC",
    "arrhythmia mental health",
    "Matthew Adams",
    "founder story",
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
      <PromiseSection />
      <AboutCTA />
    </main>
  );
}
