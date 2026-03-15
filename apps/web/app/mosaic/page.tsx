import type { Metadata } from "next";
import type { MilestoneDefinition } from "@onerhythm/types";

import { HeartMosaic } from "../../components/heart-mosaic";
import {
  SharedRhythmCounter,
  EarthProgressRing,
  RhythmStatRow,
  MilestoneTimeline,
  TrustSection,
  WhyItMatters,
} from "../../components/mosaic";
import { buildPageMetadata } from "../../lib/metadata";
import { getHomepageMosaicData } from "../../lib/mosaic-api";
import { getRhythmDistanceStats } from "../../lib/rhythm-api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Heart Mosaic — Our Shared Rhythm",
  description:
    "Explore the collective Heart Mosaic and see how far our community's shared rhythm has traveled. Every contribution adds to a growing artwork.",
  path: "/mosaic",
  keywords: [
    "heart mosaic",
    "rhythm distance",
    "arrhythmia community",
    "collective art",
  ],
});

const ALL_MILESTONES: MilestoneDefinition[] = [
  {
    key: "iss_orbit",
    label: "ISS Orbit",
    distance_km: 408,
    description:
      "Our shared rhythm has circled the International Space Station.",
  },
  {
    key: "earth_circumference",
    label: "Around the Earth",
    distance_km: 40_075,
    description: "Our shared rhythm has wrapped around the planet.",
  },
  {
    key: "moon_distance",
    label: "To the Moon",
    distance_km: 384_400,
    description: "Our shared rhythm has reached the Moon.",
  },
  {
    key: "sun_distance",
    label: "To the Sun",
    distance_km: 149_600_000,
    description: "Our shared rhythm has reached the Sun.",
  },
];

export default async function MosaicPage() {
  const [rhythmStats, mosaicData] = await Promise.all([
    getRhythmDistanceStats(),
    getHomepageMosaicData(),
  ]);

  const earthProgress =
    rhythmStats.earth_loops >= 1
      ? rhythmStats.earth_loops % 1
      : rhythmStats.progress_toward_next;

  return (
    <main>
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pb-12 pt-20 sm:pt-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--gradient-void)" }}
        />
        <SharedRhythmCounter
          distanceKm={rhythmStats.total_distance_km}
          totalContributions={rhythmStats.total_contributions}
        />

        <div className="mt-12">
          <EarthProgressRing
            progress={earthProgress}
            earthLoops={rhythmStats.earth_loops}
            label={
              rhythmStats.next_milestone
                ? `Progress toward ${rhythmStats.next_milestone.label}`
                : "Journey continues"
            }
          />
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <RhythmStatRow stats={rhythmStats} />
      </section>

      {/* Mosaic canvas */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="mb-8 text-center font-display text-2xl font-bold text-text-primary sm:text-3xl">
          The Heart Mosaic
        </h2>
        <HeartMosaic
          fetchState={mosaicData.fetch_state}
          stats={mosaicData.stats}
          tiles={mosaicData.tiles}
        />
      </section>

      {/* Milestones */}
      <section className="mx-auto max-w-2xl px-6 py-12">
        <MilestoneTimeline
          milestones={ALL_MILESTONES}
          currentMilestoneKey={rhythmStats.current_milestone?.key ?? null}
        />
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-5xl px-6">
        <TrustSection />
      </section>

      {/* Why it matters + disclaimer */}
      <section className="mx-auto max-w-5xl px-6">
        <WhyItMatters />
      </section>
    </main>
  );
}
