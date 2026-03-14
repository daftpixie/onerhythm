"use client";

import { motion } from "framer-motion";

import { StatCard } from "../home/stat-card";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

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

export function CrisisDashboard() {
  return (
    <section className="bg-midnight py-12">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-pulse">
            The Crisis
          </p>
          <h2 className="mt-3 font-display text-[1.95rem] font-semibold text-text-primary sm:text-4xl">
            The Numbers That Started This
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">
            Not projections. Not estimates. Taken from real patients. Published
            in real journals. And still waiting to be fully integrated into
            routine clinical care.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

        <motion.blockquote
          className="mt-8 rounded-xl border-l-[3px] border-pulse bg-cosmos px-6 py-5"
          initial={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-40px" }}
          whileInView={{ opacity: 1, x: 0 }}
        >
          <p className="max-w-3xl text-base italic leading-7 text-text-secondary">
            &ldquo;The psychological consequences of arrhythmia are not
            quality-of-life footnotes. They are killing people.&rdquo;
          </p>
        </motion.blockquote>
      </div>
    </section>
  );
}
