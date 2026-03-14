"use client";

import { motion } from "framer-motion";

import { EcgTrace } from "../home/ecg-trace";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function AboutHero() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6">
      {/* Deep void radial background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-void)" }}
      />

      {/* Decorative ECG trace behind text */}
      <EcgTrace className="absolute inset-x-0 top-1/2 h-24 -translate-y-1/2 opacity-[0.07]" />

      <div className="relative max-w-3xl text-center">
        <motion.h1
          className="font-display text-[2.44rem] font-bold leading-tight text-text-primary sm:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_REVEAL }}
        >
          Nobody should fight an invisible bear alone.
        </motion.h1>

        <motion.p
          className="mx-auto mt-8 max-w-2xl text-base leading-8 text-text-secondary"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: EASE_REVEAL }}
        >
          OneRhythm was built because the silence around arrhythmia&rsquo;s
          psychological toll has done real damage - and because one person who
          survived it decided the community that shared his story deserved
          something built in return.
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4], y: [0, 6, 0] }}
        className="absolute bottom-6 text-text-tertiary"
        transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
      >
        <svg
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </motion.div>
    </section>
  );
}
