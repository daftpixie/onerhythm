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
    value: "1 in 5",
    description: "symptomatic AFib patients reported suicidal thoughts",
    source: "AHA / Royal Melbourne Hospital",
    accent: "pulse" as const,
  },
  {
    value: "3.2\u00d7",
    description: "mortality risk from elevated PTSD in ICD patients",
    source: "Circ: Arrhythmia & Electrophysiology",
    accent: "signal" as const,
  },
];

export function EvidenceInterlude() {
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
            I Was Inside the Numbers
          </h2>
          <p className="mt-3 text-base leading-7 text-text-secondary">
            And I didn&rsquo;t know it. Because nobody told me.
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

        <motion.p
          className="mt-10 max-w-2xl text-base leading-[1.7] text-text-secondary"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-40px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          These are not edge cases. They are the norm. And mental health
          screening is still not standard practice in most EP clinics.
        </motion.p>
      </div>
    </section>
  );
}
