"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { MedicalDisclaimer } from "@onerhythm/ui";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

const provenancePoints = [
  {
    label: "Founder narrative",
    body: "Explains why the project exists. It does not stand in for medical evidence.",
  },
  {
    label: "Institutional references",
    body: "Describe product boundaries, review workflows, educational architecture, and public promises.",
  },
  {
    label: "Research translations",
    body: "Help explain public themes without drifting into diagnosis, treatment advice, or sensationalism.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: EASE_REVEAL,
    },
  }),
};

export function EvidenceSourceRegistry() {
  return (
    <section className="bg-midnight py-12">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-aurora">
            Provenance Model
          </p>
          <h2 className="mt-3 font-display text-[1.95rem] font-semibold text-text-primary sm:text-4xl">
            How to Read This Site
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">
            The current evidence registry is intentionally small. Every source
            has exact citation details and a clear reason to be here. Evidence
            should sharpen the story, not turn into filler.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {provenancePoints.map((point, i) => (
            <motion.div
              className="rounded-xl border border-token bg-cosmos p-6"
              custom={i}
              initial="hidden"
              key={point.label}
              variants={cardVariants}
              viewport={{ once: true, margin: "-40px" }}
              whileInView="visible"
            >
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                {point.label}
              </p>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                {point.body}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-8 flex flex-wrap gap-4"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-40px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Link
            className="action-link action-link-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            href="/research"
          >
            Browse research articles
          </Link>
        </motion.div>

        <div className="mt-10">
          <MedicalDisclaimer />
        </div>
      </div>
    </section>
  );
}
