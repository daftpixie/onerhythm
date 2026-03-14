"use client";

import { motion } from "framer-motion";

import { PillarCard } from "./pillar-card";

const pillars = [
  {
    pillar: "visibility" as const,
    title: "Visibility",
    subtitle: "The Bear You Can\u2019t See",
    description:
      "Forcing the conversation cardiology has been avoiding. Naming the psychological devastation of arrhythmia with clinical precision and human honesty.",
    href: "/about",
  },
  {
    pillar: "community" as const,
    title: "Community",
    subtitle: "You Are Not Alone In This",
    description:
      "A collective heart mosaic where every de-identified ECG becomes a tile in a growing artwork. Your heartbeat, joined with thousands of others.",
    href: "/community",
  },
  {
    pillar: "education" as const,
    title: "Education",
    subtitle: "Arm Yourself With Knowledge",
    description:
      "Clinically grounded, non-diagnostic educational content that empowers you to advocate for your own mental health within the cardiology system.",
    href: "/learn",
  },
];

export function MissionSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
      <motion.h2
        className="font-display text-3xl font-bold text-text-primary sm:text-4xl"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true, margin: "-60px" }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        How OneRhythm Responds
      </motion.h2>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((p, i) => (
          <PillarCard
            description={p.description}
            href={p.href}
            index={i}
            key={p.pillar}
            pillar={p.pillar}
            subtitle={p.subtitle}
            title={p.title}
          />
        ))}
      </div>
    </section>
  );
}
