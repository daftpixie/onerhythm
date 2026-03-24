"use client";

import Link from "next/link";
import type { MissionOverview } from "@onerhythm/types";

import { SectionWrapper } from "../ui/section-wrapper";
import { Heading } from "../typography/heading";
import { DataText } from "../typography/data-text";
import { Badge } from "../ui/badge";
import { homepage } from "../../content/pages/homepage";
import { useMissionLiveOverview } from "../../lib/use-mission-live-overview";

function formatDistance(meters: number): string {
  if (meters >= 1_000_000) return `${(meters / 1_000).toLocaleString("en-US", { maximumFractionDigits: 0 })} km`;
  if (meters >= 1_000) return `${(meters / 1_000).toLocaleString("en-US", { maximumFractionDigits: 1 })} km`;
  return `${meters.toLocaleString("en-US", { maximumFractionDigits: 1 })} m`;
}

export function MissionDistanceSection({
  initialOverview,
}: {
  initialOverview: MissionOverview;
}) {
  const { missionDistance, milestones } = homepage;
  const { overview } = useMissionLiveOverview(initialOverview);

  const distanceM = overview.aggregate.total_distance_m;
  const contributions = overview.aggregate.total_contributions;
  const countries = overview.aggregate.countries_represented;

  return (
    <SectionWrapper bg="midnight">
      <div className="mx-auto max-w-4xl">
        <Badge variant="cyan">{missionDistance.subhead}</Badge>

        <Heading as="h2" size="display" className="mt-4">
          {missionDistance.heading}
        </Heading>

        <p className="mt-4 max-w-3xl text-body-lg leading-relaxed text-text-secondary">
          {missionDistance.body}
        </p>

        {/* Live counters */}
        <div className="mt-10 flex flex-wrap gap-8">
          <div>
            <DataText size="lg" className="block font-bold text-[2.5rem] text-signal">
              {formatDistance(distanceM)}
            </DataText>
            <p className="mt-1 text-sm text-text-secondary">shared distance</p>
          </div>
          <div>
            <DataText size="lg" className="block font-bold text-[2.5rem] text-signal">
              {contributions.toLocaleString("en-US")}
            </DataText>
            <p className="mt-1 text-sm text-text-secondary">rhythms joined</p>
          </div>
          <div>
            <DataText size="lg" className="block font-bold text-[2.5rem] text-signal">
              {countries}
            </DataText>
            <p className="mt-1 text-sm text-text-secondary">countries</p>
          </div>
        </div>

        {/* Narrative */}
        <div className="mt-10 max-w-3xl space-y-4 text-body-lg leading-relaxed text-text-secondary">
          {missionDistance.narrative.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {/* Milestone ladder */}
        <div className="mt-12 flex gap-4 overflow-x-auto pb-4" role="list" aria-label="Mission milestones">
          {milestones.map((milestone) => (
            <div
              key={milestone.distance}
              className="flex shrink-0 flex-col rounded-md bg-cosmos p-3"
              role="listitem"
            >
              <DataText size="sm" className="font-bold text-signal">
                {milestone.distance}
              </DataText>
              <p className="mt-1 text-body-sm text-text-primary">
                {milestone.label}
              </p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href={missionDistance.ctaHref}
            className="inline-flex h-12 min-w-[44px] items-center justify-center rounded-lg bg-pulse px-6 font-body text-body-lg font-medium text-white shadow-glow-pulse transition-all duration-200 ease-out hover:bg-pulse-dark"
          >
            {missionDistance.cta}
          </Link>
          <Link
            href={missionDistance.secondaryCtaHref}
            className="inline-flex h-12 min-w-[44px] items-center justify-center rounded-lg border border-[var(--color-border)] bg-cosmos px-6 font-body text-body-lg font-medium text-primary transition-all duration-200 ease-out hover:border-[var(--color-border-hover)] hover:bg-nebula"
          >
            {missionDistance.secondaryCta}
          </Link>
        </div>
      </div>
    </SectionWrapper>
  );
}
