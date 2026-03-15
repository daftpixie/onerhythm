import type { Metadata } from "next";
import Link from "next/link";

import { CollectiveMoment } from "../../../components/contribute";
import { SharePanel } from "../../../components/shared/share-panel";
import { buildPageMetadata } from "../../../lib/metadata";
import { getRhythmDistanceStats } from "../../../lib/rhythm-api";
import { requireAuthenticatedPage } from "../../../lib/server-auth";
import { absoluteUrl } from "../../../lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "You're Part of the Mosaic",
  description: "Your rhythm has joined the collective Heart Mosaic.",
  path: "/contribute/joined",
});

export default async function JoinedPage() {
  await requireAuthenticatedPage("/contribute/joined");
  const stats = await getRhythmDistanceStats();
  const earthPercent = stats.earth_loops * 100;
  const sharePageUrl = absoluteUrl("/contribute/shared/preview");

  return (
    <main className="flex min-h-[80dvh] flex-col items-center justify-center px-6 py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-void)" }}
      />

      <h1 className="text-center font-display text-3xl font-bold text-text-primary sm:text-4xl lg:text-5xl">
        You&rsquo;re Part of the Mosaic
      </h1>

      <div className="mt-10">
        <CollectiveMoment
          totalDistanceKm={stats.total_distance_km}
          totalContributions={stats.total_contributions}
        />
      </div>

      <div className="mt-10">
        <SharePanel
          sharePageUrl={sharePageUrl}
          distanceKm={stats.total_distance_km}
          earthPercent={earthPercent}
          contributorCount={stats.total_contributions}
          headline="Share the Journey"
          subline="Every share brings someone closer to knowing they're not alone."
          variant="contribution"
        />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/mosaic"
          className="action-link action-link-primary px-6 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        >
          Explore the Mosaic
        </Link>
        <Link
          href="/"
          className="action-link action-link-quiet px-6 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
