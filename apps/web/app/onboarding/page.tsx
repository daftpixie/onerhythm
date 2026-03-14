import type { Metadata } from "next";

import { requireAuthenticatedPage } from "../../lib/server-auth";
import { OnboardingShell } from "./onboarding-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OnboardingPage() {
  await requireAuthenticatedPage("/onboarding");
  return <OnboardingShell />;
}
