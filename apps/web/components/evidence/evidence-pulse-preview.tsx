"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import type { ResearchPulseFeedItem } from "@onerhythm/types";

import { ResearchPulseCard } from "../home/research-pulse-card";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

function mapThemeToAccent(tags: ResearchPulseFeedItem["theme_tags"]): "pulse" | "signal" | "aurora" {
  const first = tags[0]?.slug;
  if (!first) return "signal";
  if (first === "mental_health" || first === "quality_of_life") return "pulse";
  if (first === "device" || first === "genetics" || first === "innovation") return "aurora";
  return "signal";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function EvidencePulsePreviewContent({
  items,
}: {
  items: ResearchPulseFeedItem[];
}) {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
            Research Pulse
          </p>
          <h2 className="mt-3 font-display text-[1.95rem] font-semibold text-text-primary sm:text-4xl">
            Latest from the Literature
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">
            Newly published peer-reviewed studies, translated into language
            anyone can carry with them.
          </p>
        </motion.div>

        {items.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.slice(0, 3).map((item, i) => (
              <ResearchPulseCard
                date={formatDate(item.published_at)}
                index={i}
                journal={item.journal_name ?? "Peer-reviewed study"}
                key={item.publication_id}
                slug={item.slug}
                sourceUrl={item.source_url}
                summary={item.summary}
                tag={item.diagnosis_tags[0]?.label ?? item.theme_tags[0]?.label ?? "Research"}
                tagAccent={mapThemeToAccent(item.theme_tags)}
                title={item.title}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-token bg-cosmos p-6 text-center">
            <p className="text-base text-text-secondary">
              The Research Pulse feed is ready to display reviewed publications
              as soon as they are ingested and published.
            </p>
          </div>
        )}

        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-40px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Link
            className="action-link action-link-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            href="/research/pulse"
          >
            Open Research Pulse
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
