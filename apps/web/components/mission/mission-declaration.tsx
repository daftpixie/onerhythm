"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { BookOpen, Eye, Heart } from "lucide-react";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Pillar = {
  icon: LucideIcon;
  accent: string;
  borderColor: string;
  title: string;
  tagline: string;
  body: string;
  target: string;
  measure: string;
};

const pillars: Pillar[] = [
  {
    icon: Eye,
    accent: "text-pulse",
    borderColor: "border-l-pulse",
    title: "Visibility",
    tagline: "Name it. Measure it. Refuse to look away.",
    body: "Bring the conversation to the surface. The psychological impact of arrhythmia has been documented in every major cardiology journal on earth. 88.3% anxiety prevalence. 20% suicidal ideation. 3.2\u00d7 mortality from untreated PTSD. These numbers have names. These names have families. OneRhythm helps make them visible.",
    target: "Increase public awareness of arrhythmia-related mental health burden",
    measure: "Media citations, social reach, institutional acknowledgments",
  },
  {
    icon: Heart,
    accent: "text-signal",
    borderColor: "border-l-signal",
    title: "Community",
    tagline: "You are not alone in this.",
    body: "Loneliness and social isolation independently predict AF progression and worse cardiac outcomes. The Heart Mosaic is not decoration \u2014 it is an evidence-based intervention against isolation. Every ECG contributed is a hand raised in the dark. Every tile placed is proof that the invisible bears don\u2019t get to win.",
    target: "25,000 ECG contributions to the Heart Mosaic within 24 months",
    measure: "Mosaic growth, community engagement, patient-reported isolation reduction",
  },
  {
    icon: BookOpen,
    accent: "text-aurora",
    borderColor: "border-l-aurora",
    title: "Education",
    tagline: "Arm yourself with knowledge.",
    body: "Routine EHR depression screening catches 2.5% of cardiac patients. Research-grade screening catches 15-40%. That gap represents an opportunity to do better \u2014 and patients can help close it. OneRhythm\u2019s educational engine translates peer-reviewed research into questions you can bring to your doctor, information about medical advancements relevant to your condition, and the vocabulary to advocate for your own mental health as a partner in your care.",
    target: "Every user leaves with at least 3 evidence-based questions for their cardiologist",
    measure: "Questions generated, educational content engagement, Research Pulse utilization",
  },
];

const pillarVariants = {
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

export function MissionDeclaration() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-display text-[2.44rem] font-bold text-text-primary">
            Strength in Numbers. Unity in Execution.
          </h2>
          <p className="mt-3 text-base leading-7 text-text-secondary">
            Three pillars. One mission. Move the numbers in the other direction.
          </p>
        </motion.div>

        <div className="mt-10 space-y-6">
          {pillars.map((p, i) => (
            <motion.article
              className={`group rounded-xl border border-token ${p.borderColor} border-l-[3px] bg-cosmos p-6 transition-[background-color,box-shadow] duration-normal ease-out hover:bg-nebula hover:shadow-subtle sm:p-8`}
              custom={i}
              initial="hidden"
              key={p.title}
              variants={pillarVariants}
              viewport={{ once: true, margin: "-40px" }}
              whileInView="visible"
            >
              <div className="flex items-start gap-4">
                <p.icon className={`h-7 w-7 shrink-0 ${p.accent}`} />
                <div className="min-w-0">
                  <h3 className="font-display text-[1.56rem] font-semibold text-text-primary">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-sm italic text-signal">
                    {p.tagline}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
                    {p.body}
                  </p>

                  {/* Target metric callout */}
                  <div className="mt-5 rounded-lg border border-token bg-cosmos p-4">
                    <p className="text-xs leading-5 text-text-secondary">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                        Target:
                      </span>{" "}
                      {p.target}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-text-secondary">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                        Measure:
                      </span>{" "}
                      {p.measure}
                    </p>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
