"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { EcgTrace } from "./ecg-trace";
import { HeartMosaicSVG } from "./heart-mosaic-svg";

type HeroSectionProps = {
  tileCount: number;
};

export function HeroSection({ tileCount }: HeroSectionProps) {
  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6">
      {/* Deep void radial background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-void)" }}
      />

      {/* Mosaic hero */}
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl"
        initial={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <HeartMosaicSVG className="w-full" tileCount={160} />
      </motion.div>

      {/* Counter + headline */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="font-display text-5xl font-bold tracking-tight text-text-primary sm:text-6xl lg:text-7xl">
          {tileCount.toLocaleString()}
        </p>
        <p className="mt-2 font-display text-xl font-semibold text-text-primary sm:text-2xl">
          heartbeats. One rhythm.
        </p>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-text-secondary">
          A community-powered mosaic where every heartbeat — no matter how
          irregular — belongs.
        </p>
      </motion.div>

      {/* CTAs */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-4"
        initial={{ opacity: 0, y: 16 }}
        transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link
          className="action-link action-link-primary px-6 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          href="/onboarding"
        >
          Contribute Your ECG
        </Link>
        <Link
          className="action-link action-link-quiet px-6 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          href="/community"
        >
          Explore the Mosaic
        </Link>
      </motion.div>

      {/* ECG trace across bottom */}
      <EcgTrace className="absolute inset-x-0 bottom-12 h-12" />

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
