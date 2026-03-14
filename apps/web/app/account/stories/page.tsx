import type { Metadata } from "next";

import { requireAuthenticatedPage } from "../../../lib/server-auth";
import { StorySubmissionShell } from "./story-submission-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StorySubmissionPage() {
  await requireAuthenticatedPage("/account/stories");
  return <StorySubmissionShell />;
}
