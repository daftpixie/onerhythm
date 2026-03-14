"use client";

import { MedicalDisclaimer } from "@onerhythm/ui";

import { StatCard } from "../home/stat-card";

const metrics = [
  {
    value: "88.3%",
    description: "Moderate to extremely severe anxiety in a 2025 arrhythmia cohort",
    source: "Nature Scientific Reports (2025), N=222",
    accent: "pulse" as const,
  },
  {
    value: "71.1%",
    description: "Moderate to extremely severe depression in the same cohort",
    source: "Nature Scientific Reports (2025), N=222",
    accent: "pulse" as const,
  },
  {
    value: "20%",
    description: "Symptomatic AFib patients reporting suicidal ideation",
    source: "AHA / Royal Melbourne Hospital",
    accent: "pulse" as const,
  },
  {
    value: "22.6%",
    description: "ICD patients experiencing clinically relevant anxiety",
    source: "EP Europace (2023), N=39,954",
    accent: "signal" as const,
  },
  {
    value: "32%",
    description: "ICD patients experiencing anxiety within the first five months",
    source: "EP Europace (2023) meta-analysis",
    accent: "signal" as const,
  },
  {
    value: "3.2\u00d7",
    description: "Greater five-year mortality from elevated PTSD in ICD patients",
    source: "Circ: Arrhythmia & Electrophysiology",
    accent: "signal" as const,
  },
];

export function EvidenceMetrics() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <MedicalDisclaimer />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, i) => (
            <StatCard
              accent={metric.accent}
              description={metric.description}
              index={i}
              key={metric.value}
              source={metric.source}
              value={metric.value}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
