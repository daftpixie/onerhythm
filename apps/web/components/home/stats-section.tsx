"use client";

import { motion } from "framer-motion";

import { StatCard } from "./stat-card";

const stats = [
  {
    value: "88.3%",
    description: "of arrhythmia patients report moderate to severe anxiety",
    source: "Nature Scientific Reports (2025), N=222",
    accent: "pulse" as const,
  },
  {
    value: "71.1%",
    description: "report moderate to severe depression",
    source: "Nature Scientific Reports (2025), N=222",
    accent: "pulse" as const,
  },
  {
    value: "1 in 5",
    description: "symptomatic AFib patients reported suicidal thoughts",
    source: "AHA / Royal Melbourne Hospital",
    accent: "pulse" as const,
  },
  {
    value: "3.9\u00d7",
    description: "increased anxiety risk after ICD shocks",
    source: "EP Europace (2023), N=39,954",
    accent: "signal" as const,
  },
  {
    value: "3.2\u00d7",
    description: "mortality risk from elevated PTSD in ICD patients",
    source: "Circ: Arrhythmia & Electrophysiology",
    accent: "signal" as const,
  },
  {
    value: "22.6%",
    description: "of ICD patients experience clinically relevant anxiety",
    source: "EP Europace (2023), N=39,954",
    accent: "signal" as const,
  },
];

export function StatsSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true, margin: "-60px" }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
          The Numbers That Demand Attention
          <span
            aria-hidden="true"
            className="mt-2 block h-1 w-32 rounded-full"
            style={{ background: "var(--gradient-signal)" }}
          />
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
          Peer-reviewed research. Population-level data. A crisis hiding in
          plain sight.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => (
          <StatCard
            accent={stat.accent}
            description={stat.description}
            index={i}
            key={stat.value}
            source={stat.source}
            value={stat.value}
          />
        ))}
      </div>

      {/* Pull-quote callout */}
      <motion.blockquote
        className="mt-10 rounded-xl border-l-[3px] border-pulse bg-cosmos px-6 py-5"
        initial={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true, margin: "-40px" }}
        whileInView={{ opacity: 1, x: 0 }}
      >
        <p className="max-w-3xl text-base italic leading-7 text-text-secondary">
          &ldquo;The psychological consequences of arrhythmia are not
          quality-of-life footnotes. They are killing people.&rdquo;
        </p>
      </motion.blockquote>
    </section>
  );
}
