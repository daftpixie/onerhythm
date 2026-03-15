"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { TrendlineChart } from "./trendline-chart";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

const anxietyData = [
  { label: "2005", value: 28 },
  { label: "2010", value: 34 },
  { label: "2015", value: 42 },
  { label: "2018", value: 52 },
  { label: "2022", value: 65 },
  { label: "2025", value: 88.3 },
];

const ptsdData = [
  { label: "2005", value: 5 },
  { label: "2011", value: 8 },
  { label: "2015", value: 10 },
  { label: "2020", value: 11 },
  { label: "2023", value: 12.4 },
];

const gapData = [
  { label: "Research screening", value: 27.5 },
  { label: "Routine EHR", value: 2.5 },
];

const chartVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: EASE_REVEAL,
    },
  }),
};

export function TrendlineSection() {
  const [chartsMounted, setChartsMounted] = useState(false);

  useEffect(() => {
    setChartsMounted(true);
  }, []);

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
            The Trajectory
          </p>
          <h2 className="mt-3 font-display text-[1.95rem] font-semibold text-text-primary sm:text-4xl">
            The Wrong Direction
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">
            Compiled from published prevalence data across multiple decades of
            cardiology research.
          </p>
        </motion.div>

        <div
          className="mt-8 grid gap-6 lg:grid-cols-3"
          role="img"
          aria-label="Three charts showing rising anxiety prevalence, ICD patient PTSD prevalence, and the gap between research screening and routine clinical screening in cardiac patients"
        >
          <motion.div
            custom={0}
            initial="hidden"
            variants={chartVariants}
            viewport={{ once: true, margin: "-40px" }}
            whileInView="visible"
          >
            {chartsMounted ? (
              <TrendlineChart
                title="Anxiety Prevalence in Arrhythmia Patients"
                data={anxietyData}
                color="#FF2D55"
                caption="Sources: Multiple peer-reviewed studies 2005-2025. Not a single continuous cohort - compiled prevalence rates from published research to illustrate directional trend."
              />
            ) : (
              <div aria-hidden="true" className="h-[18.5rem] rounded-xl border border-token bg-cosmos" />
            )}
          </motion.div>

          <motion.div
            custom={1}
            initial="hidden"
            variants={chartVariants}
            viewport={{ once: true, margin: "-40px" }}
            whileInView="visible"
          >
            {chartsMounted ? (
              <TrendlineChart
                title="ICD Patient PTSD Prevalence"
                data={ptsdData}
                color="#00D4FF"
                caption="Sources: Sears & Conti 2011, EP Europace 2023 meta-analysis (N=39,954). Compiled to illustrate directional trend."
              />
            ) : (
              <div aria-hidden="true" className="h-[18.5rem] rounded-xl border border-token bg-cosmos" />
            )}
          </motion.div>

          <motion.div
            custom={2}
            initial="hidden"
            variants={chartVariants}
            viewport={{ once: true, margin: "-40px" }}
            whileInView="visible"
          >
            {chartsMounted ? (
              <TrendlineChart
                title="Detection Gap — Screening vs. Reality"
                data={gapData}
                color="#7C3AED"
                type="bar"
                caption="Percentage of cardiac patients screening positive for depression. Source: PMC 2026 review."
              />
            ) : (
              <div aria-hidden="true" className="h-[18.5rem] rounded-xl border border-token bg-cosmos" />
            )}
          </motion.div>
        </div>

        <motion.p
          className="mx-auto mt-10 max-w-2xl text-center text-base font-medium leading-7 text-text-primary"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-40px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          The research is clear. The opportunity to better support patients
          is growing. OneRhythm&rsquo;s mission is to help bridge that gap.
        </motion.p>
      </div>
    </section>
  );
}
