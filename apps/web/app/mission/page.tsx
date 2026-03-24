import type { Metadata } from "next";

import { MissionControlShell } from "../../components/mission/mission-control-shell";
import { siteContent } from "../../content/site-copy";
import {
  getMissionActivityStats,
  getMissionOverview,
  getMissionRhythmTypeStats,
  getMissionRouteGeometry,
  getMissionSegmentsWindow,
} from "../../lib/mission-v3-api";
import { buildPageMetadata } from "../../lib/metadata";
import {
  buildEmptyMissionActivityStats,
  buildEmptyMissionOverview,
  buildEmptyMissionRhythmTypeStats,
} from "../../lib/mission-v3-overview";
import {
  buildEmptyMissionRouteGeometry,
  buildEmptyMissionSegmentsWindow,
} from "../../lib/mission-v3-scene";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: siteContent.metadata.mission.title,
  description: siteContent.metadata.mission.description,
  path: "/mission",
  keywords: [...siteContent.metadata.mission.keywords],
});

async function loadMissionPageData() {
  const [
    overview,
    routeGeometry,
    segmentsWindow,
    nearProgressWindow,
    milestoneLocalWindow,
    countryHighlightWindow,
    activityStats,
    rhythmTypeStats,
  ] = await Promise.all([
    getMissionOverview().catch(() => buildEmptyMissionOverview()),
    getMissionRouteGeometry().catch(() => buildEmptyMissionRouteGeometry()),
    getMissionSegmentsWindow("recent", 64).catch(() => buildEmptyMissionSegmentsWindow("recent", 64)),
    getMissionSegmentsWindow("near_progress", 44).catch(() =>
      buildEmptyMissionSegmentsWindow("near_progress", 44),
    ),
    getMissionSegmentsWindow("milestone_local", 24).catch(() =>
      buildEmptyMissionSegmentsWindow("milestone_local", 24),
    ),
    getMissionSegmentsWindow("country_highlights", 18).catch(() =>
      buildEmptyMissionSegmentsWindow("country_highlights", 18),
    ),
    getMissionActivityStats().catch(() => buildEmptyMissionActivityStats()),
    getMissionRhythmTypeStats().catch(() => buildEmptyMissionRhythmTypeStats()),
  ]);

  return {
    overview,
    routeGeometry,
    segmentsWindow,
    nearProgressWindow,
    milestoneLocalWindow,
    countryHighlightWindow,
    activityStats,
    rhythmTypeStats,
  };
}

export default async function MissionPage() {
  const {
    overview,
    routeGeometry,
    segmentsWindow,
    nearProgressWindow,
    milestoneLocalWindow,
    countryHighlightWindow,
    activityStats,
    rhythmTypeStats,
  } = await loadMissionPageData();

  return (
    <MissionControlShell
      initialCountryHighlightWindow={countryHighlightWindow}
      initialActivityStats={activityStats}
      initialMilestoneLocalWindow={milestoneLocalWindow}
      initialNearProgressWindow={nearProgressWindow}
      initialOverview={overview}
      initialRhythmTypeStats={rhythmTypeStats}
      initialRouteGeometry={routeGeometry}
      initialSegmentsWindow={segmentsWindow}
    />
  );
}
