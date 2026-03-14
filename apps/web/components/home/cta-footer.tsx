"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { MedicalDisclaimer } from "@onerhythm/ui";

export function CTAFooter() {
  return (
    <section className="relative overflow-hidden py-20">
      {/* Heartbeat gradient background at low opacity */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-20"
        style={{ background: "var(--gradient-heartbeat)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-void)" }}
      />

      <motion.div
        className="mx-auto max-w-3xl px-6 text-center sm:px-10 lg:px-12"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true, margin: "-60px" }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
          Your rhythm matters.
        </h2>
        <p className="mt-4 text-base leading-7 text-text-secondary">
          Join the mosaic. Arm yourself with knowledge. Help us change the
          numbers.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            className="action-link action-link-primary px-6 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            href="/onboarding"
          >
            Contribute Your ECG
          </Link>
          <Link
            className="action-link action-link-quiet px-6 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            href="/research/pulse"
          >
            Read the Research
          </Link>
        </div>

        <div className="mt-12">
          <MedicalDisclaimer />
        </div>
      </motion.div>
    </section>
  );
}
