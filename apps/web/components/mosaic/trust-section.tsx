"use client";

import { motion } from "framer-motion";

const trustPoints = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
    title: "De-identified",
    description:
      "Your ECG is stripped of all metadata and personally identifiable information before any processing begins.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
        />
      </svg>
    ),
    title: "Original destroyed",
    description:
      "The original upload is permanently deleted after the artistic transform. Only the anonymized tile remains.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
        />
      </svg>
    ),
    title: "Artistic transform",
    description:
      "The tile you see is an abstract artistic artifact. Biometric waveform fidelity is destroyed - the art cannot reconstruct your ECG.",
  },
];

const EASE_REVEAL = [0.16, 1, 0.3, 1] as const;

export function TrustSection() {
  return (
    <section className="py-16">
      <motion.h2
        className="text-center font-display text-2xl font-bold text-text-primary sm:text-3xl"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: EASE_REVEAL as unknown as [number, number, number, number] }}
      >
        Privacy by Architecture
      </motion.h2>
      <div className="mx-auto mt-10 grid max-w-4xl gap-8 sm:grid-cols-3">
        {trustPoints.map((point, i) => (
          <motion.div
            key={point.title}
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: i * 0.1,
              duration: 0.5,
              ease: EASE_REVEAL as unknown as [number, number, number, number],
            }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 text-signal">
              {point.icon}
            </div>
            <h3 className="mt-4 font-display text-base font-semibold text-text-primary">
              {point.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {point.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
