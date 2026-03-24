"use client";

import { MedicalDisclaimer } from "@onerhythm/ui";

import { StatCard } from "../home/stat-card";

const metrics = [
  {
    value: "88.3%",
    description: "Moderate to extremely severe anxiety in a 2025 arrhythmia cohort",
    meaning: "The emotional burden is real enough to deserve routine attention.",
    action: "Screening, conversation, and referral pathways make a difference.",
    source: "Scientific Reports (2025) · DASS-21 screening, n=222",
    accent: "pulse" as const,
  },
  {
    value: "71.1%",
    description: "Moderate to extremely severe depression in the same cohort",
    meaning: "Depression often accompanies arrhythmia but is frequently unscreened.",
    action: "Integrating mental-health assessment into arrhythmia follow-up.",
    source: "Scientific Reports (2025) · DASS-21 screening, n=222",
    accent: "pulse" as const,
  },
  {
    value: "20%",
    description: "Symptomatic AFib patients reporting suicidal ideation",
    meaning: "Suicidal ideation in arrhythmia populations is more common than many realize.",
    action: "Integrated mental-health pathways and crisis resources save lives.",
    source: "Europace (2023) · tertiary AF cohort, n=78",
    accent: "pulse" as const,
  },
  {
    value: "22.6%",
    description: "ICD patients experiencing clinically relevant anxiety",
    meaning: "Anxiety is the most common psychological effect after ICD implantation.",
    action: "Post-implant psychological screening and support pathways.",
    source: "Systematic review · ICD populations, n=39,954",
    accent: "signal" as const,
  },
  {
    value: "32%",
    description: "ICD patients experiencing anxiety within the first five months",
    meaning: "Early onset anxiety after ICD implantation is remarkably common.",
    action: "Early screening and proactive psychological support post-implant.",
    source: "Systematic review · ICD populations, n=39,954",
    accent: "signal" as const,
  },
  {
    value: "3.2\u00d7",
    description: "Greater five-year mortality from elevated PTSD in ICD patients",
    meaning: "PTSD after device implantation has real health consequences.",
    action: "Trauma-informed support and validated screening at follow-up.",
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
              action={metric.action}
              description={metric.description}
              index={i}
              key={metric.value}
              meaning={metric.meaning}
              source={metric.source}
              value={metric.value}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
