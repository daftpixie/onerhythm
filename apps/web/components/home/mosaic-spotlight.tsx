"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { HeartMosaicSVG } from "./heart-mosaic-svg";

export function MosaicSpotlight() {
  return (
    <section className="relative overflow-hidden py-20">
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-void)" }}
      />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
        {/* Mosaic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, scale: 1 }}
        >
          <HeartMosaicSVG className="mx-auto w-full max-w-lg" tileCount={200} />
        </motion.div>

        {/* Text */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 24 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
            Every Heartbeat Has a Story
          </h2>
          <p className="max-w-lg text-base leading-8 text-text-secondary">
            When you contribute your ECG to OneRhythm, your rhythm becomes part
            of something larger - a collective artwork built from individual
            heartbeats. The mosaic grows as the community grows. It is visible
            proof that the isolation need not exist..
          </p>
          <p className="max-w-lg text-sm leading-7 text-text-tertiary">
            Your ECG is de-identified and anonymized before it ever touches the
            mosaic. Privacy isn&rsquo;t a feature - it&rsquo;s the foundation.
            Every artistic trace adds to our collective rhythm distance.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              className="action-link action-link-primary inline-flex px-6 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              href="/contribute"
            >
              Add Your Heartbeat
            </Link>
            <Link
              className="action-link action-link-quiet inline-flex px-6 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              href="/mosaic"
            >
              Explore the Mosaic
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
