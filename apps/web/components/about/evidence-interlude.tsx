"use client";

import { motion } from "framer-motion";

import { siteContent } from "../../content/site-copy";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function EvidenceInterlude() {
  const stat = siteContent.about.evidenceStat;

  return (
    <section className="bg-midnight py-12">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-display text-[1.95rem] font-semibold text-text-primary sm:text-4xl">
            {siteContent.about.evidenceTitle}
          </h2>
          <p className="mt-3 text-base leading-7 text-text-secondary">
            Numbers matter only when they become visible enough to change what happens next.
          </p>
        </motion.div>

        <div className="mt-10 max-w-4xl rounded-[2rem] border border-token bg-cosmos p-6 shadow-subtle sm:p-8">
          <p className="mt-4 font-display text-[clamp(3.5rem,8vw,5rem)] leading-none text-pulse">
            {stat.value}
          </p>
          <p className="mt-4 text-lg font-medium leading-8 text-text-primary">{stat.description}</p>
          <p className="mt-4 text-sm leading-7 text-text-secondary">{stat.meaning}</p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">{stat.action}</p>
          <p className="mt-5 font-mono text-xs leading-5 text-text-tertiary">{stat.source}</p>
        </div>

        <motion.p
          className="mt-10 max-w-2xl text-base leading-[1.7] text-text-secondary"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-40px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          OneRhythm exists to turn those numbers into visibility, community, and
          better support pathways, not into fear.
        </motion.p>
      </div>
    </section>
  );
}
