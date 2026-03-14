import type { Metadata } from "next";

import {
  CounterArgument,
  CrisisDashboard,
  ESCValidation,
  MissionCTA,
  MissionDeclaration,
  MissionHero,
  TrendlineSection,
} from "../../components/mission";
import { buildPageMetadata } from "../../lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "The Mission — OneRhythm",
  description:
    "The psychological burden of arrhythmia is measurable, documented, and rising. OneRhythm's mission is to reverse the numbers through visibility, community, and education.",
  path: "/mission",
  keywords: [
    "OneRhythm mission",
    "arrhythmia mental health",
    "cardiac psychology",
    "visibility community education",
  ],
});

export default function MissionPage() {
  return (
    <main>
      <MissionHero />
      <CrisisDashboard />
      <TrendlineSection />
      <MissionDeclaration />
      <ESCValidation />
      <CounterArgument />
      <MissionCTA />
    </main>
  );
}
