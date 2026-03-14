import type { Metadata } from "next";

import { ContentListPage } from "../../components/content-list-page";
import { listConditionModules } from "../../lib/content";
import { buildPageMetadata } from "../../lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Conditions",
  description:
    "Condition education modules in plain language, built for educational clarity and persistent non-diagnostic context.",
  path: "/conditions",
});

export default function ConditionsPage() {
  return (
    <ContentListPage
      entries={listConditionModules()}
      hrefBase="/conditions"
      intro="Plain-language condition education modules that help people orient themselves, prepare questions, and find reviewed source material."
      kicker="Condition education"
      title="Condition modules"
    />
  );
}
