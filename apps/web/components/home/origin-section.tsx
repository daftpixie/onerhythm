"use client";

import { motion } from "framer-motion";

export function OriginSection() {
  return (
    <section className="bg-midnight py-20">
      <motion.div
        className="mx-auto max-w-3xl px-6 sm:px-10 lg:px-12"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true, margin: "-60px" }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <blockquote className="rounded-xl border-l-[3px] border-pulse pl-6">
          <p className="text-lg font-medium leading-8 text-text-primary">
            Built because the evidence is real and the silence around it has done
            damage.
          </p>
          <p className="mt-4 text-base leading-8 text-text-secondary">
            I lived with highly symptomatic arrhythmogenic right ventricular
            cardiomyopathy for a decade - three million extra heartbeats a year,
            an ICD that shocked me three times, seven EP lab visits, four RF
            ablations. The physical toll was staggering. The psychological toll -
            unscreened, unacknowledged, untreated - was never ending. OneRhythm was built
            to help other humans fight their bears.
          </p>
          <p className="mt-4 text-base leading-8 text-text-secondary">
            My story is not offered as a substitute for evidence. The evidence
            is what makes the problem undeniable. The personal story explains why
            this work refuses to look away from it.
          </p>
          <footer className="mt-6 space-y-1">
            <p className="text-sm text-text-secondary">
              Matthew Adams - Founder, OneRhythm
            </p>
            <p className="font-mono text-xs text-text-tertiary">
              Builder. Bear Fighting Jedi.
            </p>
          </footer>
        </blockquote>
      </motion.div>
    </section>
  );
}
