import type { Metadata } from "next";

import { ContentListPage } from "../../components/content-list-page";
import { listContentByKind } from "../../lib/content";
import { buildPageMetadata } from "../../lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Campaigns",
  description:
    "Campaign landing pages for OneRhythm's public visibility and advocacy strategy.",
  path: "/campaigns",
});

export default function CampaignsPage() {
  return (
    <ContentListPage
      entries={listContentByKind("campaign_page")}
      hrefBase="/campaigns"
      intro="Public campaign pages that support visibility, advocacy, and community understanding without compromising the platform's product boundaries."
      kicker="Campaigns"
      title="Campaign pages"
    />
  );
}
