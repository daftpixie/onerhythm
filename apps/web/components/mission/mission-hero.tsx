"use client";

import { motion } from "framer-motion";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Decorative rising trendline behind hero text — purely decorative. */
function RisingTrace() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.08]"
    >
      <svg
        className="h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 1400 400"
      >
        <defs>
          <linearGradient id="trend-fade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--color-pulse)" stopOpacity="0" />
            <stop offset="30%" stopColor="var(--color-pulse)" stopOpacity="1" />
            <stop offset="70%" stopColor="var(--color-pulse)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--color-pulse)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,350 C200,340 300,310 500,280 C700,250 800,200 900,160 C1000,120 1100,80 1200,50 L1400,10"
          fill="none"
          stroke="url(#trend-fade)"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            dur="8s"
            from="-200,0"
            to="0,0"
            type="translate"
            repeatCount="indefinite"
          />
        </path>
      </svg>
    </div>
  );
}

export function MissionHero() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-void)" }}
      />

      <RisingTrace />

      <div className="relative max-w-3xl text-center">
        <motion.h1
          className="font-display text-5xl font-bold leading-tight text-text-primary sm:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_REVEAL }}
        >
          Reverse the Numbers.
        </motion.h1>

        <motion.p
          className="mx-auto mt-8 max-w-2xl text-base leading-8 text-text-secondary"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: EASE_REVEAL }}
        >
          The psychological burden of cardiac arrhythmia is not theoretical. It
          is measured, published, and rising. OneRhythm exists to move those
          numbers in the other direction — through visibility, community, and
          education.
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
