"use client";

import { motion } from "framer-motion";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function CounterArgument() {
  return (
    <section className="relative py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{ background: "var(--gradient-heartbeat)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-void)" }}
      />

      <div className="mx-auto max-w-[720px] px-6 sm:px-10 lg:px-12">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-pulse">
            The Response
          </p>

          <p className="text-base leading-[1.7] text-text-secondary">
            Cardiology has made extraordinary progress in treating arrhythmia.
            The procedures are better, the devices are smarter, the survival
            rates are higher. What hasn&rsquo;t kept pace is the psychological
            support surrounding that care. Every year the anxiety prevalence
            data grows clearer, and the opportunity to bridge that gap grows
            more urgent.
          </p>

          <p className="text-base leading-[1.7] text-text-secondary">
            OneRhythm exists to help close that gap - not by replacing clinical
            care, but by giving patients the tools to see the research,
            understand it, connect with each other, and walk into their next
            appointment ready to have a fuller conversation with their care
            team.
          </p>
        </motion.div>

        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.6, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-40px" }}
          whileInView={{ opacity: 1, scale: 1 }}
        >
          <p className="font-display text-[1.56rem] font-semibold leading-snug text-text-primary sm:text-[1.75rem]">
            The next number we publish should be the number of people who
            decided they didn&rsquo;t have to carry this alone.
          </p>
        </motion.div>

        <div className="mt-8 flex justify-center">
          <span
            aria-hidden="true"
            className="block h-px w-[120px] rounded-full"
            style={{ background: "var(--gradient-heartbeat)" }}
          />
        </div>
      </div>
    </section>
  );
}
