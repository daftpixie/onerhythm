import type { Metadata } from "next";

import { ContentListPage } from "../../components/content-list-page";
import { listContentByKind } from "../../lib/content";
import { buildPageMetadata } from "../../lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Support",
  description:
    "Support-resource pages that acknowledge emotional burden and point to grounded, non-diagnostic starting places.",
  path: "/support",
});

export default function SupportPage() {
  return (
    <ContentListPage
      entries={listContentByKind("support_resource")}
      hrefBase="/support"
      intro="Support-resource pages that acknowledge the emotional dimension of rhythm conditions while keeping the platform firmly in educational territory."
      kicker="Support"
      title="Support resources"
    />
  );
}
