"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { BookOpen, Heart, Shield } from "lucide-react";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Feature = {
  icon: LucideIcon;
  iconColor: string;
  accentBorder: string;
  title: string;
  body: string;
};

const features: Feature[] = [
  {
    icon: Heart,
    iconColor: "text-pulse",
    accentBorder: "border-t-pulse",
    title: "The Heart Mosaic",
    body: "Users contribute de-identified ECG images that become tiles in a collective heart artwork. Every heartbeat, no matter how irregular, is part of something beautiful. The mosaic is not diagnostic - it is a visible refusal of the isolation that arrhythmia imposes.",
  },
  {
    icon: BookOpen,
    iconColor: "text-signal",
    accentBorder: "border-t-signal",
    title: "Educational Guidance",
    body: "Based on your self-reported profile - your diagnosis, your treatment history, your lived experience - OneRhythm returns educational content and suggested questions for your next cardiology appointment. The kind of information I wish someone had given me during my decade in the dark.",
  },
  {
    icon: Shield,
    iconColor: "text-aurora",
    accentBorder: "border-t-aurora",
    title: "Privacy by Architecture",
    body: "ECG uploads are de-identified and not retained beyond processing. Consent is explicit, granular, and revocable. The architecture is open-source, MIT-licensed, and auditable. Asking people to trust you with their most sensitive data is a privilege, not a right.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.5,
      ease: EASE_REVEAL,
    },
  }),
};

export function WhatItIs() {
  return (
    <section className="bg-midnight py-12">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <motion.h2
          className="font-display text-[1.95rem] font-semibold text-text-primary sm:text-4xl"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          What OneRhythm Is
        </motion.h2>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.article
              className={`group rounded-xl border border-token ${f.accentBorder} border-t-2 bg-cosmos p-6 transition-[background-color,box-shadow] duration-normal ease-out hover:bg-nebula hover:shadow-subtle`}
              custom={i}
              initial="hidden"
              key={f.title}
              variants={cardVariants}
              viewport={{ once: true, margin: "-40px" }}
              whileInView="visible"
            >
              <f.icon className={`h-6 w-6 ${f.iconColor}`} />
              <h3 className="mt-4 font-display text-xl font-semibold text-text-primary">
                {f.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                {f.body}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
