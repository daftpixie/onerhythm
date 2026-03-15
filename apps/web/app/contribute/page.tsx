import type { Metadata } from "next";
import Link from "next/link";

import { buildPageMetadata } from "../../lib/metadata";
import { getRhythmDistanceStats } from "../../lib/rhythm-api";
import { requireAuthenticatedPage } from "../../lib/server-auth";
import { SharedRhythmCounter } from "../../components/mosaic";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Contribute — Your Rhythm Becomes Art",
  description:
    "Add your heartbeat to the collective mosaic. Your ECG is de-identified, transformed into art, and the original is destroyed.",
  path: "/contribute",
});

export default async function ContributeWelcomePage() {
  await requireAuthenticatedPage("/contribute");
  const stats = await getRhythmDistanceStats();

  return (
    <main className="flex min-h-[80dvh] flex-col items-center justify-center px-6 py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-void)" }}
      />

      <h1 className="text-center font-display text-4xl font-bold text-text-primary sm:text-5xl lg:text-6xl">
        Your Rhythm Becomes Art.
      </h1>

      <div className="mx-auto mt-10 max-w-md space-y-4 text-center">
        <p className="text-base leading-7 text-text-secondary">
          Your ECG is de-identified and stripped of all metadata.
        </p>
        <p className="text-base leading-7 text-text-secondary">
          It is transformed into an abstract artistic tile — the original is
          permanently destroyed.
        </p>
        <p className="text-base leading-7 text-text-secondary">
          Your contribution joins a collective artwork visible to everyone.
        </p>
      </div>

      {stats.total_contributions > 0 && (
        <div className="mt-12">
          <SharedRhythmCounter
            distanceKm={stats.total_distance_km}
            totalContributions={stats.total_contributions}
          />
        </div>
      )}

      <Link
        className="action-link action-link-primary mt-12 px-8 py-4 text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        href="/contribute/consent"
      >
        Begin
      </Link>
    </main>
  );
}
