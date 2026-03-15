"use client";

import { motion } from "framer-motion";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function EvidenceHero() {
  return (
    <section className="relative bg-midnight py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-void)" }}
      />

      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <motion.div
          className="max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
            Research & Evidence
          </p>
          <h1 className="mt-3 font-display text-[2.44rem] font-bold text-text-primary sm:text-5xl">
            The numbers make the case.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
            OneRhythm is built on a public argument: the psychological toll of
            arrhythmia is measurable, widespread, and still waiting to be fully
            integrated into routine clinical care. This page surfaces the
            numbers, parses the data, and translates the evidence into plain language.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
