import type { Metadata } from "next";

import { LaunchLandingPage } from "../../components/launch/launch-landing-page";
import { launchContent } from "../../content/launch";
import { getLaunchModeConfig } from "../../lib/launch-mode";

const launchConfig = getLaunchModeConfig();
const launchImageUrl = new URL("/brand/og/og-default-1200x630.png", launchConfig.launchUrl).toString();

export const metadata: Metadata = {
  title: "Public Launch | OneRhythm",
  description: launchContent.hero.body,
  alternates: {
    canonical: launchConfig.launchUrl,
  },
  openGraph: {
    title: "OneRhythm Public Launch",
    description: launchContent.hero.body,
    url: launchConfig.launchUrl,
    siteName: "OneRhythm",
    type: "website",
    images: [
      {
        url: launchImageUrl,
        width: 1200,
        height: 630,
        alt: "OneRhythm public launch",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OneRhythm Public Launch",
    description: launchContent.hero.body,
    images: [launchImageUrl],
  },
};

export default function LaunchPage() {
  return <LaunchLandingPage />;
}
