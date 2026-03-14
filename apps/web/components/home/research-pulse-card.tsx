"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type ResearchPulseCardProps = {
  slug: string;
  tag: string;
  tagAccent: "pulse" | "signal" | "aurora" | "warning" | "border";
  title: string;
  summary: string;
  journal: string;
  date: string;
  sourceUrl: string;
  index?: number;
};

const accentStyles: Record<string, { bg: string; text: string }> = {
  pulse: { bg: "bg-pulse/10", text: "text-pulse" },
  signal: { bg: "bg-signal/10", text: "text-signal" },
  aurora: { bg: "bg-aurora/10", text: "text-aurora" },
  warning: { bg: "bg-warning/10", text: "text-warning" },
  border: { bg: "bg-token/20", text: "text-text-secondary" },
};

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.4,
      ease: EASE_REVEAL,
    },
  }),
};

export function ResearchPulseCard({
  slug,
  tag,
  tagAccent,
  title,
  summary,
  journal,
  date,
  sourceUrl,
  index = 0,
}: ResearchPulseCardProps) {
  const accent = accentStyles[tagAccent] ?? accentStyles.border;

  return (
    <motion.article
      className="group rounded-xl border border-token bg-cosmos p-5 transition-[background-color,box-shadow] duration-normal ease-out hover:bg-nebula hover:shadow-subtle"
      custom={index}
      initial="hidden"
      variants={cardVariants}
      viewport={{ once: true, margin: "-40px" }}
      whileInView="visible"
    >
      <span
        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${accent.bg} ${accent.text}`}
      >
        {tag}
      </span>

      <h3 className="mt-3 font-display text-lg font-semibold leading-6 text-text-primary">
        <Link
          className="hover:text-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          href={`/research/pulse/${slug}`}
        >
          {title}
        </Link>
      </h3>

      <p className="mt-2 line-clamp-3 text-sm leading-6 text-text-secondary">
        {summary}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 font-mono text-xs text-text-tertiary">
        <span>{journal}</span>
        <span aria-hidden="true">&middot;</span>
        <span>{date}</span>
        <span aria-hidden="true">&middot;</span>
        <a
          className="text-signal transition-colors duration-micro hover:text-signal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
          href={sourceUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          View source →
        </a>
      </div>

      <div
        aria-hidden="true"
        className="mt-4 h-px w-full rounded-full"
        style={{ background: "var(--gradient-signal)" }}
      />
    </motion.article>
  );
}
