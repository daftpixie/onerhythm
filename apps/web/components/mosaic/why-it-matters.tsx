"use client";

import { motion } from "framer-motion";
import { MedicalDisclaimer } from "@onerhythm/ui";

const EASE_REVEAL = [0.16, 1, 0.3, 1] as const;

export function WhyItMatters() {
  return (
    <section className="py-16">
      <motion.div
        className="mx-auto max-w-2xl space-y-6 text-center"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: EASE_REVEAL as unknown as [number, number, number, number] }}
      >
        <h2 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
          Why It Matters
        </h2>
        <p className="text-base leading-8 text-text-secondary">
          Living with an arrhythmia can feel invisible. The Heart Mosaic turns
          individual contributions into a collective artwork - visible proof that
          no one fights this alone. Every artistic trace adds to a shared
          journey measured not in clinical terms, but in the distance our
          community&rsquo;s rhythm has traveled together.
        </p>
        <p className="text-sm leading-7 text-text-tertiary">
          The rhythm distance uses a documented ECG page-layout policy. Standard
          long rhythm strips count as 25 cm, standard single segments count as
          6.25 cm, and uncertain uploads fall back to one explicit rhythm unit
          rather than an opaque fractional value.
        </p>
      </motion.div>
      <div className="mx-auto mt-10 max-w-2xl">
        <MedicalDisclaimer />
      </div>
    </section>
  );
}
