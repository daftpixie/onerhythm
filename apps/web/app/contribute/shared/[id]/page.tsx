import type { Metadata } from "next";
import Link from "next/link";

import { MedicalDisclaimer } from "@onerhythm/ui";

import { ArtReveal } from "../../../../components/contribute/art-reveal";
import { buildPageMetadata } from "../../../../lib/metadata";
import { getRhythmDistanceStats } from "../../../../lib/rhythm-api";

export const dynamic = "force-dynamic";

type PageParams = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { id } = await params;
  const stats = await getRhythmDistanceStats();
  const earthPercent = stats.earth_loops * 100;

  return buildPageMetadata({
    title: "A Rhythm Joined the Mosaic",
    description: `${stats.total_distance_km.toLocaleString()} km of shared rhythm — ${earthPercent.toFixed(1)}% around the world. ${stats.total_contributions.toLocaleString()} heartbeats united. Add yours.`,
    path: `/contribute/shared/${id}`,
    type: "website",
    ogImagePath: `/api/og/share/${id}`,
  });
}

export default async function SharedContributionPage({
  params,
}: {
  params: PageParams;
}) {
  const { id } = await params;
  const stats = await getRhythmDistanceStats();
  const earthPercent = stats.earth_loops * 100;

  return (
    <main className="flex min-h-[90dvh] flex-col items-center justify-center px-6 py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-void)" }}
      />

      <div className="w-full max-w-[38rem]">
        <ArtReveal variant="fallback" />
      </div>

      <h1 className="mt-8 text-center font-display text-3xl font-bold text-text-primary sm:text-4xl">
        This rhythm joined the shared line.
      </h1>

      <p className="mt-3 font-mono text-sm text-signal">
        {stats.total_distance_km.toLocaleString(undefined, { maximumFractionDigits: 2 })} km
        {" — "}
        {earthPercent.toFixed(1)}% around the world
      </p>

      <p className="mt-2 text-sm text-text-secondary">
        {stats.total_contributions.toLocaleString()} heartbeats united
      </p>

      <div className="mx-auto mt-10 max-w-md space-y-3 text-center">
        <p className="text-base leading-7 text-text-secondary">
          Every heartbeat matters. Including yours.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          className="action-link action-link-primary px-8 py-4 text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          href="/contribute"
        >
          Add Your Rhythm
        </Link>
        <Link
          className="action-link action-link-quiet px-6 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          href="/mosaic"
        >
          Explore the Mosaic
        </Link>
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        <MedicalDisclaimer />
      </div>
    </main>
  );
}
