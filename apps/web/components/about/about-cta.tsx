"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { MedicalDisclaimer } from "@onerhythm/ui";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function AboutCTA() {
  return (
    <section className="bg-midnight py-12">
      <motion.div
        className="mx-auto max-w-3xl px-6 text-center sm:px-10 lg:px-12"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, ease: EASE_REVEAL }}
        viewport={{ once: true, margin: "-60px" }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-wrap items-center justify-center gap-4">
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

        <p className="mx-auto mt-10 max-w-xl text-sm leading-7 text-text-secondary">
          If you or someone you know is struggling with mental health, please
          reach out to the{" "}
          <a
            className="text-signal transition-colors duration-micro hover:text-signal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            href="tel:988"
          >
            988 Suicide &amp; Crisis Lifeline
          </a>{" "}
          (call or text 988) or the{" "}
          <a
            className="text-signal transition-colors duration-micro hover:text-signal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            href="sms:741741&body=HOME"
          >
            Crisis Text Line
          </a>{" "}
          (text HOME to 741741)
        </p>

        <div className="mt-10">
          <MedicalDisclaimer />
        </div>
      </motion.div>
    </section>
  );
}
