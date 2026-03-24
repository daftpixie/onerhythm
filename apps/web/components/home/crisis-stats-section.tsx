"use client";

import Link from "next/link";

import { SectionWrapper } from "../ui/section-wrapper";
import { Heading } from "../typography/heading";
import { StatCard } from "./stat-card";
import { getStatCardByKey } from "../../content/partials/stat-cards";
import { crisisResources } from "../../content/partials/disclaimers";
import { homepage } from "../../content/pages/homepage";

export function CrisisStatsSection() {
  const { crisisStats } = homepage;
  const cards = crisisStats.cardKeys
    .map((key) => getStatCardByKey(key))
    .filter(Boolean);

  return (
    <SectionWrapper bg="midnight" id="crisis-numbers">
      <div className="mx-auto max-w-4xl text-center">
        <Heading as="h2" size="display">
          {crisisStats.heading}
        </Heading>
        <p className="mt-4 text-body-lg leading-relaxed text-text-secondary">
          {crisisStats.subhead}
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <div key={card!.key}>
            <StatCard
              value={card!.value}
              description={card!.description}
              meaning={card!.meaning}
              action={card!.action}
              source={card!.source}
              accent={card!.requiresCrisisResources ? "pulse" : "signal"}
              index={i}
            />

            {/* Crisis resources immediately after suicidal ideation stat */}
            {card!.requiresCrisisResources && (
              <div
                className="mt-4 rounded-lg border border-pulse/20 bg-pulse/5 p-5"
                role="complementary"
                aria-label="Crisis resources"
              >
                <p className="text-sm font-medium text-pulse">
                  {crisisResources.intro}
                </p>
                <ul className="mt-3 space-y-2">
                  {crisisResources.resources.map((resource) => (
                    <li key={resource.name} className="text-sm text-text-secondary">
                      <Link
                        href={resource.href}
                        className="font-medium text-signal-soft transition-colors hover:text-signal"
                      >
                        {resource.name}
                      </Link>
                      {" — "}
                      {resource.action}
                      <span className="ml-1 text-text-tertiary">({resource.region})</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-text-tertiary">
                  {crisisResources.nonTherapeuticBoundary}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
