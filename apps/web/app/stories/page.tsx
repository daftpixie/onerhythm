import type { Metadata } from "next";

import { ContentListPage } from "../../components/content-list-page";
import { listContentByKind } from "../../lib/content";
import { buildPageMetadata } from "../../lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Stories",
  description:
    "Long-form essays and narrative articles about why OneRhythm exists and what the platform is trying to make visible.",
  path: "/stories",
});

export default function StoriesPage() {
  return (
    <ContentListPage
      entries={listContentByKind("essay")}
      hrefBase="/stories"
      intro="Long-form narrative writing that explains the project's origin, public purpose, and the human problem OneRhythm is trying to address."
      kicker="Stories"
      title="Essays and narrative articles"
    />
  );
}
