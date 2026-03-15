"use client";

import { motion } from "framer-motion";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

const credentials = [
  {
    label: "Credibility",
    border: "border-pulse",
    body: "A decade of ARVC, an ICD, three shocks, seven EP lab visits, five ablations. I am not theorizing about this burden. I carried it.",
  },
  {
    label: "Commonality",
    border: "border-signal",
    body: "I shared my journey on Reddit. It has now been shared by hundreds of others. Not because my story is unique, but because it isn\u2019t. Every share was a hand raised in the dark sying - me too",
  },
  {
    label: "Problem",
    border: "border-aurora",
    body: "88.3% anxiety prevalence. 20% suicidal ideation. 3.2\u00d7 mortality from untreated PTSD. And mental health screening is still not standard practice in most EP clinics.",
  },
  {
    label: "Solution",
    border: "border-success",
    body: "A community-powered, privacy-preserving, open-source platform that brings arrhythmia patients together - not around a product, but around a shared truth: you are not alone in this.",
  },
];

const credentialVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.4,
      ease: EASE_REVEAL,
    },
  }),
};

export function ResponseSection() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-[720px] px-6 sm:px-10 lg:px-12">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-display text-[1.95rem] font-semibold text-text-primary">
            So I Built OneRhythm
          </h2>

          <div className="space-y-6 text-base leading-[1.7] text-text-secondary">
            <p>
              I brought people together for a living. In healthcare sales, I
              learned one formula: credibility, commonality, problem, solution.
              When you connect the right people around the right problem, outcomes
              change.
            </p>
            <p>
              OneRhythm is that formula applied to the crisis that almost ended
              me.
            </p>
          </div>
        </motion.div>

        {/* Credential stack */}
        <div className="mt-12 space-y-6">
          {credentials.map((cred, i) => (
            <motion.div
              className={`border-l-[3px] ${cred.border} pl-5`}
              custom={i}
              initial="hidden"
              key={cred.label}
              variants={credentialVariants}
              viewport={{ once: true, margin: "-30px" }}
              whileInView="visible"
            >
              <h3 className="font-display text-xl font-semibold text-text-primary">
                {cred.label}
              </h3>
              <p className="mt-2 text-sm leading-7 text-text-secondary">
                {cred.body}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="mt-12 text-base leading-[1.7] text-text-primary"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-40px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          OneRhythm gives arrhythmia patients a place to be seen. Not
          clinically. Humanly.
        </motion.p>
      </div>
    </section>
  );
}
