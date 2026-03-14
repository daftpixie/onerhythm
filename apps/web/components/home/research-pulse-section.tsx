"use client";

import { motion } from "framer-motion";
import { Globe, Search, Shield, User } from "lucide-react";
import Link from "next/link";

import { MedicalDisclaimer } from "@onerhythm/ui";

import { ResearchPulseCard } from "./research-pulse-card";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

const features = [
  { icon: Search, color: "text-signal", label: "Source-backed from peer-reviewed journals" },
  { icon: Globe, color: "text-aurora", label: "Translated into multiple languages" },
  { icon: User, color: "text-pulse", label: "Personalized to your condition profile" },
  { icon: Shield, color: "text-signal", label: "Always educational. Never diagnostic." },
];

const placeholderCards = [
  {
    slug: "afib-symptom-burden-mental-health-outcomes",
    tag: "Atrial Fibrillation",
    tagAccent: "signal" as const,
    title: "New Study Links AFib Symptom Burden to Long-Term Mental Health Outcomes",
    summary:
      "Researchers followed 1,200 patients over five years and found that self-reported symptom severity at baseline predicted anxiety and depression scores years later — even after controlling for treatment type.",
    journal: "European Heart Journal",
    date: "March 2026",
    sourceUrl: "#",
  },
  {
    slug: "remote-monitoring-reduces-icd-anxiety",
    tag: "ICD / Device",
    tagAccent: "aurora" as const,
    title: "Remote Monitoring Reduces Anxiety in ICD Patients, Multicenter Trial Finds",
    summary:
      "A randomized trial across 14 centers found that patients with continuous remote monitoring reported significantly lower device-related anxiety compared to those with standard follow-up schedules.",
    journal: "Heart Rhythm",
    date: "February 2026",
    sourceUrl: "#",
  },
  {
    slug: "arvc-exercise-guidance-consensus-2026",
    tag: "ARVC",
    tagAccent: "pulse" as const,
    title: "Exercise Guidance for ARVC Patients: Updated Consensus Statement Published",
    summary:
      "An international expert panel published updated recommendations on physical activity for people living with ARVC, emphasizing individualized risk assessment over blanket restrictions.",
    journal: "Circulation",
    date: "January 2026",
    sourceUrl: "#",
  },
];

/** Small decorative pulse line — purely decorative, not diagnostic. */
function PulseLine() {
  return (
    <div aria-hidden="true" className="mb-4 h-6 w-32 overflow-hidden opacity-40">
      <svg className="h-full w-full" viewBox="0 0 120 24" fill="none">
        <path
          d="M0,12 L20,12 L28,12 L32,4 L36,20 L40,2 L44,18 L48,10 L52,12 L72,12 L80,12 L84,4 L88,20 L92,2 L96,18 L100,10 L104,12 L120,12"
          stroke="var(--color-signal)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <animate
            attributeName="stroke-dashoffset"
            dur="3s"
            from="240"
            repeatCount="indefinite"
            to="0"
            values="240;0"
          />
          <animate
            attributeName="stroke-dasharray"
            dur="3s"
            repeatCount="indefinite"
            values="0 240;120 120;240 0"
          />
        </path>
      </svg>
    </div>
  );
}

type LiveCard = {
  slug: string;
  tag: string;
  tagAccent: "pulse" | "signal" | "aurora";
  title: string;
  summary: string;
  journal: string;
  date: string;
  sourceUrl: string;
};

export function ResearchPulseSection({ liveCards }: { liveCards?: LiveCard[] } = {}) {
  const cards = liveCards && liveCards.length > 0 ? liveCards : placeholderCards;
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
      <div className="grid gap-10 lg:grid-cols-[0.4fr_0.6fr]">
        {/* Left column — description */}
        <motion.div
          className="space-y-5"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <PulseLine />

          <h2 className="font-display text-[1.95rem] font-semibold leading-tight text-text-primary">
            Research <span className="text-signal">Pulse</span>
          </h2>

          <p className="text-xl font-medium leading-7 text-text-secondary">
            Arrhythmia research, translated for humans.
          </p>

          <p className="text-base leading-7 text-text-secondary">
            Research Pulse continuously monitors trusted academic sources for
            newly published electrophysiology and arrhythmia studies. Each paper
            is summarized in clear, non-expert language — what it found, why it
            matters, what it doesn&rsquo;t prove, and what questions it might
            help you bring to your next appointment.
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-2.5">
            {features.map((f) => (
              <span
                className="inline-flex items-center gap-1.5 text-sm text-text-secondary"
                key={f.label}
              >
                <f.icon className={`h-3.5 w-3.5 ${f.color}`} />
                {f.label}
              </span>
            ))}
          </div>

          <Link
            className="action-link action-link-quiet mt-2 inline-flex px-5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            href="/research/pulse"
          >
            Explore Latest Research →
          </Link>
        </motion.div>

        {/* Right column — preview cards */}
        <div className="space-y-5">
          {cards.map((card, i) => (
            <ResearchPulseCard
              date={card.date}
              index={i}
              journal={card.journal}
              key={card.slug}
              slug={card.slug}
              sourceUrl={card.sourceUrl}
              summary={card.summary}
              tag={card.tag}
              tagAccent={card.tagAccent}
              title={card.title}
            />
          ))}
        </div>
      </div>

      {/* Medical Disclaimer — full width, bottom of section */}
      <div className="mt-10">
        <MedicalDisclaimer />
      </div>
    </section>
  );
}
